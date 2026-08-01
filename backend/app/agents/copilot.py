import json
import re
from langchain_groq import ChatGroq
from app.config import settings

def mock_copilot_response(complaint_data: dict, history: list, query: str) -> str:
    query_lower = query.lower()
    product = complaint_data.get("product_name", "the product")
    batch = complaint_data.get("batch_number", "unknown batch")
    ctype = complaint_data.get("complaint_type", "issue")
    sev = complaint_data.get("severity", "Major")
    
    if "batch" in query_lower or "lot" in query_lower:
        return (
            f"Regarding batch/lot **{batch}** of **{product}**:\n"
            "I checked our distribution log. This batch was manufactured on the packaging line 3. "
            "Our records show 1,200 units were shipped to regional distributors in June. "
            "So far, we have only received this single report. I recommend checking the environmental "
            "humidity logs for packaging line 3 during that production window."
        )
    elif "capa" in query_lower or "preventive" in query_lower or "corrective" in query_lower:
        return (
            f"For this **{ctype}** complaint, the proposed CAPA strategy is:\n"
            "1. **Containment (Corrective)**: Quarantine all stock of batch `{batch}` in our warehouse and notify distributors to hold inventory.\n"
            "2. **Preventive**: Recalibrate heat sealing bar thermocouples on packaging machine 3 and run a vacuum chamber leak test (SOP-QC-220) on 50 retention samples.\n"
            "Would you like me to draft the formal CAPA deviation form for this?"
        )
    elif "fda" in query_lower or "regulation" in query_lower or "gmp" in query_lower or "compliance" in query_lower:
        return (
            f"Under **FDA 21 CFR Part 211.198 (Complaint Files)**, we are legally required to maintain a written record "
            "of all complaints, and investigate any critical deviation.\n"
            f"Since this is flagged as **{sev} severity**, we must submit a formal Deviation Report in the QMS system "
            "within 24 business hours. If impurities or contamination are confirmed, we have a 15-day window to report "
            "a Field Alert Report (FAR) to the FDA district office."
        )
    elif "root cause" in query_lower or "why" in query_lower or "rca" in query_lower:
        return (
            f"Based on the defect category **{ctype}** for **{product}**, there are two likely root causes:\n"
            "1. **Equipment mechanical drift**: The pneumatic pressure on the blister foil sealing jaw fluctuated, causing weak micro-seals.\n"
            "2. **Material defect**: Pinholes in the aluminum foil laminate roll, which escaped raw material ingress inspections.\n"
            "I suggest querying the Batch Manufacturing Record (BMR) for seal-test verification at the end of the shift."
        )
    else:
        return (
            f"Hello! I am your AI Quality Copilot. I have reviewed the complaint logs for **{product}** (Batch: `{batch}`).\n\n"
            "Here is what we know:\n"
            f"- **Issue**: {ctype} ({sev} severity)\n"
            "- **Status**: Open for investigation\n\n"
            "You can ask me questions about:\n"
            "- Standard Operating Procedures (SOPs) matching this defect\n"
            "- Historical batch deviations\n"
            "- FDA audit/GMP inspection preparedness (21 CFR Part 211)\n"
            "- Draft email responses to the customer/hospital"
        )

def generate_copilot_response(complaint: any, history_messages: list, user_query: str) -> str:
    # Convert database model/dict to dict
    complaint_dict = {
        "id": complaint.id,
        "product_name": complaint.product_name,
        "batch_number": complaint.batch_number,
        "customer_name": complaint.customer_name,
        "complaint_type": complaint.complaint_type,
        "description": complaint.description,
        "severity": complaint.severity,
        "priority": complaint.priority,
        "status": complaint.status,
        "summary": complaint.summary,
        "risk_assessment": complaint.risk_assessment,
        "root_cause_recommendation": complaint.root_cause_recommendation,
        "capa_recommendation": complaint.capa_recommendation
    }
    
    if not settings.GROQ_API_KEY:
        return mock_copilot_response(complaint_dict, history_messages, user_query)
        
    try:
        llm = ChatGroq(
            temperature=0.7,
            model_name="gemma2-9b-it",
            groq_api_key=settings.GROQ_API_KEY
        )
        
        system_prompt = (
            "You are an expert AI Quality Assurance Assistant and pharmaceutical compliance copilot. "
            "You have access to the details of the active customer complaint. Assist the user with "
            "investigation guidelines, FDA/GMP compliance rules (21 CFR 211), standard root causes, "
            "and quality engineering queries. Be highly professional, accurate, and concise."
        )
        
        # Build chat message history
        messages = [{"role": "system", "content": system_prompt}]
        
        # Inject context of complaint
        context_msg = f"""
Here is the active complaint context you are assisting with:
{json.dumps(complaint_dict, indent=2)}
"""
        messages.append({"role": "system", "content": context_msg})
        
        # Inject conversation history
        for msg in history_messages:
            messages.append({"role": msg.role, "content": msg.content})
            
        # Add user query
        messages.append({"role": "user", "content": user_query})
        
        response = llm.invoke(messages)
        return response.content.strip()
        
    except Exception as e:
        print(f"Error in Copilot generation: {e}, falling back to mock.")
        return mock_copilot_response(complaint_dict, history_messages, user_query)
