from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app import models, schemas
import datetime

def get_complaint(db: Session, complaint_id: int):
    return db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()

def get_complaints(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    search: str = None, 
    severity: str = None, 
    priority: str = None, 
    status: str = None
):
    query = db.query(models.Complaint)
    
    if search:
        query = query.filter(
            or_(
                models.Complaint.customer_name.ilike(f"%{search}%"),
                models.Complaint.product_name.ilike(f"%{search}%"),
                models.Complaint.batch_number.ilike(f"%{search}%"),
                models.Complaint.description.ilike(f"%{search}%"),
            )
        )
    
    if severity:
        query = query.filter(models.Complaint.severity == severity)
        
    if priority:
        query = query.filter(models.Complaint.priority == priority)
        
    if status:
        query = query.filter(models.Complaint.status == status)
        
    return query.order_by(models.Complaint.logged_at.desc()).offset(skip).limit(limit).all()

def create_complaint(db: Session, complaint: schemas.ComplaintCreate):
    db_complaint = models.Complaint(
        customer_name=complaint.customer_name,
        source=complaint.source,
        product_name=complaint.product_name,
        batch_number=complaint.batch_number,
        mfg_date=complaint.mfg_date,
        expiry_date=complaint.expiry_date,
        complaint_type=complaint.complaint_type,
        description=complaint.description,
        severity=complaint.severity,
        priority=complaint.priority,
        status=complaint.status,
        summary=complaint.summary,
        risk_assessment=complaint.risk_assessment,
        completeness_score=complaint.completeness_score,
        missing_fields=complaint.missing_fields,
        duplicates=complaint.duplicates,
        root_cause_recommendation=complaint.root_cause_recommendation,
        capa_recommendation=complaint.capa_recommendation
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

def update_complaint(db: Session, complaint_id: int, complaint_update: schemas.ComplaintUpdate):
    db_complaint = get_complaint(db, complaint_id)
    if not db_complaint:
        return None
        
    update_data = complaint_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_complaint, key, value)
        
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

def delete_complaint(db: Session, complaint_id: int):
    db_complaint = get_complaint(db, complaint_id)
    if not db_complaint:
        return False
    db.delete(db_complaint)
    db.commit()
    return True

def get_dashboard_stats(db: Session):
    total = db.query(models.Complaint).count()
    critical = db.query(models.Complaint).filter(models.Complaint.severity == "Critical").count()
    
    # Calculate average completeness score
    avg_score = db.query(func.avg(models.Complaint.completeness_score)).scalar() or 0.0
    avg_score = round(float(avg_score), 2)
    
    # Group counts
    status_group = db.query(models.Complaint.status, func.count(models.Complaint.id)).group_by(models.Complaint.status).all()
    severity_group = db.query(models.Complaint.severity, func.count(models.Complaint.id)).group_by(models.Complaint.severity).all()
    priority_group = db.query(models.Complaint.priority, func.count(models.Complaint.id)).group_by(models.Complaint.priority).all()
    
    status_counts = {"New": 0, "Under Investigation": 0, "CAPA Initiated": 0, "Closed": 0}
    for status, count in status_group:
        if status in status_counts:
            status_counts[status] = count
            
    severity_counts = {"Critical": 0, "Major": 0, "Minor": 0}
    for sev, count in severity_group:
        if sev in severity_counts:
            severity_counts[sev] = count
            
    priority_counts = {"High": 0, "Medium": 0, "Low": 0}
    for prio, count in priority_group:
        if prio in priority_counts:
            priority_counts[prio] = count

    recent = db.query(models.Complaint).order_by(models.Complaint.logged_at.desc()).limit(5).all()
    
    return schemas.DashboardStats(
        total_complaints=total,
        critical_complaints=critical,
        avg_completeness_score=avg_score,
        status_counts=status_counts,
        severity_counts=severity_counts,
        priority_counts=priority_counts,
        recent_activity=recent
    )

def create_copilot_message(db: Session, message: schemas.CopilotMessageCreate, complaint_id: int):
    db_msg = models.CopilotMessage(
        complaint_id=complaint_id,
        role=message.role,
        content=message.content
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg

def get_copilot_messages(db: Session, complaint_id: int):
    return db.query(models.CopilotMessage).filter(models.CopilotMessage.complaint_id == complaint_id).order_by(models.CopilotMessage.timestamp.asc()).all()
