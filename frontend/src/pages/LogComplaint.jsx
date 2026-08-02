import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  analyzeComplaintText, 
  analyzeComplaintFile, 
  submitComplaint, 
  resetAnalyzedComplaint,
  clearError
} from '../store/complaintSlice';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Check, 
  AlertCircle,
  FileCheck,
  RotateCcw,
  ClipboardList
} from 'lucide-react';

const LogComplaint = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { analyzedComplaint, analysisStatus, analysisError } = useSelector((state) => state.complaints);
  
  const [textInput, setTextInput] = useState('');
  const [fileInput, setFileInput] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    source: 'Email',
    product_name: '',
    batch_number: '',
    mfg_date: '',
    expiry_date: '',
    complaint_type: 'Other',
    description: '',
    severity: 'Major',
    priority: 'Medium'
  });

  // Track the agent steps to display during loading
  const [agentStep, setAgentStep] = useState(0);
  const loadingSteps = [
    'Modular Extractor Agent: Parsing text parameters...',
    'Risk Assessor Agent: Assessing safety & FDA compliance profile...',
    'Completeness Checker Agent: Reviewing data integrity...',
    'Duplicate Finder Agent: Searching history for batch records...',
    'Investigation Advisor Agent: Formulating potential CAPA steps...',
    'Orchestrator: Consolidating agent node outputs...'
  ];

  useEffect(() => {
    let interval;
    if (analysisStatus === 'loading') {
      setAgentStep(0);
      interval = setInterval(() => {
        setAgentStep((prev) => (prev + 1) % loadingSteps.length);
      }, 2000);
    } else {
      setAgentStep(0);
    }
    return () => clearInterval(interval);
  }, [analysisStatus]);

  // Sync form when AI extraction succeeds
  useEffect(() => {
    if (analyzedComplaint) {
      setFormData({
        customer_name: analyzedComplaint.customer_name || '',
        source: analyzedComplaint.source || 'Email',
        product_name: analyzedComplaint.product_name || '',
        batch_number: analyzedComplaint.batch_number || '',
        mfg_date: analyzedComplaint.mfg_date || '',
        expiry_date: analyzedComplaint.expiry_date || '',
        complaint_type: analyzedComplaint.complaint_type || 'Other',
        description: analyzedComplaint.description || '',
        severity: analyzedComplaint.severity || 'Major',
        priority: analyzedComplaint.priority || 'Medium'
      });
    }
  }, [analyzedComplaint]);

  const handleTextExtract = () => {
    if (!textInput.trim()) return;
    dispatch(clearError());
    dispatch(analyzeComplaintText(textInput));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileInput(file);
      dispatch(clearError());
      dispatch(analyzeComplaintFile(file));
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Package data to include the AI generated advice as well
    const finalPayload = {
      ...formData,
      summary: analyzedComplaint?.summary,
      risk_assessment: analyzedComplaint?.risk_assessment,
      completeness_score: analyzedComplaint?.completeness_score || 0.0,
      missing_fields: analyzedComplaint?.missing_fields || [],
      duplicates: analyzedComplaint?.duplicates || [],
      root_cause_recommendation: analyzedComplaint?.root_cause_recommendation,
      capa_recommendation: analyzedComplaint?.capa_recommendation
    };

    dispatch(submitComplaint(finalPayload)).then((res) => {
      if (!res.error) {
        navigate('/history');
      }
    });
  };

  const handleReset = () => {
    dispatch(resetAnalyzedComplaint());
    setTextInput('');
    setFileInput(null);
    setFormData({
      customer_name: '',
      source: 'Email',
      product_name: '',
      batch_number: '',
      mfg_date: '',
      expiry_date: '',
      complaint_type: 'Other',
      description: '',
      severity: 'Major',
      priority: 'Medium'
    });
  };

  return (
    <div className="space-y-6 fade-in h-full flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Log Customer Complaint</h1>
          <p className="text-sm text-slate-400">Intake process with modular LangGraph intelligence</p>
        </div>
        {analyzedComplaint && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all duration-200"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Panel
          </button>
        )}
      </div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden min-h-0">
        
        {/* LEFT COLUMN: Input Paste or Drag */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2">
          
          {/* Paste Section */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-pharmablue-500" /> Pasted Complaint Email or Text
            </h3>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste raw text here (e.g. patient email, distributor alert, clinical logs)..."
              disabled={analysisStatus === 'loading' || !!analyzedComplaint}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-pharmablue-500 h-56 resize-none disabled:opacity-50"
            />
            <button
              onClick={handleTextExtract}
              disabled={analysisStatus === 'loading' || !textInput.trim() || !!analyzedComplaint}
              className="w-full py-2.5 bg-pharmablue-600 hover:bg-pharmablue-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" /> Extract details with LangGraph
            </button>
          </div>

          {/* File Upload Section */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-pharmablue-500" /> Document File Upload
            </h3>
            <label className="border border-dashed border-slate-800 hover:border-pharmablue-500/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors duration-200">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                disabled={analysisStatus === 'loading' || !!analyzedComplaint}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-slate-500" />
              <p className="text-xs font-semibold text-slate-300">
                {fileInput ? fileInput.name : 'Select or drop document'}
              </p>
              <p className="text-[10px] text-slate-500">Supports PDF, DOCX, TXT (Max 5MB)</p>
            </label>
          </div>

          {/* Extraction Loader / Logs */}
          {analysisStatus === 'loading' && (
            <div className="glass-panel rounded-2xl p-6 border-pharmablue-500/20 bg-slate-900/40 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-pharmablue-500 animate-ping"></div>
                <h4 className="text-xs font-bold text-slate-300">Active LangGraph Chain</h4>
              </div>
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/60">
                <p className="text-[11px] font-mono text-pharmablue-400 transition-all duration-300">
                  &gt; {loadingSteps[agentStep]}
                </p>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pharmablue-500 to-emerald-500 rounded-full animate-shimmer" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}

          {analysisError && (
            <div className="glass-panel rounded-2xl p-4 border-red-500/20 bg-red-950/10 flex gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold">Analysis Failed</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">{analysisError}</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Form */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between overflow-hidden">
          
          <div className="space-y-5 overflow-y-auto pr-1 flex-grow">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ClipboardList className="w-4 h-4 text-pharmablue-500" /> GMP Complaint Intake Intake
            </h3>

            {/* Completeness Alert */}
            {analyzedComplaint && (
              <div className={`p-4 rounded-xl border flex gap-3 ${
                analyzedComplaint.completeness_score >= 80 
                  ? 'bg-emerald-950/15 border-emerald-500/20 text-emerald-400' 
                  : 'bg-amber-950/15 border-amber-500/20 text-amber-400'
              }`}>
                <FileCheck className="w-5 h-5 flex-shrink-0" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold">Completeness Index: {analyzedComplaint.completeness_score}%</p>
                  </div>
                  {analyzedComplaint.missing_fields.length > 0 ? (
                    <p className="text-[10px] text-slate-400">
                      Missing: {analyzedComplaint.missing_fields.join(', ')}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400">All regulatory field requirements logged.</p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Customer */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Reporter / Customer Name</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleFormChange}
                  placeholder="e.g. John Doe, St. Jude Hospital"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pharmablue-500"
                />
              </div>

              {/* Source */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Complaint Intake Source</label>
                <input
                  type="text"
                  name="source"
                  value={formData.source}
                  onChange={handleFormChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pharmablue-500"
                />
              </div>

              {/* Product */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Product Name</label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleFormChange}
                  placeholder="e.g. Amoxicillin 500mg"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pharmablue-500"
                />
              </div>

              {/* Batch */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Batch / Lot Number</label>
                <input
                  type="text"
                  name="batch_number"
                  value={formData.batch_number}
                  onChange={handleFormChange}
                  placeholder="e.g. Lot-1234X"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pharmablue-500 font-mono"
                />
              </div>

              {/* Mfg Date */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Manufacturing Date</label>
                <input
                  type="text"
                  name="mfg_date"
                  value={formData.mfg_date}
                  onChange={handleFormChange}
                  placeholder="YYYY-MM-DD"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-pharmablue-500"
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Expiry Date</label>
                <input
                  type="text"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleFormChange}
                  placeholder="YYYY-MM-DD"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-pharmablue-500"
                />
              </div>

              {/* Type */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Complaint Defect Type</label>
                <select
                  name="complaint_type"
                  value={formData.complaint_type}
                  onChange={handleFormChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-pharmablue-500"
                >
                  <option value="Packaging Leakage">Packaging Leakage</option>
                  <option value="Contamination">Contamination</option>
                  <option value="Inefficacy">Inefficacy</option>
                  <option value="Side Effect">Side Effect</option>
                  <option value="Labeling Error">Labeling Error</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Severity */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Severity Level</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleFormChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-pharmablue-500"
                >
                  <option value="Critical">Critical</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                </select>
              </div>

              {/* Description (Full span) */}
              <div className="md:col-span-2 space-y-1">
                <label className="font-semibold text-slate-400">Detailed Complaint Narrative</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Detailed breakdown of the issue..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pharmablue-500 h-28 resize-none"
                />
              </div>
            </form>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-800 flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={analysisStatus === 'loading' || !formData.description.trim()}
              className="w-full py-3 bg-gradient-to-r from-pharmablue-600 to-pharmablue-700 hover:from-pharmablue-500 hover:to-pharmablue-600 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-pharmablue-600/20 transition-all duration-200"
            >
              <Check className="w-4 h-4" /> Save & Log Complaint Record
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LogComplaint;
