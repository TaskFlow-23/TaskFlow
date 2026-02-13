import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Status, Role, Priority, WorkRequest } from '../types';
import { STATUS_COLORS, PRIORITY_COLORS, AUTHORIZED_AGENTS } from '../constants';
import { Plus, Search, Filter, Trash2, AlertTriangle, User, ShieldAlert, Zap, Target, Briefcase, Check, ChevronDown, Clock, ArrowUpDown } from 'lucide-react';
import { RequestModal } from './RequestModal';

const CheckboxDropdown = ({
  label,
  options,
  selected,
  onToggle,
  onClear
}: {
  label: string,
  options: string[],
  selected: string[],
  onToggle: (val: string) => void,
  onClear: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all min-w-[140px] h-10 relative z-10 ${
          selected.length > 0 ? 'bg-neon-blue/10 border-neon-blue text-neon-blue shadow-neon' : 'bg-black border-white/10 text-white/40 hover:border-white/30'
        }`}
      >
        <span className="truncate">{selected.length > 0 ? `${label} (${selected.length})` : label}</span>
        <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[200] top-full mt-2 left-0 w-64 bg-deep-black border border-white/20 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(0,229,255,0.1)] p-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle(opt);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors text-left"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                  selected.includes(opt) ? 'bg-neon-blue border-neon-blue' : 'border-white/20 group-hover:border-white/40'
                }`}>
                  {selected.includes(opt) && <Check size={12} className="text-black" strokeWidth={4} />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${selected.includes(opt) ? 'text-stark-white' : 'text-white/40 group-hover:text-white/70'}`}>
                  {opt}
                </span>
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="w-full mt-2 pt-2 border-t border-white/10 text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors py-2"
            >
              Clear Selection
            </button>
          )}
        </div>
      )}
    </div>
  );
};

type SortOption = 'lastUpdated' | 'priority' | 'dueDate';

const SortDropdown = ({ value, onChange }: { value: SortOption, onChange: (v: SortOption) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { value: SortOption, label: string }[] = [
    { value: 'lastUpdated', label: 'Last Updated' },
    { value: 'priority', label: 'Priority Level' },
    { value: 'dueDate', label: 'Due Date' },
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border bg-black border-white/10 text-white/40 hover:border-white/30 transition-all min-w-[140px] h-10"
      >
        <div className="flex items-center gap-2">
          <ArrowUpDown size={12} className="text-neon-blue" />
          <span className="truncate">{options.find(o => o.value === value)?.label}</span>
        </div>
        <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[200] top-full mt-2 right-0 w-48 bg-deep-black border border-white/20 rounded-xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                value === opt.value ? 'bg-neon-blue/10 text-neon-blue' : 'text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { requests, fetchRequests, currentUser, deleteRequest, isLoading } = useStore();

  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('lastUpdated');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WorkRequest | null>(null);

  useEffect(() => {
    fetchRequests(true);
  }, [fetchRequests]);

  const isAdmin = currentUser?.role === Role.ADMIN;

  const processedRequests = useMemo(() => {
    let list = [...requests];

    if (!currentUser) return [];

    // Role-based scoping: Admin sees ALL, Agent sees ONLY assigned
    if (!isAdmin) {
      list = list.filter(r => r.assignedAgent === currentUser.name);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.assignedAgent?.toLowerCase().includes(query) ||
        r.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    if (selectedStatuses.length > 0) {
      list = list.filter(r => selectedStatuses.includes(r.status));
    }

    if (selectedPriorities.length > 0) {
      list = list.filter(r => selectedPriorities.includes(r.priority));
    }

    if (selectedAgents.length > 0) {
      list = list.filter(r => r.assignedAgent && selectedAgents.includes(r.assignedAgent));
    }

    if (showOnlyOverdue) {
      list = list.filter(r => r.isOverdue);
    }

    list.sort((a, b) => {
      if (sortBy === 'lastUpdated') {
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
      if (sortBy === 'priority') {
        const pMap = { [Priority.CRITICAL]: 0, [Priority.HIGH]: 1, [Priority.MEDIUM]: 2, [Priority.LOW]: 3 };
        return pMap[a.priority] - pMap[b.priority];
      }
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });

    return list;
  }, [requests, selectedStatuses, selectedPriorities, selectedAgents, showOnlyOverdue, sortBy, searchQuery, isAdmin, currentUser]);

  const stats = useMemo(() => {
    const relevantRequests = isAdmin
      ? requests
      : requests.filter(r => r.assignedAgent === currentUser?.name);

    const total = relevantRequests.length;
    const done = relevantRequests.filter(r => r.status === Status.DONE).length;
    const completionRate = total ? Math.round((done / total) * 100) : 0;

    // Only count truly overdue requests
    const overdueCount = relevantRequests.filter(r => r.isOverdue).length;

    return {
      total,
      overdue: overdueCount,
      done,
      completionRate
    };
  }, [requests, isAdmin, currentUser]);

  if (!currentUser) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {isAdmin && stats.overdue > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
              Global System Alert: {stats.overdue} Overdue items. Escalation logic active.
            </span>
          </div>
          <ShieldAlert className="text-red-500/50" size={18} />
        </div>
      )}

      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isAdmin ? <ShieldAlert className="text-neon-blue" size={24} /> : <Zap className="text-neon-blue" size={24} />}
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">
            {isAdmin ? 'Global Command Center' : 'Field Operations Terminal'}
          </h2>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em] ml-1">
            {isAdmin ? 'Monitoring all tactical threads globally' : `Active Connection: Agent ${currentUser.name}`}
          </p>
        </div>

        <button
          onClick={() => { setSelectedRequest(null); setIsModalOpen(true); }}
          className="bg-neon-blue text-deep-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-neon hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus size={18} />
          Initialize Protocol
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Tactical Load', value: stats.total, sub: 'Total Threads', icon: Briefcase },
          { label: 'Completion', value: `${stats.completionRate}%`, sub: 'Resolved Items', icon: Target },
          { label: 'Overdue', value: stats.overdue, sub: 'Past Due Date', alert: stats.overdue > 0, icon: AlertTriangle },
          { label: 'System State', value: 'OPTIMAL', sub: 'Signal Verified', icon: Zap, highlight: true }
        ].map((item, idx) => (
          <div
            key={idx}
            className={`p-6 bg-white/[0.03] border border-white/10 rounded-2xl group relative overflow-hidden transition-all hover:border-neon-blue/30 ${item.alert ? 'border-red-500/30' : ''}`}
          >
            <item.icon size={48} className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity ${item.alert ? 'text-red-500' : 'text-neon-blue'}`} />
            <p className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-1">{item.label}</p>
            <h3 className={`text-4xl font-black ${item.alert ? 'text-red-500' : item.highlight ? 'text-neon-blue' : 'text-stark-white'}`}>
              {item.value}
            </h3>
            <p className="text-[9px] text-white/20 mt-2 flex items-center gap-1 uppercase font-bold">
              <span className={`w-1 h-1 rounded-full ${item.alert ? 'bg-red-500 animate-pulse' : 'bg-neon-blue'}`}></span>
              {item.sub}
            </p>
          </div>
        ))}
      </section>

      <section className="bg-white/[0.02] p-6 rounded-2xl border border-white/10 shadow-xl relative z-[100] space-y-6">
        <div className="flex flex-col xl:flex-row gap-6 justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="relative w-full md:w-80 group">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neon-blue transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH OPERATIONAL DATA..."
                className="w-full bg-black border border-white/10 rounded-xl py-3 pl-12 pr-4 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/20 transition-all placeholder:text-white/10"
              />
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <CheckboxDropdown
                label="Status"
                options={Object.values(Status)}
                selected={selectedStatuses}
                onToggle={(v) => setSelectedStatuses(prev => prev.includes(v) ? prev.filter(s => s !== v) : [...prev, v])}
                onClear={() => setSelectedStatuses([])}
              />
              <CheckboxDropdown
                label="Priority"
                options={Object.values(Priority)}
                selected={selectedPriorities}
                onToggle={(v) => setSelectedPriorities(prev => prev.includes(v) ? prev.filter(p => p !== v) : [...prev, v])}
                onClear={() => setSelectedPriorities([])}
              />
              {isAdmin && (
                <CheckboxDropdown
                  label="Agent"
                  options={AUTHORIZED_AGENTS}
                  selected={selectedAgents}
                  onToggle={(v) => setSelectedAgents(prev => prev.includes(v) ? prev.filter(a => a !== v) : [...prev, v])}
                  onClear={() => setSelectedAgents([])}
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full xl:w-auto justify-end">
            <button
              onClick={() => setShowOnlyOverdue(!showOnlyOverdue)}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all h-10 ${
                showOnlyOverdue ? 'bg-red-500/10 border-red-500 text-red-500 shadow-neon' : 'bg-black border-white/10 text-white/40 hover:border-white/30'
              }`}
            >
              <AlertTriangle size={14} />
              Overdue
            </button>
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-24 relative z-0">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-white/2 rounded-3xl animate-pulse border border-white/10"></div>
          ))
        ) : processedRequests.length === 0 ? (
          <div className="col-span-full py-40 text-center bg-white/[0.01] rounded-3xl border border-dashed border-white/5">
            <Filter size={64} className="mx-auto text-white/5 mb-8" />
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.5em]">System query returned zero records</p>
          </div>
        ) : (
          processedRequests.map(req => (
            <div
              key={req.id}
              onClick={() => { setSelectedRequest(req); setIsModalOpen(true); }}
              className={`group relative bg-black border rounded-3xl p-7 transition-all hover:bg-white/[0.03] hover:shadow-2xl cursor-pointer flex flex-col overflow-hidden ${
                req.isOverdue ? 'border-red-500/30' : 'border-white/10 hover:border-neon-blue/30'
              }`}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black mono text-neon-blue/60 bg-neon-blue/5 px-2.5 py-1 rounded border border-neon-blue/10 uppercase">{req.id}</span>
                  {req.assignedAgent === null && <span className="text-[8px] bg-white/10 px-2 py-0.5 rounded text-white/40 uppercase font-black">Unassigned</span>}
                </div>
                <div className="flex items-center gap-2">
                  {req.isOverdue && (
                    <div className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded text-[7px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                      Escalated
                    </div>
                  )}
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${STATUS_COLORS[req.status]}`}>
                    {req.status}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-black group-hover:text-neon-blue transition-colors mb-3 tracking-tight line-clamp-2 uppercase">
                {req.title}
              </h3>

              <div className="flex flex-wrap gap-2 mb-4">
                {req.tags.map(tag => (
                  <span key={tag} className="text-[8px] font-black uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/40">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-xs text-white/30 mb-8 line-clamp-2 min-h-[3rem] leading-relaxed font-medium">
                {req.description}
              </p>

              <div className="grid grid-cols-2 gap-y-5 mt-auto border-t border-white/5 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                    <User size={14} className="text-neon-blue/40" />
                  </div>
                  <div>
                    <p className="text-[8px] text-white/20 font-black uppercase tracking-tighter">Personnel</p>
                    <p className="text-[10px] font-bold uppercase text-white/60 truncate max-w-[100px]">
                      {req.assignedAgent || 'Awaiting'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1 items-end text-right">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[7px] text-white/20 font-black uppercase tracking-tighter">Authored</p>
                    <p className="text-[9px] font-bold text-white/40">
                      {new Date(req.createdDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[7px] text-white/20 font-black uppercase tracking-tighter">Deadline</p>
                    <p className={`text-[9px] font-bold ${req.isOverdue ? 'text-red-400' : 'text-neon-blue/60'}`}>
                      {new Date(req.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    req.priority === Priority.CRITICAL ? 'bg-red-500 shadow-[0_0_10px_red] animate-pulse' :
                    req.priority === Priority.HIGH ? 'bg-orange-500' :
                    req.priority === Priority.MEDIUM ? 'bg-blue-500' : 'bg-gray-500'
                  }`}></div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${PRIORITY_COLORS[req.priority]}`}>
                    {req.priority}
                  </span>
                </div>

                <div className="flex justify-end items-center gap-1">
                  <Clock size={10} className="text-white/20" />
                  <span className="text-[7px] text-white/20 font-black uppercase">Ref: {new Date(req.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {isModalOpen && (
        <RequestModal
          request={selectedRequest}
          onClose={() => { setSelectedRequest(null); setIsModalOpen(false); }}
        />
      )}
    </div>
  );
};