from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime

class CopilotMessageBase(BaseModel):
    role: str
    content: str

class CopilotMessageCreate(CopilotMessageBase):
    pass

class CopilotMessageResponse(CopilotMessageBase):
    id: int
    complaint_id: int
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ComplaintBase(BaseModel):
    customer_name: Optional[str] = None
    source: str = "Email"
    product_name: Optional[str] = None
    batch_number: Optional[str] = None
    mfg_date: Optional[str] = None
    expiry_date: Optional[str] = None
    complaint_type: Optional[str] = None
    description: str
    severity: str = "Major"
    priority: str = "Medium"
    status: str = "New"

class ComplaintCreate(ComplaintBase):
    summary: Optional[str] = None
    risk_assessment: Optional[Dict[str, Any]] = None
    completeness_score: float = 0.0
    missing_fields: Optional[List[str]] = None
    duplicates: Optional[List[Dict[str, Any]]] = None
    root_cause_recommendation: Optional[str] = None
    capa_recommendation: Optional[str] = None

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    root_cause_actual: Optional[str] = None
    capa_actual: Optional[str] = None

class ComplaintResponse(ComplaintBase):
    id: int
    logged_at: datetime
    summary: Optional[str] = None
    risk_assessment: Optional[Dict[str, Any]] = None
    completeness_score: float
    missing_fields: Optional[List[str]] = None
    duplicates: Optional[List[Dict[str, Any]]] = None
    root_cause_recommendation: Optional[str] = None
    capa_recommendation: Optional[str] = None
    root_cause_actual: Optional[str] = None
    capa_actual: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class ComplaintAnalyzeRequest(BaseModel):
    description: str

class ComplaintAnalyzeResponse(BaseModel):
    customer_name: Optional[str] = None
    source: str = "Email"
    product_name: Optional[str] = None
    batch_number: Optional[str] = None
    mfg_date: Optional[str] = None
    expiry_date: Optional[str] = None
    complaint_type: Optional[str] = None
    description: str
    severity: str = "Major"
    priority: str = "Medium"
    
    # AI Extractions
    summary: Optional[str] = None
    risk_assessment: Optional[Dict[str, Any]] = None
    completeness_score: float = 0.0
    missing_fields: Optional[List[str]] = None
    duplicates: Optional[List[Dict[str, Any]]] = None
    root_cause_recommendation: Optional[str] = None
    capa_recommendation: Optional[str] = None

class DashboardStats(BaseModel):
    total_complaints: int
    critical_complaints: int
    avg_completeness_score: float
    status_counts: Dict[str, int]
    severity_counts: Dict[str, int]
    priority_counts: Dict[str, int]
    recent_activity: List[ComplaintResponse]
