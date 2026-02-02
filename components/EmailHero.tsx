
import React, { useState } from 'react';
import { Copy, RefreshCw, CheckCircle2, Shuffle, Server, ShieldCheck, MousePointerClick, UserPlus, Send, X as CloseIcon } from 'lucide-react';
import { ProviderType } from '../types';

interface Props {
  address: string;
  onRefresh: () => void;
  onCopy: () => void;
  onChangeMail: (customUsername?: string) => void;
  onChangeServer: () => void;
  isRefreshing: boolean;
  copied: boolean;
  provider: ProviderType;
}

const getProviderDisplayName = (p: ProviderType) => {
  switch(p) {
    case '1secmail': return '1secmail';
    case 'mailtm': return 'Mail.tm';
    case 'guerrilla': return 'Guerrilla Mail';
    default: return 'Unknown';
  }
};

export const EmailHero: React.FC<Props> = ({ 
  address, onRefresh, onCopy, onChangeMail, onChangeServer, isRefreshing, copied, provider 
}) => {
  const [customUser, setCustomUser] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUser.trim()) {
      onChangeMail(customUser.trim());
      setCustomUser('');
      setIsCustomMode(false);
    }
  };

  const domain = address.split('@')[1] || '...';

  return (
    <section className="relative py-12 md:py-20 px-4 flex flex-col items-center justify-center text-center overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] md:w-[600px] h-[250px] md:h-[400px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] md:blur-[150px] rounded-full -z-10 animate-pulse-slow"></div>
      
      <div className="flex items-center gap-2 mb-6 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-full animate-in fade-in slide-in-from-bottom-2 duration-700">
        <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Vortex Secure Protocol Active</span>
      </div>

      <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-400 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent px-4">
        Your Temporary Identity <br className="hidden md:block" /> is Ready.
      </h1>
      
      <div className="w-full max-w-2xl glass p-5 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-zinc-200/50 dark:border-zinc-800/50 relative float-anim">
        <div className="flex flex-col space-y-6 md:space-y-8">
          
          <div className="relative group/address">
            <button 
              type="button"
              onClick={onCopy}
              className={`w-full flex flex-col items-center justify-center bg-white/60 dark:bg-black/40 rounded-[2rem] py-8 md:py-12 px-6 border border-white dark:border-white/5 transition-all duration-300 shadow-inner overflow-hidden active:scale-[0.98] ${copied ? 'ring-2 ring-emerald-500/50 border-emerald-500/30' : 'hover:bg-white dark:hover:bg-black/60 hover:shadow-xl hover:shadow-indigo-500/5'}`}
            >
              <div className="absolute top-3 right-5 flex items-center gap-1.5 opacity-0 group-hover/address:opacity-100 transition-opacity duration-300">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{copied ? 'Copied' : 'Click to Copy'}</span>
                {copied ? <CheckCircle2 size={12} className="text-emerald-500" /> : <MousePointerClick size={12} className="text-indigo-500" />}
              </div>

              <span className={`text-xl md:text-4xl font-mono font-bold break-all select-none leading-tight tracking-tight transition-colors duration-300 ${copied ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400 group-hover/address:text-indigo-500'}`}>
                {address || 'Generating Vortex...'}
              </span>

              {copied && (
                <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                  <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    Address Copied
                  </div>
                </div>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {getProviderDisplayName(provider)}
            </span>
            <span className="opacity-30">|</span>
            <span className="flex items-center gap-1.5">
              Encrypted Tunnel
            </span>
          </div>

          {/* Custom Username Section - Refined UI */}
          {(provider === 'mailtm' || provider === '1secmail') && (
            <div className="relative">
              {!isCustomMode ? (
                <button 
                  onClick={() => setIsCustomMode(true)}
                  className="group flex items-center gap-2 mx-auto px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-full text-[11px] font-black uppercase tracking-widest text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all border border-transparent hover:border-indigo-400/30"
                >
                  <UserPlus size={14} />
                  Claim Custom Alias
                </button>
              ) : (
                <div className="max-w-md mx-auto animate-in slide-in-from-top-4 duration-500">
                  <div className="bg-white/80 dark:bg-zinc-900 rounded-2xl p-1.5 shadow-2xl shadow-indigo-500/10 border border-indigo-100 dark:border-indigo-900/30">
                    <form onSubmit={handleCreateCustom} className="flex gap-1.5">
                      <div className="flex-1 relative flex items-center bg-zinc-50 dark:bg-black/20 rounded-xl px-4 py-3">
                        <input 
                          type="text" 
                          value={customUser}
                          onChange={(e) => setCustomUser(e.target.value)}
                          placeholder="your-name"
                          autoFocus
                          className="w-full bg-transparent outline-none text-sm font-bold text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 pr-12"
                        />
                        <span className="absolute right-3 text-[10px] font-black uppercase text-indigo-400 select-none">@{domain}</span>
                      </div>
                      <button 
                        type="submit"
                        disabled={!customUser.trim()}
                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                      >
                        <Send size={18} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setIsCustomMode(false); setCustomUser(''); }}
                        className="p-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        <CloseIcon size={18} />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 md:flex md:flex-wrap items-center justify-center gap-3 md:gap-5">
            <button 
              type="button"
              onClick={onCopy}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all hover:scale-[1.03] active:scale-[0.97] text-sm shadow-xl shadow-indigo-600/20"
            >
              {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            
            <button 
              type="button"
              onClick={onRefresh}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold transition-all border border-zinc-200 dark:border-zinc-700 text-sm shadow-sm"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button 
              type="button"
              onClick={() => onChangeMail()}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold transition-all border border-zinc-200 dark:border-zinc-700 text-sm shadow-sm"
            >
              <Shuffle size={18} />
              <span>Random</span>
            </button>

            <button 
              type="button"
              onClick={onChangeServer}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white hover:opacity-90 rounded-2xl font-bold transition-all text-sm shadow-lg"
            >
              <Server size={18} />
              <span>Swap Provider</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
