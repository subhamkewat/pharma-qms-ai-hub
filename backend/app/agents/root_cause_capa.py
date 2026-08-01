import json
import re
from langchain_groq import ChatGroq
from app.config import settings
from app.agents.state import AgentState

def mock_root_cause_capa(extracted_data: dict) -> tuple:
    ctype = extracted_data.get("complaint_type", "Other")
    
    if ctype == "Packaging Leakage":
        root_cause = (
            "Potential Root Cause:\n"
            "1. Blister packing sealing roller temperature dropped below the critical setpoint of 145°C, resulting in incomplete heat-lacing.\n"
            "2. Mechanical wear on the knurling tool pattern on packing line 3.\n"
            "3. Low-grade gauge thickness variation in the aluminum foil supply roll."
        )
        capa = (
            "Immediate Corrective Actions:\n"
            "- Quarantine the remaining units of the affected batch.\n"
            "- Perform a 100% visual inspection and vacuum leak test on retention samples of this batch.\n\n"
            "Preventive Actions:\n"
            "- Install automated thermal sensors with interlocked alarms on the blister sealing machine to stop production if sealing temperature drifts.\n"
            "- Update SOP-PKG-402 to include checking lamination foil width and thickness specifications at the start of each packaging run."
        )
    elif ctype == "Contamination":
        root_cause = (
            "Potential Root Cause:\n"
            "1. cleanroom environmental HVAC pressure differential drop leading to particulate ingress.\n"
            "2. Failure in gowning protocol adherence or aseptic technique by line personnel during batch changeover.\n"
            "3. Mechanical friction wear on metal-to-metal contact points in the tablet hopper feeding system."
        )
        capa = (
            "Immediate Corrective Actions:\n"
            "- Halt packaging/filling line 2 immediately and perform environment swab tests.\n"
            "- Quarantine all inventory from the affected batch. Recall if distributed.\n\n"
            "Preventive Actions:\n"
            "- Schedule immediate replacement of HEPA filters in cleanroom Area C.\n"
            "- Retrain all operators on SOP-GMP-012 (Aseptic Gowning and Material Transfer Protocols).\n"
            "- Set up metal-detector check alerts at the discharge chute of the tablet press."
        )
    elif ctype == "Inefficacy":
        root_cause = (
            "Potential Root Cause:\n"
            "1. Blending process step did not achieve active pharmaceutical ingredient (API) homogeneity due to incorrect mixer RPM settings.\n"
            "2. API degradation from exposure to humidity during bulk storage.\n"
            "3. Over-compression of tablets leading to extended dissolution times, delaying drug release."
        )
        capa = (
            "Immediate Corrective Actions:\n"
            "- Retrieve retention samples and perform full active assay testing, dissolution profile, and disintegration tests.\n"
            "- Pause release of any adjacent batches manufactured in the same campaign.\n\n"
            "Preventive Actions:\n"
            "- Implement Near-Infrared (NIR) spectroscopy in-line blend monitoring to verify blending homogeneity.\n"
            "- Establish tighter controls on compaction force parameters in the compression machine PLC software."
        )
    elif ctype == "Side Effect":
        root_cause = (
            "Potential Root Cause:\n"
            "1. Idiosyncratic patient reaction or hypersensitivity to active drug substance or excipient.\n"
            "2. Degradation impurity formation (e.g. oxidation products) above the safety threshold due to storage temperature excursion."
        )
        capa = (
            "Immediate Corrective Actions:\n"
            "- File Pharmacovigilance safety report to regulatory authorities within the mandated 15-day timeline.\n"
            "- Test retention samples for impurity profiling and chromatography evaluation.\n\n"
            "Preventive Actions:\n"
            "- Review and update warning statements on patient information leaflets regarding known side effects.\n"
            "- Verify cold-chain logistics records for the affected batch to check for temperature abuse during shipment."
        )
    elif ctype == "Labeling Error":
        root_cause = (
            "Potential Root Cause:\n"
            "1. Line clearance audit failure leading to label roll mix-up from a prior batch packaging run.\n"
            "2. Preprint artwork design error in the text block (wrong strength representation).\n"
            "3. Barcode scanner sensor bypass due to dust accumulation on the conveyor belt."
        )
        capa = (
            "Immediate Corrective Actions:\n"
            "- Perform immediate warehouse audit and quarantine mislabeled packages.\n"
            "- Re-verify label stock audit trail for the batch run.\n\n"
            "Preventive Actions:\n"
            "- Implement dual-signature verification on Line Clearance checklists before starting any packaging activity.\n"
            "- Upgrade the packaging conveyor line with online vision verification systems (OCR/OCV) linked to automatic ejectors."
        )
    else:
        root_cause = (
            "Potential Root Cause:\n"
            "General mechanical processing issue or standard material defect. Detailed investigation of batch records is required."
        )
        capa = (
            "Immediate Corrective Actions:\n"
            "- Initiate formal deviation report. Inspect remaining retention samples.\n\n"
            "Preventive Actions:\n"
            "- Audit batch manufacturing record logs for process alarms or parameter deviations."
        )
        
    return root_cause, capa

def run_root_cause_capa(state: AgentState) -> dict:
    extracted = state.get("extracted_data")
    if not extracted:
        return {"root_cause": "", "capa": ""}
        
    if not settings.GROQ_API_KEY:
        rc, capa = mock_root_cause_capa(extracted)
        return {"root_cause": rc, "capa": capa}
        
    try:
        llm = ChatGroq(
            temperature=0.2,
            model_name="gemma2-9b-it",
            groq_api_key=settings.GROQ_API_KEY
        )
        
        system_prompt = (
            "You are a Senior Quality Assurance Director and CAPA Lead in a pharmaceutical manufacturing facility. "
            "Suggest realistic Root Cause Analyses (RCA) and Corrective and Preventive Actions (CAPA) matching standard GMP guidelines (FDA/EMA)."
        )
        
        user_prompt = f"""
For the following customer complaint details, formulate:
1. Standard potential Root Causes (list 2-3 specific industrial/chemical/mechanical issues).
2. Corrective Actions (immediate containment steps).
3. Preventive Actions (long-term engineering or procedural controls).

Complaint data:
{json.dumps(extracted, indent=2)}

Format your response in markdown. Use clear subheadings for 'Potential Root Causes' and 'Suggested CAPA (Corrective & Preventive Actions)'.
"""
        response = llm.invoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        
        # Split or extract root cause & capa from the text or assign them together.
        text = response.content.strip()
        
        # Split by CAPA header if possible
        parts = re.split(r'(?=suggested capa|capa|corrective and preventive)', text, flags=re.IGNORECASE)
        
        if len(parts) >= 2:
            rc = parts[0].strip()
            capa = "".join(parts[1:]).strip()
        else:
            rc = text
            capa = "Initiate formal CAPA investigation under SOP-QA-100. Inspect retention samples and run standard laboratory testing."
            
        return {"root_cause": rc, "capa": capa}
        
    except Exception as e:
        print(f"Error in root cause CAPA node: {e}, falling back to mocks.")
        rc, capa = mock_root_cause_capa(extracted)
        return {"root_cause": rc, "capa": capa}
