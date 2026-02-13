import React, { useState } from 'react';
import { useStore, AppView } from '../store/useStore';
import { LayoutDashboard, ListTodo, Activity, User as UserIcon, LogOut, Zap, ChevronLeft, ChevronRight } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const currentView = useStore((state) => state.currentView);
  const setView = useStore((state) => state.setView);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!currentUser) return null;

  const NavButton = ({ view, icon: Icon, label }: { view: AppView, icon: any, label: string }) => {
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => setView(view)}
        title={isCollapsed ? label : undefined}
        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${
          isActive 
            ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30 shadow-[inset_0_0_10px_rgba(0,229,255,0.1)]' 
            : 'hover:bg-white/5 text-white/40 hover:text-white border-transparent'
        } ${isCollapsed ? 'justify-center px-0' : ''}`}
      >
        <Icon size={18} className={isActive ? 'text-neon-blue' : 'text-current'} />
        {!isCollapsed && <span className="truncate">{label}</span>}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-deep-black text-stark-white overflow-hidden font-inter">
      {/* Sidebar */}
      <aside 
        className={`${isCollapsed ? 'w-20' : 'w-72'} border-r border-white/10 flex flex-col bg-black relative z-50 transition-all duration-300 ease-in-out`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-24 w-6 h-6 bg-neon-blue text-deep-black rounded-full flex items-center justify-center shadow-neon hover:scale-110 transition-transform z-[60] border border-black"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`p-8 border-b border-white/5 ${isCollapsed ? 'px-4 flex justify-center' : ''}`}>
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3">
            <div className="w-3.5 h-3.5 bg-neon-blue rounded-full shadow-neon animate-pulse flex-shrink-0"></div>
            {!isCollapsed && (
              <span className="animate-in fade-in duration-300">
                TASK<span className="text-neon-blue">FLOW</span>
              </span>
            )}
          </h1>
          {!isCollapsed && (
            <p className="text-[9px] text-white/20 uppercase tracking-[0.4em] font-bold mt-2 ml-1 animate-in fade-in duration-300">
              Operational Command
            </p>
          )}
        </div>

        <nav className="flex-1 p-6 space-y-3">
          {!isCollapsed && (
            <div className="text-[10px] text-white/10 uppercase font-black tracking-[0.3em] px-4 mb-4 animate-in fade-in duration-300">
              Core Terminals
            </div>
          )}
          <NavButton view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavButton view="work-queue" icon={ListTodo} label="Work Queue" />
          <NavButton view="analytics" icon={Activity} label="Analytics" />
        </nav>

        <div className={`p-6 border-t border-white/5 space-y-6 ${isCollapsed ? 'px-4' : ''}`}>
          <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
            <div className="w-10 h-10 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/10 group hover:border-neon-blue/30 transition-all flex-shrink-0">
              <UserIcon size={18} className="text-white/40 group-hover:text-neon-blue transition-colors" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden animate-in fade-in duration-300">
                <p className="text-xs font-black truncate text-stark-white uppercase tracking-tight">{currentUser.name}</p>
                <p className="text-[10px] text-neon-blue font-bold truncate uppercase tracking-widest opacity-60">{currentUser.role} LEVEL</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={logout}
            title={isCollapsed ? "Terminate Session" : undefined}
            className={`w-full flex items-center justify-center gap-3 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-red-500 hover:bg-red-500/5 rounded-xl border border-transparent hover:border-red-500/20 transition-all group ${isCollapsed ? 'px-0' : ''}`}
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            {!isCollapsed && <span className="animate-in fade-in duration-300">Terminate Session</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-deep-black/60 backdrop-blur-2xl z-40">
          <div className="flex items-center gap-4">
             <div className="h-2 w-2 rounded-full bg-neon-blue shadow-neon animate-pulse"></div>
             <span className="text-[10px] text-white/30 mono uppercase tracking-widest font-bold">Signal: Encrypted | Node: 0xF429</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-white/20 hover:text-neon-blue transition-all cursor-pointer group">
              <Zap size={16} className="group-hover:scale-110" />
              <span className="text-[10px] font-black uppercase tracking-widest">Optimized</span>
            </div>
            <div className="h-10 w-[1px] bg-white/5"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">Environment</span>
              <div className="px-3 py-1 bg-neon-blue/10 border border-neon-blue/20 rounded-full">
                <span className="text-[9px] text-neon-blue font-black uppercase tracking-widest">Production</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 z-10 relative">
          {children}
        </div>
      </main>
    </div>
  );
};
