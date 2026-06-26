'use client';

import React from 'react';
import {
  SlidersHorizontal,
  Code,
  Database,
  Sparkles,
  Compass,
  Cpu,
  Sliders,
  Percent,
  ExternalLink
} from 'lucide-react';
import { i18n } from './i18n';

interface SidebarProps {
  lang: 'zh' | 'en';
  activeTab: 'budget' | 'code' | 'rag' | 'advanced';
  setActiveTab: (tab: 'budget' | 'code' | 'rag' | 'advanced') => void;
  tokenBudget: number;
  astOutlineLength: number;
  compressedSavings: number | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  lang,
  activeTab,
  setActiveTab,
  tokenBudget,
  astOutlineLength,
  compressedSavings
}) => {
  const t = i18n[lang];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="font-extrabold tracking-tight text-md bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              {t.sidebarTitle}
            </span>
          </div>
          <span className="text-[9px] bg-indigo-600/30 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-500/20">
            {t.version}
          </span>
        </div>

        <div className="p-3 space-y-1">
          <div className="text-xs font-semibold text-slate-500 px-3 py-2 uppercase tracking-wider font-sans">
            {t.tabsSection}
          </div>

          <button
            onClick={() => setActiveTab('budget')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center space-x-3 transition-all ${
              activeTab === 'budget'
                ? 'bg-gradient-to-r from-indigo-600/30 to-cyan-600/10 text-indigo-200 border border-indigo-500/30 font-medium'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>{t.tabPrompt}</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center space-x-3 transition-all ${
              activeTab === 'code'
                ? 'bg-gradient-to-r from-cyan-600/30 to-indigo-600/10 text-cyan-200 border border-cyan-500/30 font-medium'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Code className="w-4 h-4 text-cyan-400" />
            <span>{t.tabRepoAST}</span>
          </button>

          <button
            onClick={() => setActiveTab('rag')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center space-x-3 transition-all ${
              activeTab === 'rag'
                ? 'bg-gradient-to-r from-emerald-600/30 to-cyan-600/10 text-emerald-200 border border-emerald-500/30 font-medium'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>{t.tabRAG}</span>
          </button>

          <button
            onClick={() => setActiveTab('advanced')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center space-x-3 transition-all ${
              activeTab === 'advanced'
                ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/10 text-purple-200 border border-purple-500/30 font-medium'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>{t.tabAdvanced}</span>
          </button>
        </div>

        <div className="px-3 py-1 border-t border-slate-800/60 mt-4">
          <div className="text-xs font-semibold text-slate-500 px-3 py-2 uppercase tracking-wider font-sans">
            {t.connectedApps}
          </div>

          <a
            href="http://127.0.0.1:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent group transition-all"
          >
            <div className="flex items-center space-x-2 font-sans">
              <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>{t.workspaceAnalyzer}</span>
            </div>
            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition" />
          </a>
        </div>
      </div>

      {/* Dynamic Telemetry Status in Sidebar */}
      <div className="p-4 border-t border-slate-800 space-y-3 text-xs text-slate-500 font-sans">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.activeBudget}</span>
          </span>
          <span className="font-mono text-indigo-300 font-semibold">{tokenBudget / 1000}k tokens</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Code className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.astNodes}</span>
          </span>
          <span className="font-mono text-cyan-300 font-semibold">{astOutlineLength} nodes</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.vectorDim}</span>
          </span>
          <span className="font-mono text-emerald-300 font-semibold">{lang === 'zh' ? '128维 / 活跃' : '128d / Active'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Percent className="w-3.5 h-3.5 text-purple-400" />
            <span>{t.compressSaved}</span>
          </span>
          <span className="font-mono text-purple-300 font-semibold">
            {compressedSavings ? `${compressedSavings}%` : t.activeState}
          </span>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
