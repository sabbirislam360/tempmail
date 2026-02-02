import React, { useMemo } from 'react';
import { Mail, Trash2, FileDown, User, Clock, ChevronLeft, Inbox, ShieldCheck, Copy, Check, Paperclip, Download, FileText, Image as ImageIcon, File } from 'lucide-react';
import DOMPurify from 'dompurify';
import { EmailMessage, Attachment } from '../types';
import { toast } from 'sonner';

interface Props {
  messages: EmailMessage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (msg: EmailMessage) => void;
  onDownloadAttachment?: (messageId: string, attachment: Attachment) => void;
  onBackToList: () => void;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (contentType: string) => {
  if (contentType.includes('image')) return <ImageIcon size={16} className="text-pink-500" />;
  if (contentType.includes('pdf')) return <FileText size={16} className="text-red-500" />;
  return <File size={16} className="text-indigo-500" />;
};

export const InboxArea: React.FC<Props> = ({ 
  messages, selectedId, onSelect, onDelete, onDownload, onDownloadAttachment, onBackToList
}) => {
  const selectedMessage = messages.find(m => m.id === selectedId);
  const [copiedCode, setCopiedCode] = React.useState(false);

  // Smart OTP Extraction Logic
  const extractedOTP = useMemo(() => {
    if (!selectedMessage) return null;
    // Security Fix: Limit the search scope to first 2000 chars to prevent ReDoS on massive emails
    const rawContent = (selectedMessage.html || selectedMessage.body || '');
    const content = rawContent.substring(0, 2000); 

    // Enhanced Regex for better detection
    const otpRegex = /(?:code|otp|verify|verification|password|pin|access|token|key)[\s\S]{0,50}?(\b[A-Z0-9]{4,8}\b)/i;
    const match = content.match(otpRegex);
    if (match && match[1]) {
      const code = match[1];
      // Filter out years (19xx, 20xx) to avoid false positives
      if (/^\d{4}$/.test(code) && (parseInt(code) > 1950 && parseInt(code) < 2050)) return null; 
      return code;
    }
    // Fallback for standalone 6 digit codes
    const simpleRegex = /\b(\d{6})\b/;
    const simpleMatch = content.match(simpleRegex);
    return simpleMatch ? simpleMatch[1] : null;
  }, [selectedMessage]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success("Verification code copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getSanitizedHtml = (html: string) => {
    // Security Fix: Prevent Reverse Tabnabbing
    DOMPurify.addHook('afterSanitizeAttributes', function (node) {
      if ('target' in node && node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });

    return {
      __html: DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'div', 'span', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'h1', 'h2', 'h3'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'width', 'height', 'align', 'class', 'target'],
        ADD_ATTR: ['target'] // Open links in new tab
      })
    };
  };

