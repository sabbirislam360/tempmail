
import React from 'react';
import { Server, ChevronDown } from 'lucide-react';
import { ProviderType } from '../types';

interface Props {
  active: ProviderType;
  onChange: (p: ProviderType) => void;
}

const getProviderDisplayName = (p: ProviderType) => {
  switch(p) {
    case '1secmail': return '1secmail';
    case 'mailtm': return 'Mail.tm';
    case 'guerrilla': return 'Guerrilla Mail';
    default: return 'Unknown';
  }
};

export const ProviderSelector: React.FC<Props> = ({ active, onChange }) => {
  return (
    <div className="relative group">
      <button className="flex items-center space-x-1.5 md:space-x-2 px-2 md:px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors border border-zinc-300 dark:border-zinc-700 text-[11px] md:text-sm font-medium">
        <Server size={14} className="text-indigo-600 dark:text-indigo-400" />
        <span className="capitalize">{getProviderDisplayName(active)}</span>
        <ChevronDown size={14} className="text-zinc-500" />
      </button>
      <div className="absolute top-full mt-2 right-0 w-44 md:w-48 py-2 glass rounded-xl border border-zinc-200 dark:border-zinc-800 hidden group-hover:block z-50 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={() => onChange('1secmail')}
          className={`w-full text-left px-4 py-2.5 text-xs md:text-sm hover:bg-indigo-50 dark:hover:bg-zinc-800/50 ${active === '1secmail' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-500 dark:text-zinc-400'}`}
        >
          1secmail (Global)
        </button>
        <button 
          onClick={() => onChange('mailtm')}
          className={`w-full text-left px-4 py-2.5 text-xs md:text-sm hover:bg-indigo-50 dark:hover:bg-zinc-800/50 ${active === 'mailtm' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-500 dark:text-zinc-400'}`}
        >
          Mail.tm (Premium)
        </button>
        <button 
          onClick={() => onChange('guerrilla')}
          className={`w-full text-left px-4 py-2.5 text-xs md:text-sm hover:bg-indigo-50 dark:hover:bg-zinc-800/50 ${active === 'guerrilla' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-500 dark:text-zinc-400'}`}
        >
          Guerrilla Mail (Legacy)
        </button>
      </div>
    </div>
  );
};
