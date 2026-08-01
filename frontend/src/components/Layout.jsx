import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  MessageSquareCode, 
  FlaskConical, 
  ShieldCheck, 
  Database,
  Search,
  Settings
} from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Log Complaint', path: '/log-complaint', icon: FileText },
    { name: 'Complaint History', path: '/history', icon: History },
    { name: 'AI Copilot', path: '/copilot', icon: MessageSquareCode },
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo & Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-pharmablue-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-pharmablue-500/20">
              <FlaskConical className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight tracking-wider text-slate-100 uppercase">
                Pharma QMS
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">AI Complaint Hub</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-pharmablue-600/20 to-pharmablue-600/5 text-pharmablue-400 border-l-4 border-pharmablue-500 shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-4 border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-pharmablue-400' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System Stats Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/60">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" /> Database:
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              SQLite (Local)
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> LLM Model:
            </span>
            <span className="text-pharmablue-400 font-medium font-mono text-[10px]">
              Gemma2-9B-IT
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-100 tracking-wide">
              {navItems.find((n) => n.path === location.pathname)?.name || 'Investigation Portal'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Quick search input */}
            <div className="relative w-64">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-500" />
              </span>
              <input
                type="text"
                placeholder="Quick search complaints..."
                disabled
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-1.5 pl-9 pr-4 text-xs text-slate-300 placeholder-slate-500 cursor-not-allowed"
              />
            </div>
            
            <div className="h-8 w-px bg-slate-800"></div>

            {/* Profile */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pharmablue-600 flex items-center justify-center font-bold text-xs text-white">
                QA
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-slate-200">Pooja QA Analyst</p>
                <p className="text-[10px] text-slate-500">Lead Officer</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content viewport */}
        <main className="flex-grow overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
