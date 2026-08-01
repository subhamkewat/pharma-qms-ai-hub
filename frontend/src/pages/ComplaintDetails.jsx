import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchComplaintById, 
  updateComplaint, 
  deleteComplaint,
  fetchCopilotMessages,
  sendMessageToCopilot,
  addLocalCopilotMessage
} from '../store/complaintSlice';
import { 
  ShieldAlert, 
  FlaskConical, 
  Archive, 
  Wrench, 
  Trash2, 
  Check, 
  Calendar,
  Layers,
  Sparkles,
  MessageSquareCode,
  Send,
  Loader
} from 'lucide-react';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { selectedComplaint, status, copilotMessages, copilotStatus } = useSelector((state) => state.complaints);
  const [activeTab, setActiveTab] = useState('rca-capa'); // rca-capa | copilot
  
  // Local states for QA edits
  const [qmsStatus, setQmsStatus] = useState('New');
  const [actualRootCause, setActualRootCause] = useState('');
  const [actualCapa, setActualCapa] = useState('');
  
  // Copilot input state
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    dispatch(fetchComplaintById(id));
    dispatch(fetchCopilotMessages(id));
  }, [dispatch, id]);

  // Sync edit states when data loads
  useEffect(() => {
    if (selectedComplaint) {
      setQmsStatus(selectedComplaint.status || 'New');
      setActualRootCause(selectedComplaint.root_cause_actual || '');
      setActualCapa(selectedComplaint.capa_actual || '');
    }
  }, [selectedComplaint]);

  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages]);

  const handleUpdateDetails = () => {
    dispatch(updateComplaint({
      id,
      updateData: {
        status: qmsStatus,
        root_cause_actual: actualRootCause,
        capa_actual: actualCapa
      }
    }));
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this complaint record from the database? This action is irreversible.")) {
      dispatch(deleteComplaint(id)).then(() => {
        navigate('/history');
      });
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || copilotStatus === 'loading') return;
    
    const textToSend = chatInput;
    setChatInput('');
    
    // 1. Instantly append to local chat for fluid UX
    dispatch(addLocalCopilotMessage({ role: 'user', content: textToSend }));
    
    // 2. Dispatch thunk to send to API
    dispatch(sendMessageToCopilot({ id, content: textToSend }));
  };

  if (status === 'loading' || !selectedComplaint) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-pharmablue-500 animate-spin" />
        <span className="ml-2 text-xs font-semibold text-slate-400">Loading complaint investigation profile...</span>
      </div>
    );
  }

  const severityColors = {
    Critical: 'bg-red-500/10 border-red-500/20 text-red-400',
    Major: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    Minor: 'bg-pharmablue-500/10 border-pharmablue-500/20 text-pharmablue-400',
  };

  const statusColors = {
    'New': 'bg-violet-500/15 border-violet-500/20 text-violet-400',
    'Under Investigation': 'bg-amber-500/15 border-amber-500/20 text-amber-400',
    'CAPA Initiated': 'bg-pharmablue-500/15 border-pharmablue-500/20 text-pharmablue-400',
    'Closed': 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400',
  };

  return (
    <div className="space-y-6 fade-in h-full flex flex-col">
      {/* Detail header */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-500">CASE PROFILE #{selectedComplaint.id}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[selectedComplaint.status]}`}>
              {selectedComplaint.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            {selectedComplaint.product_name || 'Generic Pharmaceutical Product'}
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Batch Code: {selectedComplaint.batch_number || 'UNKNOWN_BATCH'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={qmsStatus}
            onChange={(e) => setQmsStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-medium focus:outline-none focus:border-pharmablue-500"
          >
            <option value="New">Status: New</option>
            <option value="Under Investigation">Status: Investigating</option>
            <option value="CAPA Initiated">Status: CAPA Initiated</option>
            <option value="Closed">Status: Closed</option>
          </select>

          <button
            onClick={handleUpdateDetails}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-pharmablue-600 hover:bg-pharmablue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-pharmablue-600/20 transition-all duration-200"
          >
            <Check className="w-3.5 h-3.5" /> Save Changes
          </button>
          
          <button
            onClick={handleDelete}
            className="flex items-center justify-center p-2 bg-slate-900 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-xl transition-colors duration-200"
            title="Delete Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main detail columns splits */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden min-h-0">
        
        {/* LEFT COLUMN: Metadata, Narrative & Risk Assessment */}
        <div className="space-y-6 overflow-y-auto pr-2">
          
          {/* Intake Info Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Calendar className="w-4 h-4 text-pharmablue-500" /> Intake Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-0.5">
                <p className="text-slate-500 font-medium">Customer / Reporter</p>
                <p className="font-semibold text-slate-200">{selectedComplaint.customer_name || 'N/A'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-500 font-medium">Source</p>
                <p className="font-semibold text-slate-200">{selectedComplaint.source || 'N/A'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-500 font-medium">Manufacturing Date</p>
                <p className="font-semibold text-slate-200 font-mono">{selectedComplaint.mfg_date || 'N/A'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-500 font-medium">Expiry Date</p>
                <p className="font-semibold text-slate-200 font-mono">{selectedComplaint.expiry_date || 'N/A'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-500 font-medium">Severity Classification</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${severityColors[selectedComplaint.severity]}`}>
                  {selectedComplaint.severity}
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-500 font-medium">Priority Ranking</p>
                <span className="font-semibold text-slate-200">{selectedComplaint.priority}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <p className="text-xs font-semibold text-slate-400">Intake Complaint Text</p>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                {selectedComplaint.description}
              </div>
            </div>
          </div>

          {/* AI Risk Assessment Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <ShieldAlert className="w-4 h-4 text-pharmablue-500" /> AI Risk Assessment
            </h3>
            
            {selectedComplaint.risk_assessment ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl text-center space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500">GMP Impact</p>
                    <p className={`font-bold ${
                      selectedComplaint.risk_assessment.gmp_impact === 'High' ? 'text-red-400' : 'text-amber-400'
                    }`}>{selectedComplaint.risk_assessment.gmp_impact}</p>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl text-center space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500">Safety Hazard</p>
                    <p className={`font-bold ${
                      selectedComplaint.risk_assessment.safety_risk ? 'text-red-400' : 'text-slate-400'
                    }`}>{selectedComplaint.risk_assessment.safety_risk ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl text-center space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500">Regulatory Hold</p>
                    <p className={`font-bold ${
                      selectedComplaint.risk_assessment.regulatory_risk ? 'text-amber-400' : 'text-slate-400'
                    }`}>{selectedComplaint.risk_assessment.regulatory_risk ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-slate-400">Risk Justification:</p>
                  <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                    {selectedComplaint.risk_assessment.justification}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No risk assessment generated.</p>
            )}
          </div>

          {/* Duplicate Complaints Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Layers className="w-4 h-4 text-pharmablue-500" /> Duplicate Complaint Index
            </h3>
            
            {selectedComplaint.duplicates && selectedComplaint.duplicates.length > 0 ? (
              <div className="space-y-3">
                {selectedComplaint.duplicates.map((dup, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">Case #{dup.id} - {dup.product_name}</span>
                      <span className="px-2 py-0.5 bg-pharmablue-600/10 text-pharmablue-400 border border-pharmablue-500/20 rounded-full text-[10px]">
                        {dup.similarity}% Similarity
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
                      Reasons: {dup.reasons}
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      {dup.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No duplicates detected in historical database.</p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Tab Panel (RCA/CAPA vs Copilot) */}
        <div className="glass-panel rounded-2xl flex flex-col overflow-hidden">
          {/* Tab buttons */}
          <div className="flex-shrink-0 flex border-b border-slate-800 bg-slate-900/60 p-2 gap-2">
            <button
              onClick={() => setActiveTab('rca-capa')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'rca-capa'
                  ? 'bg-slate-850 border border-slate-700 text-pharmablue-400 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-4 h-4" /> Root Cause & CAPA
            </button>
            <button
              onClick={() => setActiveTab('copilot')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'copilot'
                  ? 'bg-slate-850 border border-slate-700 text-pharmablue-400 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquareCode className="w-4 h-4" /> AI QA Copilot
            </button>
          </div>

          {/* Tab Viewports */}
          <div className="flex-grow overflow-hidden flex flex-col p-6 min-h-0">
            
            {activeTab === 'rca-capa' && (
              <div className="flex-grow overflow-y-auto space-y-6 text-xs pr-1">
                {/* AI recommendations */}
                <div className="space-y-4">
                  <div className="p-4 bg-pharmablue-950/10 border border-pharmablue-500/20 rounded-2xl space-y-3.5">
                    <div className="flex items-center gap-2 font-bold text-pharmablue-400">
                      <Sparkles className="w-4 h-4" /> AI Recommendations
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-300">Root Cause Analysis Proposal:</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 whitespace-pre-wrap">
                        {selectedComplaint.root_cause_recommendation || 'No Root Cause recommended.'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="font-semibold text-slate-300">Suggested CAPA Action Template:</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 whitespace-pre-wrap">
                        {selectedComplaint.capa_recommendation || 'No CAPA actions recommended.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actual inputs */}
                <div className="space-y-4 border-t border-slate-800 pt-5">
                  <h4 className="font-bold text-slate-200">QA Investigation Resolution Logging</h4>
                  
                  <div className="space-y-2.5">
                    <label className="font-semibold text-slate-400 block">Actual Root Cause Confirmed</label>
                    <textarea
                      value={actualRootCause}
                      onChange={(e) => setActualRootCause(e.target.value)}
                      placeholder="Input physical/process investigation findings..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-pharmablue-500 h-28 resize-none"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="font-semibold text-slate-400 block">Actual CAPA Action Executed</label>
                    <textarea
                      value={actualCapa}
                      onChange={(e) => setActualCapa(e.target.value)}
                      placeholder="Input detailed CAPA item log and reference codes..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-pharmablue-500 h-28 resize-none"
                    />
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'copilot' && (
              <div className="flex-grow flex flex-col overflow-hidden">
                {/* Chat window viewport */}
                <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-1 text-xs">
                  {copilotMessages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed whitespace-pre-wrap border ${
                            isUser
                              ? 'bg-pharmablue-600/10 border-pharmablue-500/20 text-slate-100 rounded-tr-none'
                              : 'bg-slate-900 border-slate-800 text-slate-300 rounded-tl-none'
                          }`}
                        >
                          <p className="font-bold text-[10px] text-slate-500 mb-1">
                            {isUser ? 'Pooja (QA Analyst)' : 'QA AI Copilot'}
                          </p>
                          <p className="text-[11px] leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {copilotStatus === 'loading' && (
                    <div className="flex justify-start">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3 flex items-center gap-2 text-slate-400">
                        <Loader className="w-4 h-4 animate-spin text-pharmablue-500" />
                        <span className="text-[10px] font-semibold animate-pulse">Copilot is researching compliance files...</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat input form */}
                <form onSubmit={handleSendChatMessage} className="flex gap-2 bg-slate-950 p-1.5 border border-slate-800 rounded-xl flex-shrink-0">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask Copilot about regulatory SOPs, stability, BMR check..."
                    className="flex-grow bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none px-3"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || copilotStatus === 'loading'}
                    className="w-8 h-8 rounded-lg bg-pharmablue-600 hover:bg-pharmablue-500 disabled:bg-slate-800 text-white flex items-center justify-center transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default ComplaintDetails;
