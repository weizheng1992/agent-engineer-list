'use client';

import React from 'react';
import {
  SlidersHorizontal,
  Activity,
  Zap,
  Sliders,
  Terminal,
  Code,
  Database,
  Hash,
  Sparkles,
  Eye
} from 'lucide-react';
import { i18n } from './i18n';

interface TabPromptBudgetProps {
  lang: 'zh' | 'en';
  tokenBudget: number;
  setTokenBudget: (val: number) => void;
  systemWeight: number;
  setSystemWeight: (val: number) => void;
  repoMapWeight: number;
  setRepoMapWeight: (val: number) => void;
  ragWeight: number;
  setRagWeight: (val: number) => void;
  historyWeight: number;
  setHistoryWeight: (val: number) => void;
  systemTokens: number;
  repoMapTokens: number;
  ragTokens: number;
  historyTokens: number;
  remainingTokens: number;
  promptVariables: {
    systemPrompt: string;
    repoMap: string;
    retrievedChunks: string;
    history: string;
    userQuery: string;
  };
  setPromptVariables: React.Dispatch<React.SetStateAction<{
    systemPrompt: string;
    repoMap: string;
    retrievedChunks: string;
    history: string;
    userQuery: string;
  }>>;
  compiledPrompt: string;
}

export const TabPromptBudget: React.FC<TabPromptBudgetProps> = ({
  lang,
  tokenBudget,
  setTokenBudget,
  systemWeight,
  setSystemWeight,
  repoMapWeight,
  setRepoMapWeight,
  ragWeight,
  setRagWeight,
  historyWeight,
  setHistoryWeight,
  systemTokens,
  repoMapTokens,
  ragTokens,
  historyTokens,
  remainingTokens,
  promptVariables,
  setPromptVariables,
  compiledPrompt
}) => {
  const t = i18n[lang];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* GRID: BUDGET SLIDER AND CHIPS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 1.1 SLIDER CONTROL */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <span>{t.budgetTitle}</span>
            </h3>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {tokenBudget.toLocaleString()} tokens
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-normal">{t.budgetDesc}</p>

          <div className="space-y-2 py-2">
            <input
              type="range"
              min="16000"
              max="200000"
              step="4000"
              value={tokenBudget}
              onChange={(e) => setTokenBudget(parseInt(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-950 cursor-pointer h-2 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>16K</span>
              <span>128K</span>
              <span>200K {lang === 'zh' ? '(长视窗)' : '(Long Window)'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-400">{t.weightsTitle}</div>

            {/* SYSTEM WEIGHT */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">{t.systemLabel}</span>
                <span className="text-indigo-400">{systemWeight}% ({systemTokens.toLocaleString()} tokens)</span>
              </div>
              <input
                type="range" min="5" max="30" value={systemWeight}
                onChange={(e) => setSystemWeight(parseInt(e.target.value))}
                className="w-full accent-indigo-400 h-1 bg-slate-950 rounded"
              />
            </div>

            {/* REPO MAP WEIGHT */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">{t.repoMapLabel}</span>
                <span className="text-cyan-400">{repoMapWeight}% ({repoMapTokens.toLocaleString()} tokens)</span>
              </div>
              <input
                type="range" min="10" max="40" value={repoMapWeight}
                onChange={(e) => setRepoMapWeight(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1 bg-slate-950 rounded"
              />
            </div>

            {/* RAG WEIGHT */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">{t.ragLabel}</span>
                <span className="text-emerald-400">{ragWeight}% ({ragTokens.toLocaleString()} tokens)</span>
              </div>
              <input
                type="range" min="5" max="45" value={ragWeight}
                onChange={(e) => setRagWeight(parseInt(e.target.value))}
                className="w-full accent-emerald-400 h-1 bg-slate-950 rounded"
              />
            </div>

            {/* HISTORY WEIGHT */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">{t.historyLabel}</span>
                <span className="text-purple-400">{historyWeight}% ({historyTokens.toLocaleString()} tokens)</span>
              </div>
              <input
                type="range" min="10" max="50" value={historyWeight}
                onChange={(e) => setHistoryWeight(parseInt(e.target.value))}
                className="w-full accent-purple-400 h-1 bg-slate-950 rounded"
              />
            </div>
          </div>
        </div>

        {/* 1.2 VISUAL BUDGET GRAPH & CHIPS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 xl:col-span-2">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>{lang === 'zh' ? '动态上下文分配占比柱图' : 'Dynamic Context Window Allocation'}</span>
          </h3>

          <div className="space-y-2 py-4">
            <div className="h-8 w-full rounded-lg overflow-hidden flex shadow-inner border border-slate-800">
              {systemTokens > 0 && <div className="bg-indigo-500 h-full hover:opacity-80 transition" style={{ width: `${(systemTokens / tokenBudget) * 100}%` }} title="System" />}
              {repoMapTokens > 0 && <div className="bg-cyan-500 h-full hover:opacity-80 transition" style={{ width: `${(repoMapTokens / tokenBudget) * 100}%` }} title="Repo Map" />}
              {ragTokens > 0 && <div className="bg-emerald-500 h-full hover:opacity-80 transition" style={{ width: `${(ragTokens / tokenBudget) * 100}%` }} title="RAG Chunks" />}
              {historyTokens > 0 && <div className="bg-purple-500 h-full hover:opacity-80 transition" style={{ width: `${(historyTokens / tokenBudget) * 100}%` }} title="History" />}
              {remainingTokens > 0 && <div className="bg-slate-800 h-full hover:opacity-80 transition" style={{ width: `${(remainingTokens / tokenBudget) * 100}%` }} title="Buffer" />}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 pt-3">
              <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 flex flex-col">
                <span className="text-[10px] text-indigo-400 font-bold uppercase">{lang === 'zh' ? '常驻环境 / System' : 'System Prompt'}</span>
                <span className="font-mono text-sm font-bold text-indigo-200">{systemTokens.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500">{t.systemDesc}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20 flex flex-col">
                <span className="text-[10px] text-cyan-400 font-bold uppercase">{lang === 'zh' ? '大地图 / Repo Map' : 'Repo Map'}</span>
                <span className="font-mono text-sm font-bold text-cyan-200">{repoMapTokens.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500">{t.repoMapDesc}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex flex-col">
                <span className="text-[10px] text-emerald-400 font-bold uppercase">{lang === 'zh' ? '召回块 / Chunks' : 'RAG Chunks'}</span>
                <span className="font-mono text-sm font-bold text-emerald-200">{ragTokens.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500">{t.ragDesc}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-950/20 border border-purple-500/20 flex flex-col">
                <span className="text-[10px] text-purple-400 font-bold uppercase">{lang === 'zh' ? '滚动记忆 / History' : 'History'}</span>
                <span className="font-mono text-sm font-bold text-purple-200">{historyTokens.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500">{t.historyDesc}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/20 border border-slate-700/30 flex flex-col col-span-2 md:col-span-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">{t.remainingLabel}</span>
                <span className="font-mono text-sm font-bold text-slate-200">{remainingTokens.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500">{t.remainingDesc}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 space-y-1.5 text-xs text-slate-400 flex items-start space-x-3">
            <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">{t.goldenRuleTitle}</strong> {t.goldenRuleText}
            </div>
          </div>
        </div>
      </div>

      {/* DUAL PANE: VARIABLES SETUP & COMPILED RESULT */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 font-sans">
        {/* DYNAMIC VARIABLE CONFIGURE */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col min-h-[400px]">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>{t.variablesTitle}</span>
          </h3>

          <div className="flex-1 space-y-4 pt-4 overflow-y-auto">
            {/* SYSTEM PROMPT INPUT */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-wide flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>{t.sysPromptVarLabel}</span>
              </label>
              <textarea
                value={promptVariables.systemPrompt}
                onChange={(e) => setPromptVariables(prev => ({ ...prev, systemPrompt: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                rows={2}
              />
            </div>

            {/* REPO MAP INPUT */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center space-x-1">
                <Code className="w-3.5 h-3.5" />
                <span>{t.repoMapVarLabel}</span>
              </label>
              <textarea
                value={promptVariables.repoMap}
                onChange={(e) => setPromptVariables(prev => ({ ...prev, repoMap: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                rows={3}
              />
            </div>

            {/* RETRIEVED CHUNKS */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center space-x-1">
                <Database className="w-3.5 h-3.5" />
                <span>{t.ragChunksVarLabel}</span>
              </label>
              <textarea
                value={promptVariables.retrievedChunks}
                onChange={(e) => setPromptVariables(prev => ({ ...prev, retrievedChunks: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
                rows={2}
              />
            </div>

            {/* HISTORY INPUT */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-purple-400 uppercase tracking-wide flex items-center space-x-1">
                <Hash className="w-3.5 h-3.5" />
                <span>{t.historyVarLabel}</span>
              </label>
              <textarea
                value={promptVariables.history}
                onChange={(e) => setPromptVariables(prev => ({ ...prev, history: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-purple-500"
                rows={2}
              />
            </div>

            {/* USER QUERY */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.userQueryVarLabel}</span>
              </label>
              <input
                type="text"
                value={promptVariables.userQuery}
                onChange={(e) => setPromptVariables(prev => ({ ...prev, userQuery: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* COMPILED VIEW */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>{t.assembledPromptTitle}</span>
            </h3>
            <div className="flex items-center space-x-2 text-[10px] font-mono">
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {t.estLabel}: {Math.round(compiledPrompt.length / 4.1)} tokens
              </span>
            </div>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 mt-4 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {compiledPrompt}
          </div>
        </div>
      </div>
    </div>
  );
};
export default TabPromptBudget;
