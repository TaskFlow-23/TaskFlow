import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Role } from '../types';
import { ShieldCheck, UserCircle, Loader2, Lock, Terminal, Key, User, AlertCircle, ChevronDown } from 'lucide-react';

// Valid agent IDs (you can move this to constants.ts if you prefer)
const AUTHORIZED_AGENTS = [
  'AGT-101', 'AGT-102', 'AGT-103', 'AGT-104', 'AGT-105',
  'AGT-106', 'AGT-107', 'AGT-108', 'AGT-109', 'AGT-110'
];

export const Login: React.FC = () => {
  const login = useStore((state) => state.login);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState(AUTHORIZED_AGENTS[0]); // Default: AGT-101
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Debug: log what we're sending
    console.log('Authorize clicked - Username:', username, 'Password:', password);

    if (username.trim() === 'admin' && password === 'admin') {
      console.log('Admin login');
      setIsAuthenticating(true);
      setTimeout(() => {
        login(Role.ADMIN, 'Administrator');
        setIsAuthenticating(false);
      }, 2200);
    } else if (username.trim().toLowerCase() === 'agent' && password === 'agent') {
      console.log('Agent login - Selected agent:', selectedAgent);
      setIsAuthenticating(true);
      setTimeout(() => {
        login(Role.AGENT, selectedAgent);
        setIsAuthenticating(false);
      }, 2200);
    } else {
      setError('ACCESS DENIED: Invalid personnel credentials.');
    }
  };

  return (
    <div className="fixed inset-0 bg-deep-black flex items-center justify-center overflow-hidden font-inter">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-blue/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neon-blue/5 border border-neon-blue/20 mb-6 shadow-neon relative group">
            <Lock className="text-neon-blue group-hover:scale-110 transition-transform" size={28} />
            <div className="absolute inset-0 bg-neon-blue/10 animate-pulse rounded-2xl"></div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-stark-white mb-2 uppercase">
            TASK<span className="text-neon-blue">FLOW</span>
          </h1>
          <div className="flex items-center justify-center gap-2">
            <Terminal size={10} className="text-neon-blue/60" />
            <p className="text-[9px] text-white/30 uppercase tracking-[0.5em] font-black">Authorized Personnel Only</p>
          </div>
        </div>

        {isAuthenticating ? (
          <div className="bg-white/2 border border-white/10 rounded-3xl p-10 text-center animate-in zoom-in-95 duration-500 backdrop-blur-xl">
            <div className="relative mb-6">
              <Loader2 className="mx-auto text-neon-blue animate-spin" size={40} />
              <div className="absolute inset-0 blur-md bg-neon-blue/20 animate-pulse rounded-full"></div>
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest mb-1 text-stark-white">Synchronizing</h2>
            <p className="text-[10px] text-white/40 mb-8 uppercase tracking-tighter">
              Establishing Secure Handshake...
            </p>
            <div className="w-full h-[1px] bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-neon-blue shadow-neon animate-[loading_2.2s_linear]"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-6 fade-in duration-700">
            <form onSubmit={handleAuthorize} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Personnel Username</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neon-blue transition-colors">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                    placeholder="Enter ID..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Access Passkey</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neon-blue transition-colors">
                    <Key size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Agent dropdown - appears only for agent login */}
              {username.trim().toLowerCase() === 'agent' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Select Agent ID</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                      className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 text-sm text-white flex items-center justify-between focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                    >
                      <span className="font-bold uppercase tracking-wider">{selectedAgent}</span>
                      <ChevronDown size={16} className={`text-white/40 transition-transform ${showAgentDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showAgentDropdown && (
                      <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-deep-black border border-white/20 rounded-xl shadow-2xl p-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {AUTHORIZED_AGENTS.map((agent) => (
                          <button
                            key={agent}
                            type="button"
                            onClick={() => {
                              setSelectedAgent(agent);
                              setShowAgentDropdown(false);
                              console.log('Agent selected:', agent); // Debug
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                              selectedAgent === agent
                                ? 'bg-neon-blue/10 text-neon-blue'
                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {agent}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-neon-blue text-deep-black font-black uppercase tracking-widest py-4 rounded-xl shadow-neon hover:shadow-neon-strong active:scale-95 transition-all text-xs flex items-center justify-center gap-2 group"
              >
                Authorize Entry
                <ShieldCheck size={18} className="group-hover:rotate-12 transition-transform" />
              </button>
            </form>

            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-3 text-center font-bold">Demo Credentials</p>
              <div className="flex justify-between gap-4">
                <div className="text-center flex-1">
                  <p className="text-[8px] text-neon-blue font-black uppercase mb-1">Admin</p>
                  <code className="text-[10px] text-white/40">admin / admin</code>
                </div>
                <div className="w-[1px] bg-white/5"></div>
                <div className="text-center flex-1">
                  <p className="text-[8px] text-neon-blue font-black uppercase mb-1">Agent</p>
                  <code className="text-[10px] text-white/40">agent / agent</code>
                </div>
              </div>
            </div>

            <div className="pt-4 text-center">
              <p className="text-[8px] text-white/10 uppercase tracking-[0.3em] leading-loose font-bold">
                Connection is encrypted via<br/>
                AES-256 Operational Standard
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #111;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #00E5FF;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};