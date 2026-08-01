import os
import json
import re
from langchain_groq import ChatGroq
from app.config import settings
from app.agents.state import AgentState

def normalize_date(val: str) -> str:
    if not val:
        return val
    val_clean = val.strip()
    
    # Check if already YYYY-MM-DD
    if re.match(r'^\d{4}-\d{2}-\d{2}$', val_clean):
        return val_clean
        
    # Check if MM/YYYY or MM-YYYY
    m_year = re.match(r'^(\d{2})[/-](\d{4})$', val_clean)
    if m_year:
        return f"{m_year.group(2)}-{m_year.group(1)}-01"
        
    # Check if YYYY/MM/DD or DD/MM/YYYY or MM/DD/YYYY
    m_dmy = re.match(r'^(\d{2})[/-](\d{2})[/-](\d{4})$', val_clean)
    if m_dmy:
        # standard fallback to YYYY-MM-DD
        return f"{m_dmy.group(3)}-{m_dmy.group(2)}-{m_dmy.group(1)}"
        
    return val_clean

def mock_extract(text: str) -> dict:
    text_lower = text.lower()
    
    # Robust field extraction matching colon separator and ignoring generic names
    def extract_field(keywords, ignore=[]):
        for line in text.split("\n"):
            line_strip = line.strip()
            for kw in keywords:
                # Require colon, equal, or dash separator after keyphrase
                pattern = rf'(?:^|[\s,;]){re.escape(kw)}\s*[:=-]\s*(.*)'
                match = re.search(pattern, line_strip, re.IGNORECASE)
                if match:
                    val = match.group(1).strip()
                    val = re.sub(r'^[#"\'\s]+|[#"\'\s]+$', '', val)
                    if val.lower() not in [x.lower() for x in ignore] and val != "":
                        return val
        return None
        
    product = extract_field(["product name", "product", "medicine name", "medicine", "drug name", "drug"])
    if not product:
        if "amoxicillin" in text_lower:
            product = "Amoxicillin 500mg Capsule"
        elif "lipitor" in text_lower:
            product = "Lipitor 20mg Tablet"
        elif "paracetamol" in text_lower:
            # Check for specific dosage present in text
            dosage_match = re.search(r'paracetamol\s*\d+\s*m?g(?:\s*tablet)?', text, re.IGNORECASE)
            if dosage_match:
                product = dosage_match.group(0)
            else:
                product = "Paracetamol 500mg Tablet"
        else:
            product = "Unknown Product"
            
    batch = extract_field(["batch number", "batch no", "batch", "lot number", "lot no", "lot"], ignore=["number", "no"])
    if not batch:
        batch = "Unknown Batch"
        
    mfg_date = extract_field(["manufacturing date", "mfg date", "mfg", "manufactured date", "manufactured"])
    mfg_date = normalize_date(mfg_date)
    
    expiry_date = extract_field(["expiry date", "expiration date", "expiry", "exp date", "exp"])
    expiry_date = normalize_date(expiry_date)
    
    customer = extract_field(["customer name", "customer", "reporter name", "reporter", "patient name", "patient", "from"])
    if not customer:
        customer = "General Patient"
        
    # Map Complaint Type & Severity based on text keywords
    complaint_type = "Other"
    severity = "Major"
    priority = "Medium"
    
    if "broken" in text_lower or "damaged" in text_lower or "leak" in text_lower or "seal" in text_lower:
        complaint_type = "Packaging Leakage"
        severity = "Critical"
        priority = "High"
    elif "black spot" in text_lower or "particle" in text_lower or "contamination" in text_lower or "mold" in text_lower:
        complaint_type = "Contamination"
        severity = "Critical"
        priority = "High"
    elif "work" in text_lower or "no effect" in text_lower or "inefficacy" in text_lower:
        complaint_type = "Inefficacy"
        severity = "Major"
        priority = "High"
    elif "rash" in text_lower or "vomit" in text_lower or "side effect" in text_lower or "hospital" in text_lower:
        complaint_type = "Side Effect"
        severity = "Critical"
        priority = "High"
    elif "label" in text_lower or "misprint" in text_lower:
        complaint_type = "Labeling Error"
        severity = "Major"
        priority = "Medium"
        
    summary = f"Complaint logged regarding {product} (Batch: {batch}). Customer reports: {text[:100]}..."
    
    return {
        "customer_name": customer,
        "complaint_source": "Email",
        "product_name": product,
        "batch_number": batch,
        "mfg_date": mfg_date,
        "expiry_date": expiry_date,
        "complaint_type": complaint_type,
        "severity": severity,
        "priority": priority,
        "summary": summary
    }

def run_extractor(state: AgentState) -> dict:
    text = state["complaint_text"]
    
    if not settings.GROQ_API_KEY:
        extracted = mock_extract(text)
        return {"extracted_data": extracted, "summary": extracted["summary"]}
        
    try:
        llm = ChatGroq(
            temperature=0.0,
            model_name="gemma2-9b-it",
            groq_api_key=settings.GROQ_API_KEY
        )
        
        system_prompt = (
            "You are an information extractor. Extract only the information explicitly present. "
            "Do not infer. Do not rewrite. Do not correct. Do not change dosages. Return exact values. "
            "Do not include markdown wraps (such as ```json) or conversational intro/outro. Respond ONLY with a valid JSON object."
        )
        
        user_prompt = f"""
Extract the following fields from the pharmaceutical customer complaint text below.
If a field is not present, set it to null.

JSON fields to return:
- customer_name: string (Who is raising the complaint? Hospital, patient, distributor, doctor)
- complaint_source: string (e.g. Email, Portal, Call, Fax)
- product_name: string (Brand or generic name of medicine. Include exact dosage like 500mg, do not change it)
- batch_number: string (Batch or Lot number. Extract the exact value, do not extract the word 'Number')
- mfg_date: string (Manufacturing date. Convert to YYYY-MM-DD when possible)
- expiry_date: string (Expiry/Expiration date. Convert to YYYY-MM-DD when possible)
- complaint_type: string (Must be one of: "Packaging Leakage", "Contamination", "Inefficacy", "Side Effect", "Labeling Error", "Other")
- severity: string (Must be one of: "Critical" [broken/damaged tablets, contamination, safety danger, adverse reaction], "Major", "Minor")
- priority: string (Must be one of: "High", "Medium", "Low")
- summary: string (A concise 1-2 sentence executive summary of the issue)

Complaint Text:
\"\"\"
{text}
\"\"\"

Format response strictly as valid JSON, with null for any missing details. Do not write markdown blocks.
"""
        response = llm.invoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        
        clean_content = response.content.strip()
        if clean_content.startswith("```"):
            clean_content = re.sub(r"^```(?:json)?\n", "", clean_content)
            clean_content = re.sub(r"\n```$", "", clean_content)
            clean_content = clean_content.strip()
            
        data = json.loads(clean_content)
        
        # Standardize dates in LLM response if present
        if data.get("mfg_date"):
            data["mfg_date"] = normalize_date(data["mfg_date"])
        if data.get("expiry_date"):
            data["expiry_date"] = normalize_date(data["expiry_date"])
            
        return {"extracted_data": data, "summary": data.get("summary", "")}
        
    except Exception as e:
        print(f"Error in extractor node: {e}, falling back to mock extraction.")
        extracted = mock_extract(text)
        return {"extracted_data": extracted, "summary": extracted["summary"]}
