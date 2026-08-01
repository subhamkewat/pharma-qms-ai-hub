import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, index=True, nullable=True)
    source = Column(String, default="Email")
    product_name = Column(String, index=True, nullable=True)
    batch_number = Column(String, index=True, nullable=True)
    mfg_date = Column(String, nullable=True)
    expiry_date = Column(String, nullable=True)
    complaint_type = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    severity = Column(String, default="Major") # Critical, Major, Minor
    priority = Column(String, default="Medium") # High, Medium, Low
    status = Column(String, default="New") # New, Under Investigation, CAPA Initiated, Closed
    logged_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # AI Analysis Results
    summary = Column(Text, nullable=True)
    risk_assessment = Column(JSON, nullable=True) # {safety_risk: bool, regulatory_risk: bool, justification: str}
    completeness_score = Column(Float, default=0.0)
    missing_fields = Column(JSON, nullable=True) # list of strings
    duplicates = Column(JSON, nullable=True) # list of {id, product_name, similarity, description}
    root_cause_recommendation = Column(Text, nullable=True)
    capa_recommendation = Column(Text, nullable=True)
    
    # QA Analyst resolution fields
    root_cause_actual = Column(Text, nullable=True)
    capa_actual = Column(Text, nullable=True)

    messages = relationship("CopilotMessage", back_populates="complaint", cascade="all, delete-orphan")


class CopilotMessage(Base):
    __tablename__ = "copilot_messages"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    role = Column(String, nullable=False) # "user", "assistant"
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    complaint = relationship("Complaint", back_populates="messages")
