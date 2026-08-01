import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchComplaints, 
  fetchCopilotMessages,
  sendMessageToCopilot,
  addLocalCopilotMessage
} from '../store/complaintSlice';
import { 
  MessageSquareCode, 
  Send, 
  Loader, 
  Sparkles,
  ClipboardList,
  AlertTriangle,
  BookOpen
} from 'lucide-react';

const AICopilot = () => {
  const dispatch = useDispatch();
  
  const { complaints, copilotMessages, copilotStatus } = useSelector((state) => state.complaints);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    dispatch(fetchComplaints({}));
  }, [dispatch]);

  // Load chat messages when a complaint is selected
  useEffect(() => {
    if (selectedCaseId) {
      dispatch(fetchCopilotMessages(selectedCaseId));
    }
  }, [dispatch, selectedCaseId]);

  // Scroll to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedCaseId || copilotStatus === 'loading') return;
    
    const query = chatInput;
    setChatInput('');
    
    dispatch(addLocalCopilotMessage({ role: 'user', content: query }));
    dispatch(sendMessageToCopilot({ id: selectedCaseId, content: query }));
  };

  const selectedCase = complaints.find(c => c.id === parseInt(selectedCaseId));

  return (
    <div className="space-y-6 fade-in h-full flex flex-col">
      {/* Title */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">AI QA Copilot</h1>
          <p className="text-sm text-slate-400">Conversational compliance audits and Root Cause investigation</p>
        </div>
        
        {/* Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400">Context Complaint:</label>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 font-semibold focus:outline-none focus:border-pharmablue-500"
          >
            <option value="">-- Choose Case File --</option>
            {complaints.map((comp) => (
              <option key={comp.id} value={comp.id}>
                Case #{comp.id} - {comp.product_name} (Batch: {comp.batch_number})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Area Split */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden min-h-0">
        
        {/* LEFT COLUMN: Case Context details card */}
        <div className="lg:col-span-1 glass-panel rounded-2xl p-6 overflow-y-auto space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <ClipboardList className="w-4 h-4 text-pharmablue-500" /> Active Case Context
            </h3>
            
            {selectedCase ? (
              <div className="space-y-4 text-xs pt-2">
                <div className="space-y-1">
                  <p className="text-slate-500 font-medium">Product medicine:</p>
                  <p className="font-semibold text-slate-200">{selectedCase.product_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 font-medium">Lot / Batch ID:</p>
                  <p className="font-semibold text-slate-200 font-mono">{selectedCase.batch_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 font-medium">Defect Classification:</p>
                  <p className="font-semibold text-slate-200">{selectedCase.complaint_type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 font-medium">Assigned Severity:</p>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {selectedCase.severity}
                  </span>
                </div>
                <div className="space-y-1 pt-2">
                  <p className="text-slate-500 font-medium">Executive AI Summary:</p>
                  <p className="text-slate-400 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                    {selectedCase.summary || selectedCase.description.slice(0, 150) + '...'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 italic text-xs space-y-3">
                <BookOpen className="w-8 h-8 mx-auto text-slate-700" />
                <p>Select an active quality case from the dropdown to load QA copilot parameters.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 space-y-1">
            <p className="font-bold flex items-center gap-1"><Sparkles className="w-3 h-3 text-emerald-400" /> AI Knowledge Base</p>
            <p>Trained on FDA 21 CFR Part 211 (CGMP), ICH Q9 (Quality Risk Management), and standard pharmaceutical SOP templates.</p>
          </div>
        </div>

        {/* RIGHT COLUMN: Large Chat Window */}
        <div className="lg:col-span-2 glass-panel rounded-2xl flex flex-col overflow-hidden">
          
          {selectedCaseId ? (
            <div className="flex-grow flex flex-col p-6 overflow-hidden min-h-0">
              {/* Message scroll list */}
              <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-1 text-xs">
                
                {/* Intro message */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-none p-3.5 leading-relaxed bg-slate-900 border border-slate-800 text-slate-300">
                    <p className="font-bold text-[10px] text-slate-500 mb-1">QA AI Copilot</p>
                    <p className="text-[11px] leading-relaxed">
                      Hello! I have loaded the context for Case #{selectedCaseId} ({selectedCase?.product_name}). 
                      I can help you review stability profile checks, check BMR requirements, draft response emails, 
                      or audit compliance risks. How can I assist you with this batch review?
                    </p>
                  </div>
                </div>

                {copilotMessages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed border ${
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
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2 text-slate-400">
                      <Loader className="w-4 h-4 animate-spin text-pharmablue-500" />
                      <span className="text-[10px] font-semibold animate-pulse">Copilot is researching compliance records...</span>
                    </div>
                  </div>
                )}
                
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="flex gap-2 bg-slate-950 p-2 border border-slate-800 rounded-xl flex-shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your query regarding FDA CGMP compliance, SOP audits..."
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
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-600 shadow-md">
                <MessageSquareCode className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="text-xs font-bold text-slate-300">Awaiting Investigation Context</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Select a registered customer complaint file from the dropdown above to load the interactive QA compliance copilot window.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AICopilot;
