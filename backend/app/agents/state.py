from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    complaint_text: str
    extracted_data: Optional[Dict[str, Any]]
    risk_assessment: Optional[Dict[str, Any]]
    completeness_report: Optional[Dict[str, Any]]
    duplicates: Optional[List[Dict[str, Any]]]
    root_cause: Optional[str]
    capa: Optional[str]
    summary: Optional[str]
