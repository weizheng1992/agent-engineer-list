'use client';

import React from 'react';
import {
  Minimize2,
  Percent,
  Eye,
  Bookmark,
  Loader2,
  RefreshCw,
  Compass,
  Zap,
  Sliders,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { i18n } from './i18n';

interface RerankItem {
  id: string;
  text: string;
  rawScore: number;
  rerankScore: number;
  initialRank: number;
  finalRank: number;
}

interface TabAdvancedProps {
  lang: 'zh' | 'en';
  compressText: string;
  setCompressText: (val: string) => void;
  compressionLevel: 'medium' | 'high';
  setCompressionLevel: (val: 'medium' | 'high') => void;
  compressedResult: {
    originalLength: number;
    compressedLength: number;
    savingsPercent: number;
    compressedText: string;
  } | null;
  summaryMemory: string;
  isSummarizing: boolean;
  handleGenerateSummaryMemory: () => void;
  ragQuery: string;
  rerankedChunks: RerankItem[];
  hasReranked: boolean;
  setHasReranked: (val: boolean) => void;
  setRerankedChunks: React.Dispatch<React.SetStateAction<RerankItem[]>>;
}

export const TabAdvanced: React.FC<TabAdvancedProps> = ({
  lang,
  compressText,
  setCompressText,
  compressionLevel,
  setCompressionLevel,
  compressedResult,
  summaryMemory,
  isSummarizing,
  handleGenerateSummaryMemory,
  ragQuery,
  rerankedChunks,
  hasReranked,
  setHasReranked,
  setRerankedChunks
}) => {
  const t = i18n[lang];

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* COMPRESSION PANEL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* COMPRESSION CONTROLS */}
        <div className="xl:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-[450px]">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Minimize2 className="w-4 h-4 text-purple-400" />
              <span>{t.compressTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 leading-normal">{t.compressDesc}</p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t.rawLogLabel}</label>
              <textarea
                value={compressText}
                onChange={(e) => setCompressText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-purple-500"
                rows={6}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t.compressLevelLabel}</span>

              <div className="flex space-x-1 border border-slate-800 bg-slate-950 rounded p-0.5">
                <button
                  onClick={() => setCompressionLevel('medium')}
                  className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition cursor-pointer ${
                    compressionLevel === 'medium'
                      ? 'bg-purple-600 text-purple-100'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t.compressMedBtn}
                </button>
                <button
                  onClick={() => setCompressionLevel('high')}
                  className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition cursor-pointer ${
                    compressionLevel === 'high'
                      ? 'bg-purple-600 text-purple-100'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t.compressHighBtn}
                </button>
              </div>
            </div>

            <div className="bg-purple-950/10 border border-purple-500/20 rounded p-3 text-[10px] text-slate-400 leading-normal flex items-start space-x-2.5">
              <Percent className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <strong>{lang === 'zh' ? '高能语义清洗:' : 'Semantic Pruning:'}</strong> {t.compressBenefitText}
              </div>
            </div>
          </div>
        </div>

        {/* COMPRESSION OUTPUT COMPARISON */}
        <div className="xl:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-[450px]">
          <div>
            <div className="bg-slate-900/60 pb-3 border-b border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between items-center shrink-0">
              <span className="flex items-center space-x-1.5 font-bold text-slate-200">
                <Eye className="w-4 h-4 text-purple-400" />
                <span>{t.compressOutputTitle}</span>
              </span>
              {compressedResult && (
                <span className="text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-sans">
                  {compressedResult.compressedLength} chars ({compressedResult.savingsPercent}% {t.compressSavingLabel})
                </span>
              )}
            </div>

            <div className="flex-1 bg-slate-950 border border-slate-900 rounded-lg p-3.5 font-mono text-xs text-slate-400 mt-4 overflow-y-auto max-h-[250px] whitespace-pre-wrap leading-relaxed">
              {compressedResult?.compressedText}
            </div>
          </div>

          {compressedResult && (
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{t.originalSizeLabel}</span>
                  <span className="font-mono font-bold text-slate-300">{compressedResult.originalLength} chars</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{t.compressedSizeLabel}</span>
                  <span className="font-mono font-bold text-purple-400">{compressedResult.compressedLength} chars</span>
                </div>
              </div>

              <div className="bg-purple-950/20 border border-purple-500/35 px-4 py-2.5 rounded-lg flex items-center space-x-2.5">
                <span className="text-xs font-bold text-purple-300">{t.reductionLabel}</span>
                <span className="font-extrabold text-xl font-mono text-purple-400">-{compressedResult.savingsPercent}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY MEMORY & ADAPTIVE RETRIEVAL */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* SUMMARY MEMORY SYSTEM */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Bookmark className="w-4 h-4 text-purple-400" />
                <span>{t.summaryTitle}</span>
              </h3>
              <button
                onClick={handleGenerateSummaryMemory}
                disabled={isSummarizing}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition disabled:opacity-50 cursor-pointer"
                title={t.distillBtnTitle}
              >
                {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : <RefreshCw className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-normal">{t.summaryDesc}</p>

            <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 text-xs font-mono text-slate-300 leading-relaxed min-h-[100px] flex items-center">
              {isSummarizing ? (
                <div className="w-full flex justify-center items-center text-slate-500 space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span>{t.summarizingLabel}</span>
                </div>
              ) : (
                <span>{summaryMemory}</span>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 leading-normal bg-slate-950/40 p-2.5 rounded border border-slate-850 font-sans">
            <strong>{t.distillBenefitTitle}</strong> {t.distillBenefitText}
          </div>
        </div>

        {/* ADAPTIVE RETRIEVAL ENGINE */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Compass className="w-4 h-4 text-purple-400" />
              <span>{t.routerTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 leading-normal">{t.routerDesc}</p>

            <div className="space-y-2 pt-1 text-xs">
              {/* DYNAMIC RETRIEVAL DECISION CARD */}
              {(() => {
                const queryLower = ragQuery.toLowerCase();
                const isRepoMapRoute = queryLower.includes('package') || queryLower.includes('schema') || queryLower.includes('.ts') || queryLower.includes('.json') || queryLower.includes('.css');
                const isHybridRoute = queryLower.includes('how') || queryLower.includes('optimize') || queryLower.includes('explain') || queryLower.includes('why') || queryLower.includes('drizzle') || queryLower.includes('sessions') || queryLower.includes('table');

                let routeTitle = t.routerCasualTitle;
                let routeLabel = t.routerCasualLabel;
                let borderGlow = 'border-slate-800/80 bg-slate-950/40';

                if (isRepoMapRoute) {
                  routeTitle = t.routerRepoMapTitle;
                  routeLabel = t.routerRepoMapLabel;
                  borderGlow = 'border-cyan-500/40 bg-cyan-500/5 ring-1 ring-cyan-500/20';
                } else if (isHybridRoute) {
                  routeTitle = t.routerHybridTitle;
                  routeLabel = t.routerHybridLabel;
                  borderGlow = 'border-indigo-500/40 bg-indigo-500/5 ring-1 ring-indigo-500/20';
                }

                return (
                  <div className={`p-3 rounded-lg border flex items-center justify-between shadow-md transition-all duration-300 ${borderGlow}`}>
                    <div className="space-y-0.5">
                      <div className="font-bold text-purple-200 text-xs flex items-center space-x-1.5 font-sans">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        <span>{t.routerActiveTitle}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[190px]" title={ragQuery}>
                        Q: "{ragQuery}"
                      </div>
                    </div>
                    <span className="text-[8px] font-bold font-mono bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2 py-1 rounded uppercase shrink-0">
                      {routeLabel}
                    </span>
                  </div>
                );
              })()}

              <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/30 flex items-center justify-between opacity-60">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-400">{t.routerComplexTitle}</div>
                  <div className="text-[10px] text-slate-500">e.g. "How do database schemas interconnect?"</div>
                </div>
                <span className="text-[9px] font-bold font-mono bg-slate-850 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full uppercase shrink-0">
                  {lang === 'zh' ? '混合 RAG' : 'Hybrid RAG'}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/30 flex items-center justify-between opacity-60">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-400">{t.routerSimpleTitle}</div>
                  <div className="text-[10px] text-slate-500">e.g. "Show package.json dependencies"</div>
                </div>
                <span className="text-[9px] font-bold font-mono bg-slate-850 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full uppercase shrink-0">
                  {lang === 'zh' ? '大地图 / Repo-Map' : 'Repo-Map'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-purple-950/15 border border-purple-500/20 rounded p-2.5 text-[10px] text-slate-400 leading-normal">
            <strong>{t.routerImpactTitle}</strong> {t.routerImpactText}
          </div>
        </div>
      </div>

      {/* RE-RANKING ENGINE PLAYGROUND */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>{t.rerankTitle}</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">{t.rerankDesc}</p>
          </div>

          <button
            onClick={() => {
              setHasReranked(true);
              const re = [...rerankedChunks];
              re.sort((a, b) => b.rerankScore - a.rerankScore);
              setRerankedChunks(re);
            }}
            disabled={hasReranked}
            className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-purple-100 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{t.rerankBtn}</span>
          </button>
        </div>

        <div className="space-y-2.5 font-mono">
          {rerankedChunks.map((node, idx) => (
            <div
              key={node.id}
              className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                hasReranked && idx === 0
                  ? 'bg-purple-500/10 border-purple-500/40 shadow-sm'
                  : 'bg-slate-950 border-slate-850/60'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <span className="font-bold text-slate-400 text-xs">#{node.id}</span>
                <p className="text-slate-300 text-xs truncate max-w-[450px]">"{node.text}"</p>
              </div>

              <div className="flex items-center space-x-5 shrink-0 text-xs">
                <div className="flex flex-col font-sans">
                  <span className="text-[9px] text-slate-500 uppercase">{t.colVectorRank}</span>
                  <span className="text-slate-400 font-medium font-mono">{node.rawScore.toFixed(2)} ({lang === 'zh' ? '排名' : 'Rank'} {node.initialRank})</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <div className="flex flex-col font-sans">
                  <span className="text-[9px] text-purple-400 uppercase">{t.colRerankScore}</span>
                  <span className="text-purple-300 font-bold font-mono">{node.rerankScore.toFixed(2)} ({lang === 'zh' ? '重排第' : 'Rank'} {hasReranked ? idx + 1 : '?'})</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasReranked && (
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center space-x-2 text-xs text-emerald-300 animate-slideUp">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>{t.rerankVerdictTitle}</strong> {t.rerankVerdictText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
export default TabAdvanced;
