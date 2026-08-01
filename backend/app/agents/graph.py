from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.extractor import run_extractor
from app.agents.risk_assessment import run_risk_assessment
from app.agents.completeness_checker import run_completeness_checker
from app.agents.duplicate_detector import run_duplicate_detector
from app.agents.root_cause_capa import run_root_cause_capa

def create_workflow():
    workflow = StateGraph(AgentState)
    
    # Register nodes
    workflow.add_node("extractor", run_extractor)
    workflow.add_node("risk_assessor", run_risk_assessment)
    workflow.add_node("completeness_checker", run_completeness_checker)
    workflow.add_node("duplicate_detector", run_duplicate_detector)
    workflow.add_node("rc_capa_advisor", run_root_cause_capa)
    
    # Establish edges (linear workflow)
    workflow.set_entry_point("extractor")
    workflow.add_edge("extractor", "risk_assessor")
    workflow.add_edge("risk_assessor", "completeness_checker")
    workflow.add_edge("completeness_checker", "duplicate_detector")
    workflow.add_edge("duplicate_detector", "rc_capa_advisor")
    workflow.add_edge("rc_capa_advisor", END)
    
    # Compile
    return workflow.compile()

compiled_graph = create_workflow()

def run_complaint_analysis_workflow(text: str) -> dict:
    initial_state = {
        "complaint_text": text,
        "extracted_data": None,
        "risk_assessment": None,
        "completeness_report": None,
        "duplicates": [],
        "root_cause": "",
        "capa": "",
        "summary": ""
    }
    
    result = compiled_graph.invoke(initial_state)
    return result
