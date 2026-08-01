import json
import re
from langchain_groq import ChatGroq
from app.config import settings
from app.agents.state import AgentState

def mock_risk_assessment(extracted_data: dict) -> dict:
    ctype = extracted_data.get("complaint_type", "Other")
    product = extracted_data.get("product_name", "Unknown Product")
    severity = extracted_data.get("severity", "Major")
    
    safety_risk = False
    regulatory_risk = False
    gmp_impact = "Medium"
    justification = ""
    
    if ctype == "Contamination":
        safety_risk = True
        regulatory_risk = True
        gmp_impact = "High"
        justification = (
            f"The report indicates potential contamination in {product}. Any foreign particulate, mold, or chemical contamination "
            "directly threatens patient safety. Under FDA 21 CFR 211.113, this requires immediate batch quarantine, "
            "investigation of sterile/environmental controls, and poses a high risk of product recall."
        )
    elif ctype == "Side Effect":
        safety_risk = True
        regulatory_risk = True
        gmp_impact = "High"
        justification = (
            f"Adverse patient reaction (Side Effect) reported. This poses immediate patient safety concerns. "
            "Pharmacovigilance guidelines mandate reporting serious side effects to regulatory bodies (e.g. FDA MedWatch) within 15 days. "
            "Requires medical safety review and batch active ingredient assay."
        )
    elif ctype == "Inefficacy":
        safety_risk = True
        regulatory_risk = True
        gmp_impact = "High"
        justification = (
            f"Inefficacy of {product} reported. In therapeutic classes, drug failure is a safety risk as the patient's underlying "
            "condition goes untreated. This requires immediate investigation into active pharmaceutical ingredient (API) dosage, dissolution, and formulation stability."
        )
    elif ctype == "Packaging Leakage":
        safety_risk = False
        regulatory_risk = True
        gmp_impact = "Medium"
        justification = (
            f"Packaging leakage compromises container-closure integrity. If the product is sterile, breach of sterile barrier is critical. "
            "If oral solid dosage, leakage increases moisture exposure leading to degradation. Represents a violation of 21 CFR 211.94."
        )
    elif ctype == "Labeling Error":
        safety_risk = False
        regulatory_risk = True
        gmp_impact = "High"
        justification = (
            "Labeling errors (misprints, incorrect strength, or missing warnings) are one of the leading causes of FDA recalls. "
            "Direct violation of 21 CFR 211.122 label controls. High risk of patient misdosing."
        )
    else:
        # Other / default
        if severity == "Critical":
            safety_risk = True
            regulatory_risk = True
            gmp_impact = "High"
            justification = "Severity classified as Critical by QA. Poses safety risks and GMP compliance issues."
        elif severity == "Major":
            safety_risk = False
            regulatory_risk = True
            gmp_impact = "Medium"
            justification = "Major defect reported. Poses potential regulatory risk under GMP audits."
        else:
            safety_risk = False
            regulatory_risk = False
            gmp_impact = "Low"
            justification = "Cosmetic or minor defect. Low GMP risk, does not impact product efficacy or safety."

    return {
        "safety_risk": safety_risk,
        "regulatory_risk": regulatory_risk,
        "gmp_impact": gmp_impact,
        "justification": justification
    }

def run_risk_assessment(state: AgentState) -> dict:
    extracted = state.get("extracted_data")
    if not extracted:
        return {"risk_assessment": None}
        
    if not settings.GROQ_API_KEY:
        # Fallback
        risk = mock_risk_assessment(extracted)
        return {"risk_assessment": risk}
        
    try:
        llm = ChatGroq(
            temperature=0.0,
            model_name="gemma2-9b-it",
            groq_api_key=settings.GROQ_API_KEY
        )
        
        system_prompt = (
            "You are a pharmaceutical regulatory compliance director expert in FDA GMP (21 CFR Part 211). "
            "You must perform a detailed risk assessment on a complaint extraction and return ONLY a valid JSON object."
        )
        
        user_prompt = f"""
Evaluate the risk profile of the following extracted customer complaint data.
Extract details:
{json.dumps(extracted, indent=2)}

Determine:
- safety_risk: boolean (True if patient safety, health, or life is compromised, e.g. side effects, contamination, inefficacy of key meds)
- regulatory_risk: boolean (True if it violates 21 CFR 211, FDA rules, or is subject to potential recalls/inspections)
- gmp_impact: string (One of: "High", "Medium", "Low")
- justification: string (A thorough, professional 3-4 sentence explanation quoting GMP considerations, sterile barrier integrity, active assay, or pharmacovigilance filing where applicable)

Response must be strictly valid JSON. Do not include markdown wraps or conversational intro/outro.
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
        return {"risk_assessment": data}
        
    except Exception as e:
        print(f"Error in risk assessment node: {e}, falling back to mock risk assessment.")
        risk = mock_risk_assessment(extracted)
        return {"risk_assessment": risk}
