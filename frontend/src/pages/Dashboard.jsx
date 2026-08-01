import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  fetchStats, 
  fetchComplaints 
} from '../store/complaintSlice';
import { 
  AlertOctagon, 
  FileCheck, 
  ClipboardList, 
  Clock, 
  ArrowRight,
  Plus,
  AlertTriangle,
  History,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stats, status, error } = useSelector((state) => state.complaints);

  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  const severityColors = {
    Critical: 'bg-red-500/10 border-red-500/20 text-red-400',
    Major: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    Minor: 'bg-pharmablue-500/10 border-pharmablue-500/20 text-pharmablue-400',
  };

  const statusColors = {
    'New': 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
    'Under Investigation': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'CAPA Initiated': 'bg-pharmablue-500/10 text-pharmablue-400 border border-pharmablue-500/20',
    'Closed': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  };

  if (status === 'loading' && stats.total_complaints === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-900 w-1/4 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-900 rounded-2xl"></div>
          <div className="h-96 bg-slate-900 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Executive Quality Intelligence</h1>
          <p className="text-sm text-slate-400">Real-time surveillance & automated GMP risk analysis</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/log-complaint"
            className="flex items-center gap-2 px-4 py-2.5 bg-pharmablue-600 hover:bg-pharmablue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-pharmablue-600/20 transition-all duration-200"
          >
            <Plus className="w-4 h-4" /> Log Complaint
          </Link>
          <Link
            to="/history"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all duration-200"
          >
            <History className="w-4 h-4" /> Audit History
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Complaints</p>
            <h3 className="text-3xl font-bold text-slate-100">{stats.total_complaints}</h3>
            <p className="text-[10px] text-slate-500 font-medium">All logged campaigns</p>
          </div>
          <div className="w-12 h-12 bg-pharmablue-600/10 border border-pharmablue-500/20 rounded-xl flex items-center justify-center text-pharmablue-400">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Critical Escalations</p>
            <h3 className="text-3xl font-bold text-red-400">{stats.critical_complaints}</h3>
            <p className="text-[10px] text-red-500/80 font-medium">Immediate containment required</p>
          </div>
          <div className="w-12 h-12 bg-red-600/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Completeness</p>
            <h3 className="text-3xl font-bold text-emerald-400">{stats.avg_completeness_score}%</h3>
            <p className="text-[10px] text-slate-500 font-medium">Form detail threshold score</p>
          </div>
          <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Investigations</p>
            <h3 className="text-3xl font-bold text-amber-400">
              {stats.status_counts['New'] + stats.status_counts['Under Investigation']}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Under active QA review</p>
          </div>
          <div className="w-12 h-12 bg-amber-600/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Graphs & Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Interactive Visual distribution breakdown */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-pharmablue-500" /> Defect Profiles & Distribution
            </h4>
            <p className="text-[11px] text-slate-400 mb-6">Categorized audit volume across batch parameters</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Severity chart */}
            <div className="space-y-4">
              <h5 className="text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2">Severity Classification</h5>
              <div className="space-y-3">
                {Object.entries(stats.severity_counts).map(([label, val]) => {
                  const max = Math.max(...Object.values(stats.severity_counts), 1);
                  const percent = Math.round((val / max) * 100);
                  const total = stats.total_complaints || 1;
                  const share = Math.round((val / total) * 100);
                  const color = label === 'Critical' ? 'bg-red-500' : label === 'Major' ? 'bg-amber-500' : 'bg-pharmablue-500';
                  
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-300">{label}</span>
                        <span className="text-slate-400 font-semibold">{val} ({share}%)</span>
                      </div>
                      <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workflow status chart */}
            <div className="space-y-4">
              <h5 className="text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2">Investigation Workflow State</h5>
              <div className="space-y-3">
                {Object.entries(stats.status_counts).map(([label, val]) => {
                  const max = Math.max(...Object.values(stats.status_counts), 1);
                  const percent = Math.round((val / max) * 100);
                  const total = stats.total_complaints || 1;
                  const share = Math.round((val / total) * 100);
                  const color = label === 'New' ? 'bg-violet-500' : label === 'Under Investigation' ? 'bg-amber-500' : label === 'Closed' ? 'bg-emerald-500' : 'bg-pharmablue-500';

                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-300">{label}</span>
                        <span className="text-slate-400 font-semibold">{val} ({share}%)</span>
                      </div>
                      <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Data synced: Just now</span>
            <span className="text-pharmablue-400">Total metrics represent current GMP database load</span>
          </div>
        </div>

        {/* Right: Urgent Alerts Panel */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Containment Tasks
            </h4>
            <p className="text-[11px] text-slate-400 mb-4">Critical action triggers required for FDA compliance</p>
            
            <div className="space-y-3.5">
              {stats.critical_complaints > 0 ? (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    Immediate Batch Hold
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Critical-rated complaints require immediate material quarantine of the associated batch in the ERP.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/10 rounded-xl space-y-1.5 text-center">
                  <p className="text-xs text-emerald-400 font-medium">All clear</p>
                  <p className="text-[10px] text-slate-500">No critical batch alarms active</p>
                </div>
              )}

              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1.5">
                <p className="text-xs font-semibold text-slate-300">Completeness Target</p>
                <p className="text-[10px] text-slate-400">
                  Aim for &gt;90% completeness score on all logged files. Follow up on missing Batch details.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <Link 
              to="/log-complaint" 
              className="text-xs text-pharmablue-400 hover:text-pharmablue-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              Analyze a new customer document <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activities */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-200">Recent Complaints Activity</h4>
          <Link to="/history" className="text-xs text-pharmablue-400 hover:text-pharmablue-300 font-semibold flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recent_activity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Date Logged</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Defect Type</th>
                  <th className="py-3 px-4">Batch #</th>
                  <th className="py-3 px-4 text-center">Severity</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {stats.recent_activity.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-300">#{comp.id}</td>
                    <td className="py-3.5 px-4 text-slate-400">
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${severityColors[comp.severity]}`}>
                        {comp.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[comp.status]}`}>
                        {comp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={() => navigate(`/history/${comp.id}`)}
                        className="text-pharmablue-400 hover:text-pharmablue-300 font-semibold"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
            <p className="text-slate-400 text-xs font-semibold">No complaints registered</p>
            <p className="text-[10px] text-slate-600">Start by parsing an incoming complaint email or file.</p>
            <div className="pt-2">
              <Link 
                to="/log-complaint" 
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-pharmablue-600 text-white rounded-lg text-xs font-semibold"
              >
                Log First Complaint <Plus className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
