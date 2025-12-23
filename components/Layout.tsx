
import React from 'react';
import { Palette, ChevronLeft, History } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  title?: string;
  fullWidth?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, onBack, showBack, title, fullWidth }) => {
  return (
    <div className={`h-screen flex flex-col bg-[#F8F9FA] mx-auto relative overflow-hidden shadow-2xl border-x border-slate-100 ${fullWidth ? 'w-full max-w-none' : 'max-w-md'}`}>
      {/* Dynamic Header */}
      <header className={`px-6 pt-4 pb-4 glass sticky top-0 z-[60] flex items-center justify-between border-b border-white/40 ${fullWidth ? 'pt-4' : 'pt-12'}`}>
        <div className="flex items-center gap-3">
          {showBack ? (
            <button 
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm active:scale-90 transition-transform"
            >
              <ChevronLeft size={22} className="text-slate-800" />
            </button>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
              <Palette size={20} className="text-white" />
            </div>
          )}
          <span className="font-bold text-lg text-slate-900 tracking-tight">
            {title || '好家改造'}
          </span>
        </div>
        {!showBack && (
          <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-400">
            <History size={20} />
          </button>
        )}
      </header>
      
      <main className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 flex flex-col">
        {children}
        
        <div className="mt-auto py-8 flex flex-col items-center justify-center gap-1 opacity-60">
           <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] text-slate-400 font-medium">由佛山市好家改造网络科技有限公司开发</span>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
           </div>
           <span className="text-[9px] text-slate-300 font-mono">v0.0.1 Beta</span>
        </div>
      </main>

      {/* Persistent Action Bar Hint for Mobile Safari */}
      <div className="h-8 bg-white/50" />
    </div>
  );
};