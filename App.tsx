import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Zap, RefreshCcw, X, Moon, Sun, Link as LinkIcon, AlertTriangle, ShieldCheck, FileText, Lock } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { EmailAccount, EmailMessage, ProviderType, Attachment } from './types';
import { EmailServiceProvider } from './services/emailService';
import { EmailHero } from './components/EmailHero';
import { InboxArea } from './components/InboxArea';
import { PLAY_NOTIFICATION } from './utils/audio';

// @ts-ignore
import html2pdf from 'html2pdf.js';

const STORAGE_KEY = 'tempvortex_session';

const App: React.FC = () => {
  // --- State Management ---
  const [session, setSession] = useState<{ account: EmailAccount | null, provider: ProviderType }>(() => {
    // 1. Check URL Params for Recovery
    const params = new URLSearchParams(window.location.search);
    const urlAccount = params.get('account');
    const urlToken = params.get('token');
    const urlProvider = params.get('provider') as ProviderType;

    if (urlAccount && urlProvider) {
      window.history.replaceState({}, '', '/'); // Clean URL
      return { 
        account: { address: urlAccount, token: urlToken || undefined, provider: urlProvider }, 
        provider: urlProvider 
      };
    }

    // 2. Check Local Storage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { 
          account: parsed.account || null, 
          provider: parsed.provider || '1secmail' 
        };
      }
    } catch (e) {
      console.error("Failed to load session", e);
    }
    return { account: null, provider: '1secmail' };
  });

  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<{ message: string; detail?: string; code?: string; provider?: string } | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [activeModal, setActiveModal] = useState<'safety' | 'privacy' | 'terms' | null>(null);

  // Refs for tracking updates without re-renders
  const seenMessageIds = useRef<Set<string>>(new Set());
  const account = session.account;
  const activeProvider = session.provider;

  // --- Effects ---

  // Persist Session
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ account, provider: activeProvider }));
  }, [account, activeProvider]);

  // Theme Handler
  useEffect(() => {
    const root = window.document.body;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    root.style.backgroundColor = theme === 'dark' ? '#09090b' : '#f8fafc';
    root.style.color = theme === 'dark' ? '#fafafa' : '#0f172a';
  }, [theme]);

  // Dynamic Tab Title (New Feature)
  useEffect(() => {
    const unreadCount = messages.filter(m => !m.isRead).length; // Simplified logic
    if (messages.length > 0) {
      document.title = `(${messages.length}) New Mail | TempVortex`;
    } else {
      document.title = 'TempVortex | Secure Disposable Email';
    }
  }, [messages]);

  // Keyboard Shortcuts (New Feature)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 'R' for Refresh
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement)) {
        fetchMessages();
      }
      // 'Del' to delete selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedMessageId) {
        handleDelete(selectedMessageId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMessageId, account]); // Dependencies needed for delete/refresh to work

  // --- Logic ---

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const getProviderName = (p: ProviderType) => {
    if (p === '1secmail') return '1secmail';
    if (p === 'mailtm') return 'Mail.tm';
    return 'Guerrilla Mail';
  }

  const initAccount = useCallback(async (provider: ProviderType, customUsername?: string) => {
    setIsRefreshing(true);
    setError(null);
    try {
      const svc = EmailServiceProvider.getProvider(provider);
      const domains = await svc.getDomains();
      const newAccount = await svc.createAccount(domains[0] || '', customUsername);
      
      setSession({ account: newAccount, provider });
      setMessages([]);
      setSelectedMessageId(null);
      seenMessageIds.current = new Set();
      toast.success(customUsername ? `Identity "${customUsername}" created on ${getProviderName(provider)}` : `Generated identity on ${getProviderName(provider)}`);
    } catch (err: any) {
      const isNetworkError = err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('cors');
      const errObj = {
        message: err.message || (isNetworkError ? "Connectivity Blocked" : "Connection Failed"),
        detail: err.message || "An unexpected error occurred during account generation.",
        code: isNetworkError ? "ERR_CORS" : "INIT_FAIL",
        provider: getProviderName(provider)
      };
      setError(errObj);
      toast.error(errObj.message);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    if (!account) {
      initAccount(activeProvider);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!account) return;
    setIsRefreshing(true);
    try {
      const svc = EmailServiceProvider.getProvider(account.provider);
      const newMessages = await svc.getMessages(account);
      
      let hasNew = false;
      newMessages.forEach(msg => {
        if (!seenMessageIds.current.has(msg.id)) {
          hasNew = true;
          // Trigger Notification
          toast.info(`From: ${msg.from.split('<')[0]}`, {
            description: msg.subject,
            duration: 5000,
          });
          seenMessageIds.current.add(msg.id);
        }
      });

      if (hasNew) {
        PLAY_NOTIFICATION(); // Play Sound
      }

      setMessages(newMessages);
      if (error) setError(null);
    } catch (err: any) {
      console.warn("Inbox sync failed", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [account, error]);

  // Polling Interval
  useEffect(() => {
    const interval = setInterval(fetchMessages, 8000); // 8 seconds is optimal
    fetchMessages(); 
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSelectMessage = async (id: string) => {
    setSelectedMessageId(id);
    const msg = messages.find(m => m.id === id);
    if (msg && !msg.body && account) {
      try {
        const svc = EmailServiceProvider.getProvider(account.provider);
        const details = await svc.getMessageContent(account, id);
        setMessages(prev => prev.map(m => m.id === id ? { ...m, ...details, isRead: true } : m));
      } catch (err) {
        toast.error("Failed to load email content");
      }
    }
  };

  const handleCopy = () => {
    if (account) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareSession = () => {
    if (!account) return;
    const url = `${window.location.origin}/?account=${account.address}&provider=${account.provider}${account.token ? `&token=${account.token}` : ''}`;
    navigator.clipboard.writeText(url);
    toast.success("Recovery Link Copied", {
      description: "Use this link to access this inbox on another device."
    });
  };

  const handleDelete = async (id: string) => {
    if (!account) return;
    try {
      const svc = EmailServiceProvider.getProvider(account.provider);
      await svc.deleteMessage(account, id);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessageId === id) setSelectedMessageId(null);
      toast.success("Permanently deleted");
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  const handleDownload = (msg: EmailMessage) => {
    toast.promise(async () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family: sans-serif; padding: 40px;">
          <h1 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">TempVortex Export</h1>
          <p><strong>From:</strong> ${msg.from}</p>
          <p><strong>Subject:</strong> ${msg.subject}</p>
          <p><strong>Date:</strong> ${msg.date}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <div style="line-height: 1.6;">${msg.html || msg.body || ''}</div>
        </div>
      `;
      const options = { margin: 10, filename: `email-${msg.id}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
      await html2pdf().set(options).from(element).save();
    }, { loading: 'Generating PDF...', success: 'PDF saved', error: 'PDF export failed' });
  };

  const handleAttachmentDownload = async (messageId: string, attachment: Attachment) => {
    if (!account) return;
    try {
      const svc = EmailServiceProvider.getProvider(account.provider);
      await svc.downloadAttachment(account, messageId, attachment);
      toast.success(`Downloading ${attachment.filename}`);
    } catch (err) {
      toast.error("Attachment download failed");
    }
  };

  const handleSwitchServer = () => {
    const providers: ProviderType[] = ['1secmail', 'mailtm', 'guerrilla'];
    const nextProvider = providers[(providers.indexOf(activeProvider) + 1) % providers.length];
    initAccount(nextProvider);
  };

  // ... (Modal Render Logic - Unchanged) ...
  const renderModalContent = () => {
    if (!activeModal) return null;
    const contents = {
      safety: { title: 'Safety Guide', icon: <ShieldCheck className="text-emerald-500" />, text: 'Use this service for temporary registrations only. Avoid using these addresses for banking or recovery emails as they are ephemeral.' },
      privacy: { title: 'Privacy Policy', icon: <Lock className="text-indigo-500" />, text: 'We do not store logs, metadata, or tracking cookies. All data is handled purely through the public APIs of the providers listed.' },
      terms: { title: 'Terms of Use', icon: <FileText className="text-violet-500" />, text: 'You agree to use TempVortex for legal purposes only. We are not responsible for the content of received emails.' }
    };
    const c = contents[activeModal];
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="w-full max-w-lg neo-glass rounded-[2rem] border border-white/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 bg-white/90 dark:bg-zinc-900/90">
          <div className="p-6 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">{c.icon}</div>
              <h2 className="text-xl font-black">{c.title}</h2>
            </div>
            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><X size={20} /></button>
          </div>
          <div className="p-8 text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm">{c.text}</div>
          <div className="p-6 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end">
            <button onClick={() => setActiveModal(null)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">Close</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col transition-all duration-500">
      <Toaster position="top-center" richColors />
      {renderModalContent()}
      
      <header className="sticky top-0 z-50 glass border-b border-zinc-200/50 dark:border-zinc-800/50 px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><Zap className="text-white fill-white" size={20} /></div>
            <div className="flex flex-col">
              <span className="font-black text-xl leading-none">TempVortex</span>
              <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest mt-1">Disposable Tunnel</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShareSession}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-zinc-700 transition-all"
              title="Get Recovery Link"
            >
              <LinkIcon size={14} />
              <span>Save Session</span>
            </button>
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 transition-all shadow-sm">
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 pb-20">
        {error && (
          <div className="mt-8 max-w-xl mx-auto animate-in slide-in-from-top-4">
            <div className="neo-glass border-red-500/20 p-6 rounded-[2rem] shadow-xl bg-red-50/50 dark:bg-red-900/10">
              <div className="flex items-start gap-4">
                <AlertTriangle className="text-red-500 mt-1" size={24} />
                <div>
                  <h4 className="font-bold text-red-600">Connection Interrupted</h4>
                  <p className="text-xs text-zinc-500 mt-1">{error.message}</p>
                  <p className="text-[10px] text-zinc-400 mt-1 font-mono">{error.detail}</p>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => initAccount(activeProvider)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/20">Retry Connection</button>
                    <button onClick={handleSwitchServer} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-200">Switch Provider</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <EmailHero 
          address={account?.address || ''} 
          onRefresh={fetchMessages}
          onCopy={handleCopy}
          onChangeMail={(custom) => initAccount(activeProvider, custom)}
          onChangeServer={handleSwitchServer}
          isRefreshing={isRefreshing}
          copied={copied}
          provider={activeProvider}
        />

        <InboxArea 
          messages={messages}
          selectedId={selectedMessageId}
          onSelect={handleSelectMessage}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onDownloadAttachment={handleAttachmentDownload}
          onBackToList={() => setSelectedMessageId(null)}
        />

        <section className="py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard icon={<Shield className="text-indigo-500" />} title="Private & Anonymous" desc="No logs. Data is processed in RAM and discarded immediately." />
          <FeatureCard icon={<FileText className="text-emerald-500" />} title="Smart Attachments" desc="Preview and download attachments securely without exposure." />
          <FeatureCard icon={<RefreshCcw className="text-violet-500" />} title="Auto-Sync Protocol" desc="Inbox refreshes automatically. Audio alerts for new messages." />
        </section>
      </main>

      <footer className="border-t border-zinc-200/50 dark:border-zinc-800/50 py-12 px-6 glass mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="font-black text-xl mb-2 flex items-center gap-2 justify-center md:justify-start">
              <Zap size={18} className="text-indigo-500" /> TempVortex
            </div>
            <p className="text-xs text-zinc-500">Secure disposable identity service.</p>
          </div>
          <div className="flex gap-6 text-xs font-bold text-zinc-400">
            <button onClick={() => setActiveModal('safety')} className="hover:text-indigo-500 transition-colors">Safety</button>
            <button onClick={() => setActiveModal('privacy')} className="hover:text-indigo-500 transition-colors">Privacy</button>
            <button onClick={() => setActiveModal('terms')} className="hover:text-indigo-500 transition-colors">Terms</button>
          </div>
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">© 2024 TempVortex Labs</div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="glass p-6 rounded-[2rem] hover:shadow-xl transition-all group border border-white/20 dark:border-white/5">
    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-base font-bold mb-2">{title}</h3>
    <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
  </div>
);

export default App;