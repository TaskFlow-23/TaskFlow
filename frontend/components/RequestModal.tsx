import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { WorkRequest, Priority, Status, Role, CommentType } from '../types';
import { X, Send, Clock, Trash2, Shield, Check, ChevronDown, Info, Calendar, User as UserIcon } from 'lucide-react';
import { STATUS_COLORS, AUTHORIZED_AGENTS } from '../constants';

interface Props {
  request: WorkRequest | null;
  onClose: () => void;
}

// Simple toast function (appears bottom-right, auto-dismiss)
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-[0_0_20px_rgba(0,229,255,0.3)] text-deep-black font-black text-sm uppercase tracking-widest animate-in slide-in-from-bottom-4 duration-300 border ${
    type === 'success' 
      ? 'bg-green-500 border-green-400' 
      : 'bg-red-500 border-red-400'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('animate-out', 'fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

const CheckboxSelect = ({
  label,
  options,
  value,
  onChange,
  disabled
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (val: any) => void;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="space-y-2 relative" ref={ref}>
      <label className="block text-[10px] uppercase font-black tracking-widest text-white/30 ml-1">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 flex items-center justify-between text-sm transition-all text-left relative z-10 ${
          disabled ? 'opacity-30 cursor-not-allowed' : 'hover:border-neon-blue/40 cursor-pointer'
        }`}
      >
        <span className="font-bold uppercase tracking-wider">{value || 'Select Option'}</span>
        {!disabled && <ChevronDown size={16} className={`text-white/20 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-[250] top-full mt-2 left-0 right-0 bg-deep-black border border-white/20 rounded-2xl shadow-2xl p-2 animate-in slide-in-from-top-2 duration-200 ring-1 ring-white/10">
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(opt);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neon-blue/5 transition-colors group text-left cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                    value === opt ? 'bg-neon-blue border-neon-blue' : 'border-white/20 group-hover:border-white/40'
                  }`}
                >
                  {value === opt && <Check size={12} className="text-black" strokeWidth={4} />}
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-widest ${
                    value === opt ? 'text-neon-blue' : 'text-white/40 group-hover:text-white/60'
                  }`}
                >
                  {opt}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const RequestModal: React.FC<Props> = ({ request: initialRequest, onClose }) => {
  const { createRequest, updateRequest, deleteRequest, addComment, currentUser, isLoading, requests } = useStore();

  const liveRequest = useMemo(
    () => requests.find((r) => r.id === initialRequest?.id) || initialRequest,
    [requests, initialRequest]
  );

  const [formData, setFormData] = useState<Partial<WorkRequest>>(
    liveRequest
      ? { ...liveRequest }
      : {
          title: '',
          description: '',
          priority: Priority.LOW,
          status: Status.OPEN,
          createdDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          assignedAgent: null,
          createdBy: currentUser?.name || '',
          tags: [],
          comments: [],
        }
  );

  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<CommentType>(CommentType.GENERAL);

  useEffect(() => {
    if (liveRequest) {
      setFormData((prev) => ({
        ...prev,
        comments: liveRequest.comments,
        status: liveRequest.status,
        priority: liveRequest.priority,
        isOverdue: liveRequest.isOverdue,
        createdBy: liveRequest.createdBy,
        dueDate: liveRequest.dueDate,
      }));
    }
  }, [liveRequest]);

  const isNew = !initialRequest;
  const isAdmin = currentUser?.role === Role.ADMIN;
  const isAssignedToCurrent = liveRequest?.assignedAgent === currentUser?.name;
  const isUnassigned = liveRequest?.assignedAgent === null;

  const canEditCoreFields = isAdmin || isNew;
  const canModifyAssignment = isAdmin;
  const isStatusDisabled = () => (isAdmin ? false : isNew || !isAssignedToCurrent);

  const canPostComment = isAdmin || isAssignedToCurrent || isUnassigned;

  const getStatusOptions = () => {
    if (isNew) return [Status.OPEN];

    const current = liveRequest?.status || Status.OPEN;
    if (current === Status.OPEN) return [Status.OPEN, Status.IN_PROGRESS, Status.BLOCKED];
    if (current === Status.IN_PROGRESS) return [Status.IN_PROGRESS, Status.DONE, Status.BLOCKED];
    if (current === Status.BLOCKED) return [Status.BLOCKED, Status.IN_PROGRESS];
    if (current === Status.DONE) return [Status.DONE];

    return [current];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isNew) {
        await createRequest(formData);
      } else {
        await updateRequest(liveRequest!.id, formData);
      }
      onClose();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !liveRequest) return;
    try {
      await addComment(liveRequest.id, newComment, commentType);
      setNewComment('');
      setCommentType(CommentType.GENERAL);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteFromModal = async () => {
    if (!liveRequest) return;

    // Extra safety check
    if (!currentUser || currentUser.role !== Role.ADMIN) {
      showToast('Access Denied: Only administrators can delete records.', 'error');
      return;
    }

    if (window.confirm('IRREVERSIBLE PROTOCOL: Permanent record expungement. Confirm deletion?')) {
      try {
        await deleteRequest(liveRequest.id);

        // Success toast
        showToast(`Protocol ${liveRequest.id} successfully expunged from the system.`, 'success');

        onClose();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete protocol.', 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="relative bg-deep-black border border-white/10 w-full max-w-6xl h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <div className="flex items-center gap-6">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${
                isNew ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue' : 'bg-white/5 border-white/10 text-white/40'
              }`}
            >
              {isNew ? <Shield size={24} /> : <Info size={24} />}
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                {isNew ? 'Initialize Protocol' : `Thread: ${liveRequest?.id}`}
                {!isNew && (
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${STATUS_COLORS[liveRequest?.status || Status.OPEN]}`}
                  >
                    {liveRequest?.status}
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-white/20 uppercase font-bold tracking-[0.4em] mt-1">
                {isAdmin
                  ? 'Administrative Terminal - All Fields Unlocked'
                  : isAssignedToCurrent
                  ? 'Active Assignment - Tactical Access'
                  : 'Observation Mode'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-2xl transition-all hover:rotate-90 text-white/20 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Unified Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-black/50 custom-scrollbar relative">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-32">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/30 ml-1">Protocol Identifier</label>
                  <input
                    required
                    disabled={!canEditCoreFields}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-neon-blue transition-all placeholder:text-white/5 disabled:opacity-30 uppercase text-stark-white"
                    placeholder="Enter operation title..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/30 ml-1">Mission Parameters</label>
                  <textarea
                    rows={6}
                    disabled={!canEditCoreFields}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium leading-relaxed focus:outline-none focus:border-neon-blue transition-all placeholder:text-white/5 disabled:opacity-30 text-stark-white resize-none"
                    placeholder="Provide tactical details..."
                  />
                </div>
              </div>

              {/* Comments Section */}
              {!isNew && (
                <div className="space-y-6 pt-10 border-t border-white/5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] uppercase font-black tracking-widest text-neon-blue/80 flex items-center gap-2">
                      <Clock size={12} />
                      Log entries
                    </label>
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                      {liveRequest?.comments.length} Registered Signals
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                    {liveRequest?.comments.length === 0 ? (
                      <div className="py-12 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 italic">
                          No communication logs detected
                        </p>
                      </div>
                    ) : (
                      liveRequest?.comments
                        .slice()
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((comm) => (
                          <div
                            key={comm.id}
                            className={`p-5 rounded-2xl border animate-in slide-in-from-left-2 duration-300 relative ${
                              comm.type === CommentType.SYSTEM_GENERATED
                                ? 'bg-red-900/10 border-red-500/30'
                                : comm.type === CommentType.STATUS_UPDATE
                                ? 'bg-yellow-900/10 border-yellow-500/30'
                                : 'bg-white/[0.02] border-white/10'
                            }`}
                          >
                            <div className="absolute top-2 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border opacity-70">
                              {comm.type === CommentType.SYSTEM_GENERATED
                                ? 'SYSTEM'
                                : comm.type === CommentType.STATUS_UPDATE
                                ? 'STATUS'
                                : 'GENERAL'}
                            </div>

                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[9px] border ${
                                    comm.type === CommentType.SYSTEM_GENERATED
                                      ? 'bg-red-500/20 border-red-500/40 text-red-400'
                                      : comm.type === CommentType.STATUS_UPDATE
                                      ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                                      : 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue'
                                  }`}
                                >
                                  {comm.author.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
                                  {comm.author}
                                </span>
                              </div>
                              <span className="text-[8px] text-white/50 uppercase font-bold">
                                {new Date(comm.timestamp).toLocaleString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>

                            <p className="text-[13px] text-white/90 leading-relaxed font-medium">{comm.content}</p>
                          </div>
                        ))
                    )}
                  </div>

                  {canPostComment && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <label className="text-[10px] uppercase font-black tracking-widest text-neon-blue/80 flex items-center gap-2">
                          <Send size={12} />
                          Add Log Entry
                        </label>
                        <select
                          value={commentType}
                          onChange={(e) => setCommentType(e.target.value as CommentType)}
                          className="bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 pr-8 text-[11px] font-bold text-white appearance-none focus:outline-none focus:border-neon-blue/60 hover:border-white/40 transition-colors cursor-pointer"
                        >
                          <option value={CommentType.GENERAL}>General</option>
                          <option value={CommentType.STATUS_UPDATE}>Status Update</option>
                        </select>
                      </div>

                      <div className="relative group">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                          className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 pr-16 text-sm font-medium focus:outline-none focus:border-neon-blue transition-all placeholder:text-white/40 text-white resize-none"
                          placeholder="Enter your message or update..."
                        />
                        <button
                          type="button"
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="absolute right-3 bottom-3 p-3 bg-neon-blue text-deep-black rounded-xl hover:shadow-neon transition-all active:scale-95 disabled:opacity-30"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Meta Controls */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <CheckboxSelect
                    label="Priority Vector"
                    options={Object.values(Priority)}
                    value={formData.priority as string}
                    onChange={(val) => setFormData({ ...formData, priority: val })}
                    disabled={!canEditCoreFields}
                  />
                  <CheckboxSelect
                    label="Operational Status"
                    options={getStatusOptions()}
                    value={formData.status as string}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    disabled={isStatusDisabled()}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-white/30 ml-1">Tactical Deadline</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                      <input
                        type="date"
                        disabled={!isAdmin && !isNew}
                        value={formData.dueDate?.split('T')[0]}
                        onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value).toISOString() })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-3.5 text-sm font-bold focus:outline-none focus:border-neon-blue transition-all disabled:opacity-30 text-stark-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-white/30 ml-1">Initialization Author</label>
                    <div className="relative">
                      <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={formData.createdBy}
                        onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-3.5 text-sm font-bold focus:outline-none focus:border-neon-blue transition-all disabled:opacity-30 text-stark-white"
                        placeholder="Authored by..."
                      />
                    </div>
                  </div>

                  <CheckboxSelect
                    label="Personnel Allocation"
                    options={['Unassigned', ...AUTHORIZED_AGENTS]}
                    value={formData.assignedAgent || 'Unassigned'}
                    onChange={(val) => setFormData({ ...formData, assignedAgent: val === 'Unassigned' ? null : val })}
                    disabled={!canModifyAssignment}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/30 ml-1">Sector Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {['IT', 'Finance', 'Urgent', 'HR', 'Security', 'Database'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = formData.tags || [];
                          const updated = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
                          setFormData({ ...formData, tags: updated });
                        }}
                        disabled={!canEditCoreFields}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                          formData.tags?.includes(tag)
                            ? 'bg-neon-blue text-black border-neon-blue shadow-neon'
                            : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {!isNew && (
                <div className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-6 text-[10px] font-bold uppercase tracking-widest space-y-3">
                  <div className="flex justify-between items-center text-white/20">
                    <span>Signal Inception</span>
                    <span className="text-white/40">{new Date(liveRequest?.createdDate || '').toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/20">
                    <span>Protocol Integrity</span>
                    <span className="text-neon-blue/60">Verified</span>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-12 fixed bottom-0 left-0 right-0 p-8 border-t border-white/5 bg-deep-black/95 backdrop-blur-2xl flex items-center justify-end gap-4 z-50">
              {isAdmin && !isNew && (
                <button
                  type="button"
                  onClick={handleDeleteFromModal}
                  className="mr-auto px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500/10 rounded-2xl border border-red-500/20 transition-all flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Scrub Record
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-10 py-4 text-xs font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-all"
              >
                Abort
              </button>
              {((isAdmin || isAssignedToCurrent) || isNew) && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-neon-blue text-deep-black px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-neon hover:shadow-neon-strong hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40"
                >
                  {isLoading ? 'Processing...' : isNew ? 'Initialize Protocol' : 'Sync Changes'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
