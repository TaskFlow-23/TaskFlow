
import React, { useMemo } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { useStore } from './store/useStore';
import { Shield, Zap, Target, Activity, ListTodo, BarChart3, Clock, AlertTriangle } from 'lucide-react';
import { Status, Priority } from './types';
import { STATUS_COLORS, PRIORITY_COLORS } from './constants';

const WorkQueueView = () => {
  const requests = useStore((state) => state.requests);
  const currentUser = useStore((state) => state.currentUser);
  const isAdmin = currentUser?.role === 'Admin';

  const visibleRequests = useMemo(() => {
    if (isAdmin) return requests;
    // Agent only sees assigned tasks
    return requests.filter(r => r.assignedAgent === currentUser?.name);
  }, [requests, isAdmin, currentUser]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="mb-10">
        <h2 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
          <ListTodo className="text-neon-blue" size={28} />
          Protocol Work Queue
        </h2>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
          Real-time linear sequence of all active operational nodes
        </p>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/10">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">ID</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Protocol Title</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Initiated</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Deadline</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Created By</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visibleRequests.map((req) => (
                <tr key={req.id} className="hover:bg-white/[0.01] transition-colors group cursor-default">
                  <td className="px-8 py-6 text-[10px] font-black mono text-neon-blue/60 uppercase">{req.id}</td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-tight text-white/80 group-hover:text-stark-white transition-colors">{req.title}</span>
                      <div className="flex gap-2 mt-1">
                        {req.tags.map(t => <span key={t} className="text-[8px] text-white/20 font-black uppercase border border-white/10 px-1 rounded">{t}</span>)}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[10px] font-bold text-white/40 uppercase">
                    {new Date(req.createdDate).toLocaleDateString()}
                  </td>
                  <td className={`px-8 py-6 text-[10px] font-bold uppercase ${req.isOverdue ? 'text-red-500' : 'text-neon-blue/60'}`}>
                    {new Date(req.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    {req.createdBy}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_COLORS[req.status]}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-[11px] font-bold text-white/40 uppercase tracking-wider">
                    {req.assignedAgent || 'Unallocated'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AnalyticsView = () => {
  const requests = useStore((state) => state.requests);

  const stats = useMemo(() => {
    const total = requests.length;
    const statusCounts = {
      [Status.OPEN]: requests.filter(r => r.status === Status.OPEN).length,
      [Status.IN_PROGRESS]: requests.filter(r => r.status === Status.IN_PROGRESS).length,
      [Status.BLOCKED]: requests.filter(r => r.status === Status.BLOCKED).length,
      [Status.DONE]: requests.filter(r => r.status === Status.DONE).length,
    };
    const priorityCounts = {
      [Priority.CRITICAL]: requests.filter(r => r.priority === Priority.CRITICAL).length,
      [Priority.HIGH]: requests.filter(r => r.priority === Priority.HIGH).length,
      [Priority.MEDIUM]: requests.filter(r => r.priority === Priority.MEDIUM).length,
      [Priority.LOW]: requests.filter(r => r.priority === Priority.LOW).length,
    };
    const overdue = requests.filter(r => r.isOverdue).length;
    return { total, statusCounts, priorityCounts, overdue };
  }, [requests]);

  const StatBar = ({ label, count, total, colorClass }: { label: string, count: number, total: number, colorClass: string }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</span>
          <span className="text-sm font-black text-stark-white">{count}</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClass} transition-all duration-1000 ease-out shadow-neon`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="mb-10">
        <h2 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
          <BarChart3 className="text-neon-blue" size={28} />
          Intelligence Analytics
        </h2>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
          High-fidelity metric synthesis of the TaskFlow ecosystem
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="p-8 bg-white/[0.02] border border-white/10 rounded-3xl space-y-8">
          <div className="flex items-center gap-3">
             <Activity className="text-neon-blue" size={20} />
             <h3 className="text-xs font-black uppercase tracking-[0.2em]">Lifecycle Distribution</h3>
          </div>
          <div className="space-y-6">
            <StatBar label="Open Nodes" count={stats.statusCounts[Status.OPEN]} total={stats.total} colorClass="bg-blue-500" />
            <StatBar label="Active Protocols" count={stats.statusCounts[Status.IN_PROGRESS]} total={stats.total} colorClass="bg-yellow-500" />
            <StatBar label="Blocked Vectors" count={stats.statusCounts[Status.BLOCKED]} total={stats.total} colorClass="bg-red-500" />
            <StatBar label="Resolved Threads" count={stats.statusCounts[Status.DONE]} total={stats.total} colorClass="bg-green-500" />
          </div>
        </div>

        <div className="p-8 bg-white/[0.02] border border-white/10 rounded-3xl space-y-8">
          <div className="flex items-center gap-3">
             <AlertTriangle className="text-neon-blue" size={20} />
             <h3 className="text-xs font-black uppercase tracking-[0.2em]">Priority Matrix</h3>
          </div>
          <div className="space-y-6">
            <StatBar label="Critical Level" count={stats.priorityCounts[Priority.CRITICAL]} total={stats.total} colorClass="bg-red-600" />
            <StatBar label="High Priority" count={stats.priorityCounts[Priority.HIGH]} total={stats.total} colorClass="bg-orange-500" />
            <StatBar label="Standard Medium" count={stats.priorityCounts[Priority.MEDIUM]} total={stats.total} colorClass="bg-blue-400" />
            <StatBar label="Low Threshold" count={stats.priorityCounts[Priority.LOW]} total={stats.total} colorClass="bg-gray-500" />
          </div>
        </div>

        <div className="xl:col-span-2 p-8 bg-red-500/[0.03] border border-red-500/20 rounded-3xl flex flex-col md:flex-row items-center gap-8">
           <div className="text-center md:text-left">
              <h4 className="text-4xl font-black text-red-500 mb-2">{stats.overdue}</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/60">Service Violations</p>
           </div>
           <div className="flex-1 text-sm text-white/30 font-medium leading-relaxed uppercase tracking-tight">
             Total protocols that have exceeded established thresholds. Automated escalation protocols are currently monitoring {stats.priorityCounts[Priority.CRITICAL]} critical anomalies.
           </div>
           <div className="flex items-center gap-2 px-6 py-3 bg-red-500 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-default">
              Escalation Active
           </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const currentView = useStore((state) => state.currentView);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'work-queue': return <WorkQueueView />;
      case 'analytics': return <AnalyticsView />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderView()}
      
      <div className="fixed bottom-6 right-6 z-50 group">
         <div className="w-12 h-12 bg-neon-blue rounded-2xl flex items-center justify-center text-black cursor-help shadow-neon hover:scale-110 transition-all border border-neon-blue/50">
            <span className="font-black text-lg">?</span>
         </div>
         <div className="absolute bottom-16 right-0 w-80 bg-deep-black border border-white/20 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(0,229,255,0.1)] invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-neon-blue" size={20} />
              <h3 className="text-neon-blue font-black text-xs uppercase tracking-[0.2em]">Operational Principles</h3>
            </div>
            <ul className="text-[11px] space-y-4 text-white/50 font-medium leading-relaxed">
               <li className="flex gap-3">
                  <span className="text-neon-blue font-black">01</span>
                  <p><strong className="text-stark-white uppercase tracking-widest text-[10px]">Visual Hierarchy:</strong> Neon signaling and high-contrast typography guide the eye to critical system status.</p>
               </li>
               <li className="flex gap-3">
                  <span className="text-neon-blue font-black">02</span>
                  <p><strong className="text-stark-white uppercase tracking-widest text-[10px]">Atomic Design:</strong> Every terminal component adheres to the Deep Black / Neon Blue / Stark White protocol.</p>
               </li>
               <li className="flex gap-3">
                  <span className="text-neon-blue font-black">03</span>
                  <p><strong className="text-stark-white uppercase tracking-widest text-[10px]">Data Integrity:</strong> Zustand-driven state synchronization with strict RBAC transition logic enforcement.</p>
               </li>
               <li className="flex gap-3">
                  <span className="text-neon-blue font-black">04</span>
                  <p><strong className="text-stark-white uppercase tracking-widest text-[10px]">Tactical UX:</strong> High-performance interactivity with immediate visual feedback for all terminal commands.</p>
               </li>
            </ul>
         </div>
      </div>
    </Layout>
  );
};

export default App;
