import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchComplaints } from '../store/complaintSlice';
import { 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  FileText,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

const ComplaintHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { complaints, status, error } = useSelector((state) => state.complaints);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const triggerFetch = () => {
    dispatch(fetchComplaints({
      search: searchTerm,
      severity: severityFilter,
      priority: priorityFilter,
      status: statusFilter
    }));
  };

  useEffect(() => {
    triggerFetch();
  }, [dispatch, severityFilter, priorityFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    triggerFetch();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSeverityFilter('');
    setPriorityFilter('');
    setStatusFilter('');
    dispatch(fetchComplaints({}));
  };

  const severityColors = {
    Critical: 'bg-red-500/10 border border-red-500/20 text-red-400',
    Major: 'bg-amber-500/10 border border-amber-500/20 text-amber-400',
    Minor: 'bg-pharmablue-500/10 border border-pharmablue-500/20 text-pharmablue-400',
  };

  const statusColors = {
    'New': 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
    'Under Investigation': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'CAPA Initiated': 'bg-pharmablue-500/10 text-pharmablue-400 border border-pharmablue-500/20',
    'Closed': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  };

  return (
    <div className="space-y-6 fade-in h-full flex flex-col">
      {/* Page Title */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Audit Quality Records</h1>
          <p className="text-sm text-slate-400">Search and filter active/closed pharmaceutical deviations</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="flex-shrink-0 glass-panel rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 flex gap-2">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder="Search product, customer, batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-pharmablue-500"
            />
          </div>
          <button 
            type="submit"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold"
          >
            Find
          </button>
        </form>

        {/* Option Drops */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 font-medium focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="CAPA Initiated">CAPA Initiated</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 font-medium focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 font-medium focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Reset button */}
          {(searchTerm || severityFilter || priorityFilter || statusFilter) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-xs text-slate-400 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

      </div>

      {/* Grid List Viewport */}
      <div className="flex-grow glass-panel rounded-2xl p-6 overflow-hidden flex flex-col min-h-0">
        
        {status === 'loading' ? (
          <div className="flex-grow flex items-center justify-center">
            <span className="text-xs font-semibold text-slate-500">Querying database registers...</span>
          </div>
        ) : complaints.length > 0 ? (
          <div className="flex-grow overflow-y-auto pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold sticky top-0 bg-slate-950 z-10">
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Logged Date</th>
                  <th className="py-3 px-4">Product / Medicine</th>
                  <th className="py-3 px-4">Defect Class</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4 text-center">Severity</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {complaints.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-300">#{comp.id}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(comp.logged_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{comp.product_name || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-slate-300">{comp.complaint_type || 'N/A'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{comp.batch_number || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${severityColors[comp.severity]}`}>
                        {comp.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[comp.status]}`}>
                        {comp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={() => navigate(`/history/${comp.id}`)}
                        className="inline-flex items-center gap-1 text-pharmablue-400 hover:text-pharmablue-300 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl py-12 space-y-3">
            <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-slate-300">No matching deviation records found</p>
              <p className="text-[10px] text-slate-500">Try modifying your filter parameters or search keyword.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ComplaintHistory;