  return (
    <div className="flex flex-col md:flex-row h-[600px] w-full max-w-6xl mx-auto glass rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden mb-12 shadow-2xl relative">
      {/* Sidebar - List */}
      <div className={`w-full md:w-80 lg:w-[400px] border-r border-zinc-200/50 dark:border-zinc-800/50 flex flex-col h-full bg-zinc-50/30 dark:bg-black/10 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
          <h3 className="font-extrabold flex items-center gap-3 text-lg">
            <Inbox size={20} className="text-indigo-600 dark:text-indigo-400" />
            Vortex Inbox
          </h3>
          <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
            {messages.length} Mails
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-400">
              <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-800 animate-pulse">
                <Mail size={28} className="text-zinc-300 dark:text-zinc-700" />
              </div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Inbox is empty</p>
              <p className="text-[10px] mt-3 uppercase tracking-[0.2em] font-bold opacity-40">Waiting for incoming data...</p>
            </div>
          ) : (
            messages.map((msg) => (
              <button
                type="button"
                key={msg.id}
                onClick={() => onSelect(msg.id)}
                className={`w-full text-left p-6 border-b border-zinc-200/30 dark:border-zinc-800/20 hover:bg-white dark:hover:bg-zinc-800/50 transition-all group relative ${selectedId === msg.id ? 'bg-white dark:bg-zinc-800/80 shadow-sm' : ''}`}
              >
                {selectedId === msg.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-r-full"></div>
                )}
                {!msg.isRead && selectedId !== msg.id && (
                  <div className="absolute right-4 top-6 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-bold text-sm truncate pr-6 group-hover:text-indigo-600 transition-colors ${!msg.isRead ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {msg.from.split('<')[0]}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap uppercase tracking-tighter">{msg.date.split(',')[0]}</span>
                </div>
                <div className={`text-xs font-medium truncate mb-2 leading-tight flex items-center gap-1.5 ${!msg.isRead ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-500 dark:text-zinc-500'}`}>
                  {msg.attachments && msg.attachments.length > 0 && <Paperclip size={12} className="text-indigo-500" />}
                  {msg.subject || "(No Subject)"}
                </div>
                <div className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase opacity-60">
                  <Clock size={10} />
                  {msg.date.split(',')[1]?.trim() || 'Just now'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main View - Content */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden bg-white/40 dark:bg-zinc-900/5 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
        {selectedMessage ? (
          <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-6 bg-white/60 dark:bg-zinc-950/40">
              <div className="flex items-center justify-between md:hidden">
                <button 
                  type="button"
                  onClick={onBackToList}
                  className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-black uppercase tracking-widest"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
              </div>
              <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white mb-3 leading-[1.15] break-words tracking-tight">{selectedMessage.subject}</h2>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                      <User size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{selectedMessage.from}</div>
                      <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">To: Identity Vortex <span className="opacity-30">•</span> {selectedMessage.date}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 self-end md:self-start">
                  <button 
                    type="button"
                    onClick={() => onDownload(selectedMessage)}
                    className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-xs font-bold shadow-lg shadow-emerald-600/20"
                    title="Export to PDF"
                  >
                    <FileDown size={18} />
                    <span className="hidden md:inline">PDF</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => onDelete(selectedMessage.id)}
                    className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-600 dark:text-zinc-300 hover:text-red-600 transition-all border border-zinc-200 dark:border-zinc-700"
                    title="Delete Permanently"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Smart OTP Extractor Card */}
            {extractedOTP && (
              <div className="px-6 md:px-8 pt-6 animate-in slide-in-from-top-2 duration-500">
                <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-3xl p-1 shadow-xl shadow-indigo-500/20">
                  <div className="bg-white dark:bg-zinc-900 rounded-[1.4rem] p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50">
                        <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={24} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Detected OTP Code</div>
                        <div className="text-2xl md:text-3xl font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-[0.2em] select-all">
                          {extractedOTP}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCopyCode(extractedOTP)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 ${copiedCode ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                      {copiedCode ? <Check size={18} /> : <Copy size={18} />}
                      <span className="hidden md:inline">{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Attachments Section */}
            {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
              <div className="px-6 md:px-8 pt-6">
                <div className="bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-5">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
                    <Paperclip size={12} />
                    Files Attached ({selectedMessage.attachments.length})
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedMessage.attachments.map((att) => (
                      <div 
                        key={att.id} 
                        className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-2.5 pl-4 pr-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm group hover:border-indigo-500/30 transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          {getFileIcon(att.contentType)}
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 truncate max-w-[150px]">{att.filename}</span>
                            <span className="text-[10px] font-medium text-zinc-400 uppercase">{formatSize(att.size)}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => onDownloadAttachment?.(selectedMessage.id, att)}
                          className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          title="Download File"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide">
              {selectedMessage.html ? (
                <div 
                  className="bg-white rounded-3xl p-6 md:p-10 overflow-hidden text-zinc-900 shadow-sm border border-zinc-200/50 text-sm md:text-base leading-relaxed email-content"
                  dangerouslySetInnerHTML={getSanitizedHtml(selectedMessage.html)}
                />
              ) : (
                <div className="whitespace-pre-wrap font-sans text-zinc-700 dark:text-zinc-300 text-sm md:text-base leading-relaxed bg-zinc-50 dark:bg-black/20 p-6 md:p-10 rounded-3xl border border-zinc-200 dark:border-white/5">
                  {selectedMessage.body || "This message has no plain-text content."}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-zinc-400">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-8 border border-zinc-200 dark:border-zinc-800 shadow-inner float-anim">
              <Mail size={40} className="md:size-56 text-zinc-200 dark:text-zinc-800" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-zinc-800 dark:text-zinc-200 mb-3">Identity Vortex Active</h3>
            <p className="max-w-xs text-sm font-medium opacity-60">
              Any email sent to your temporary address will appear here instantly.
            </p>
            <div className="mt-8 flex gap-4 opacity-50 text-[10px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Secure</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span>Live</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};