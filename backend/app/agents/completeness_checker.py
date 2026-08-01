import json
from app.config import settings
from app.agents.state import AgentState

def run_completeness_checker(state: AgentState) -> dict:
    extracted = state.get("extracted_data")
    if not extracted:
        return {"completeness_report": None}
        
    # Check fields and compute completeness mathematically (highly reliable and exact)
    weights = {
        "customer_name": 10,
        "product_name": 20,
        "batch_number": 20,
        "mfg_date": 10,
        "expiry_date": 10,
        "complaint_type": 15,
        "description": 15
    }
    
    missing_fields = []
    score = 100.0
    
    # Check Customer Name
    val = extracted.get("customer_name")
    if not val or "unknown" in str(val).lower() or val == "General Patient":
        missing_fields.append("Customer Name")
        score -= weights["customer_name"]
        
    # Check Product Name
    val = extracted.get("product_name")
    if not val or "unknown" in str(val).lower():
        missing_fields.append("Product Name")
        score -= weights["product_name"]
        
    # Check Batch Number
    val = extracted.get("batch_number")
    if not val or "unknown" in str(val).lower():
        missing_fields.append("Batch Number")
        score -= weights["batch_number"]
        
    # Check Mfg Date
    val = extracted.get("mfg_date")
    if not val or "unknown" in str(val).lower():
        missing_fields.append("Manufacturing Date")
        score -= weights["mfg_date"]
        
    # Check Exp Date
    val = extracted.get("expiry_date")
    if not val or "unknown" in str(val).lower():
        missing_fields.append("Expiry Date")
        score -= weights["expiry_date"]
        
    # Check Complaint Type
    val = extracted.get("complaint_type")
    if not val or val == "Other" or "unknown" in str(val).lower():
        missing_fields.append("Complaint Type Specificity")
        score -= weights["complaint_type"]
        
    # Check Description
    val = state.get("complaint_text")
    if not val or len(val.strip()) < 10:
        missing_fields.append("Complaint Description Text")
        score -= weights["description"]
        
    score = max(0.0, score)
    
    # Generate recommendations based on what is missing
    recommendations = []
    if "Batch Number" in missing_fields:
        recommendations.append("Contact the customer immediately to obtain the Batch/Lot number from the primary vial, blister pack, or syringe. Without it, batch record review is impossible.")
    if "Expiry Date" in missing_fields or "Manufacturing Date" in missing_fields:
        recommendations.append("Query distribution records using the customer invoice to cross-reference the shipment details and retrieve associated Manufacturing/Expiry dates.")
    if "Customer Name" in missing_fields:
        recommendations.append("Update the customer record with the precise reporter details (hospital name, clinic, or private doctor) for legal pharmacovigilance logging.")
    if not missing_fields:
        recommendations.append("Complaint is fully documented. Ready for batch record review and CAPA assignment.")
        
    recommendation_text = " ".join(recommendations)
    
    completeness_report = {
        "completeness_score": score,
        "missing_fields": missing_fields,
        "recommendation": recommendation_text
    }
    
    return {"completeness_report": completeness_report}
