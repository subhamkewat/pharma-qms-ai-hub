import os
import re
import datetime
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from app import crud, models, schemas
from app.db import engine, get_db
from app.utils.document_parser import extract_text_from_file
from app.agents.graph import run_complaint_analysis_workflow
from app.agents.copilot import generate_copilot_response

# Auto-create tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Pharma AI Complaint Management API",
    description="Backend service for pharmaceutical quality complaint automation",
    version="1.0.0"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify front-end domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "pharma-complaint-api"}

@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)

@app.post("/api/complaints/analyze-text", response_model=schemas.ComplaintAnalyzeResponse)
def analyze_text(request: schemas.ComplaintAnalyzeRequest):
    if not request.description.strip():
        raise HTTPException(status_code=400, detail="Description text cannot be empty")
        
    try:
        # Invoke LangGraph Workflow
        result = run_complaint_analysis_workflow(request.description)
        
        extracted = result.get("extracted_data") or {}
        risk = result.get("risk_assessment") or {}
        report = result.get("completeness_report") or {}
        
        return schemas.ComplaintAnalyzeResponse(
            customer_name=extracted.get("customer_name"),
            source="Email",
            product_name=extracted.get("product_name"),
            batch_number=extracted.get("batch_number"),
            mfg_date=extracted.get("mfg_date"),
            expiry_date=extracted.get("expiry_date"),
            complaint_type=extracted.get("complaint_type", "Other"),
            description=request.description,
            severity=extracted.get("severity", "Major"),
            priority=extracted.get("priority", "Medium"),
            summary=result.get("summary"),
            risk_assessment=risk,
            completeness_score=report.get("completeness_score", 0.0),
            missing_fields=report.get("missing_fields", []),
            duplicates=result.get("duplicates", []),
            root_cause_recommendation=result.get("root_cause"),
            capa_recommendation=result.get("capa")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Workflow Analysis failed: {str(e)}")

@app.post("/api/complaints/upload-doc", response_model=schemas.ComplaintAnalyzeResponse)
async def upload_document(file: UploadFile = File(...)):
    try:
        content = await file.read()
        extracted_text = extract_text_from_file(content, file.filename)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text content from the uploaded file.")
            
        result = run_complaint_analysis_workflow(extracted_text)
        
        extracted = result.get("extracted_data") or {}
        risk = result.get("risk_assessment") or {}
        report = result.get("completeness_report") or {}
        
        return schemas.ComplaintAnalyzeResponse(
            customer_name=extracted.get("customer_name"),
            source=f"File: {file.filename}",
            product_name=extracted.get("product_name"),
            batch_number=extracted.get("batch_number"),
            mfg_date=extracted.get("mfg_date"),
            expiry_date=extracted.get("expiry_date"),
            complaint_type=extracted.get("complaint_type", "Other"),
            description=extracted_text,
            severity=extracted.get("severity", "Major"),
            priority=extracted.get("priority", "Medium"),
            summary=result.get("summary"),
            risk_assessment=risk,
            completeness_score=report.get("completeness_score", 0.0),
            missing_fields=report.get("missing_fields", []),
            duplicates=result.get("duplicates", []),
            root_cause_recommendation=result.get("root_cause"),
            capa_recommendation=result.get("capa")
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")

def is_valid_date(date_str: Optional[str]) -> bool:
    if not date_str:
        return True
    val_clean = date_str.strip()
    if val_clean.lower() in ["unknown", "n/a", "none", ""]:
        return True
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%Y", "%Y/%m/%d", "%d-%m-%Y"):
        try:
            datetime.datetime.strptime(val_clean, fmt)
            return True
        except ValueError:
            pass
    if re.match(r'^\d{4}-\d{2}-\d{2}$', val_clean):
        return True
    return False

@app.post("/api/complaints/submit", response_model=schemas.ComplaintResponse)
def submit_complaint(complaint: schemas.ComplaintCreate, db: Session = Depends(get_db)):
    # 1. Product Name Validation
    if not complaint.product_name or complaint.product_name.strip().lower() in ["", "unknown product", "unknown"]:
        raise HTTPException(status_code=400, detail="Validation Warning: Product Name must be explicitly extracted and matches medicine info.")
        
    # 2. Batch Number Validation
    if not complaint.batch_number or complaint.batch_number.strip().lower() in ["number", "no", "", "unknown batch", "unknown"]:
        raise HTTPException(status_code=400, detail="Validation Warning: Batch Number cannot be generic placeholder like 'Number' or 'No'. Please input a valid batch code.")
        
    # 3. Expiry Date Validation
    if not is_valid_date(complaint.expiry_date):
        raise HTTPException(status_code=400, detail="Validation Warning: Expiry Date must be a valid calendar date format (e.g. YYYY-MM-DD).")
        
    # 4. Manufacturing Date Validation
    if not is_valid_date(complaint.mfg_date):
        raise HTTPException(status_code=400, detail="Validation Warning: Manufacturing Date must be a valid calendar date format (e.g. YYYY-MM-DD).")

    return crud.create_complaint(db, complaint)

@app.get("/api/complaints/history", response_model=List[schemas.ComplaintResponse])
def read_complaints(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    severity: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud.get_complaints(db, skip=skip, limit=limit, search=search, severity=severity, priority=priority, status=status)

@app.get("/api/complaints/{id}", response_model=schemas.ComplaintResponse)
def read_complaint_details(id: int, db: Session = Depends(get_db)):
    db_complaint = crud.get_complaint(db, id)
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return db_complaint

@app.put("/api/complaints/{id}", response_model=schemas.ComplaintResponse)
def update_complaint_details(id: int, complaint_update: schemas.ComplaintUpdate, db: Session = Depends(get_db)):
    db_complaint = crud.update_complaint(db, id, complaint_update)
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return db_complaint

@app.delete("/api/complaints/{id}")
def delete_complaint(id: int, db: Session = Depends(get_db)):
    success = crud.delete_complaint(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {"message": "Complaint deleted successfully", "id": id}

@app.get("/api/complaints/{id}/copilot", response_model=List[schemas.CopilotMessageResponse])
def get_chat_history(id: int, db: Session = Depends(get_db)):
    # Verify complaint exists
    db_complaint = crud.get_complaint(db, id)
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return crud.get_copilot_messages(db, id)

@app.post("/api/complaints/{id}/copilot", response_model=schemas.CopilotMessageResponse)
def chat_with_copilot(id: int, message: schemas.CopilotMessageCreate, db: Session = Depends(get_db)):
    # Verify complaint exists
    db_complaint = crud.get_complaint(db, id)
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    # 1. Log the user message in the database
    crud.create_copilot_message(db, message, id)
    
    # 2. Get full chat history (excluding current question since we just saved it, or we can fetch all)
    history = crud.get_copilot_messages(db, id)
    
    # 3. Generate response using AI Copilot module
    # history[-1] is the user message we just saved
    response_content = generate_copilot_response(db_complaint, history[:-1], message.content)
    
    # 4. Save and return the assistant response
    assistant_msg = schemas.CopilotMessageCreate(role="assistant", content=response_content)
    db_assistant_msg = crud.create_copilot_message(db, assistant_msg, id)
    
    return db_assistant_msg

if __name__ == "__main__":
    import uvicorn
    from app.config import settings
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
