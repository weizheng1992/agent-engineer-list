'use client';

import React from 'react';
import {
  SlidersHorizontal,
  Bookmark,
  Eye,
  Database,
  Hash,
  Search,
  Sparkles
} from 'lucide-react';
import { i18n } from './i18n';

interface ChunkItem {
  id: string;
  text: string;
  start: number;
  end: number;
  size: number;
}

interface HybridSearchResult {
  id: string;
  text: string;
  denseRank: number;
  denseScore: number;
  sparseRank: number;
  sparseScore: number;
  denseRRF: number;
  sparseRRF: number;
  rrfScore: number;
}

interface TabRAGProps {
  lang: 'zh' | 'en';
  chunkText: string;
  setChunkText: (val: string) => void;
  chunkSize: number;
  setChunkSize: (val: number) => void;
  chunkOverlap: number;
  setChunkOverlap: (val: number) => void;
  chunks: ChunkItem[];
  selectedChunkForMath: ChunkItem | null;
  setSelectedChunkForMath: (item: ChunkItem) => void;
  similarityResult: {
    similarity: number;
    queryVecSample: number[];
    chunkVecVecSample: number[];
  } | null;
  ragQuery: string;
  setRagQuery: (val: string) => void;
  denseWeight: number;
  setDenseWeight: (val: number) => void;
  sparseWeight: number;
  setSparseWeight: (val: number) => void;
  searchResults: HybridSearchResult[];
}

export const TabRAG: React.FC<TabRAGProps> = ({
  lang,
  chunkText,
  setChunkText,
  chunkSize,
  setChunkSize,
  chunkOverlap,
  setChunkOverlap,
  chunks,
  selectedChunkForMath,
  setSelectedChunkForMath,
  similarityResult,
  ragQuery,
  setRagQuery,
  denseWeight,
  setDenseWeight,
  sparseWeight,
  setSparseWeight,
  searchResults
}) => {
  const t = i18n[lang];

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* INTERACTIVE CHUNKER */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* 3.1 CHUNK SETUP */}
        <div className="xl:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <span>{t.ragSandboxTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-normal">{t.ragSandboxDesc}</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t.rawInputLabel}</label>
            <textarea
              value={chunkText}
              onChange={(e) => setChunkText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{t.chunkSizeLabel}</span>
                <span className="text-emerald-400 font-bold">{chunkSize} chars</span>
              </div>
              <input
                type="range" min="100" max="600" step="10" value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{t.chunkOverlapLabel}</span>
                <span className="text-emerald-400 font-bold">{chunkOverlap} chars</span>
              </div>
              <input
                type="range" min="10" max="150" step="5" value={chunkOverlap}
                onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-3.5 text-xs text-slate-400 leading-normal flex items-start space-x-2.5">
            <Bookmark className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>{t.overlapBenefitTitle}</strong> {t.overlapBenefitText}
            </div>
          </div>
        </div>

        {/* 3.2 CHUNKER HIGHLIGHT PREVIEW */}
        <div className="xl:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[400px]">
          <div className="bg-slate-900/60 pb-3 border-b border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between items-center shrink-0">
            <span className="flex items-center space-x-1.5 font-bold text-slate-200">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>{t.highlightViewTitle}</span>
            </span>
            <span className="text-emerald-400 font-bold">{chunks.length} {t.chunksSuffix}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 mt-3 min-h-0 bg-slate-950 rounded-lg select-text border border-slate-900">
            {chunks.length === 0 ? (
              <div className="text-center text-slate-600 text-xs italic py-10">Waiting...</div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-slate-400 leading-relaxed font-mono">
                  {chunks.map((chunk, idx) => {
                    const bgColors = [
                      'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
                      'bg-indigo-500/15 text-indigo-200 border-indigo-500/30',
                      'bg-amber-500/15 text-amber-200 border-amber-500/30',
                      'bg-purple-500/15 text-purple-200 border-purple-500/30',
                      'bg-cyan-500/15 text-cyan-200 border-cyan-500/30'
                    ];
                    const borderClass = bgColors[idx % bgColors.length];

                    return (
                      <span
                        key={idx}
                        onClick={() => setSelectedChunkForMath(chunk)}
                        className={`inline-block p-1.5 m-0.5 rounded border cursor-pointer hover:ring-1 hover:ring-white/40 transition-all ${borderClass}`}
                        title={`Index range: ${chunk.start}-${chunk.end}`}
                      >
                        {chunk.text}
                        <span className="text-[8px] opacity-60 ml-1.5 font-sans font-bold bg-black/30 px-1 py-0.2 rounded">
                          #{idx}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VECTOR SIMILARITY MATH BOARD */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* VECTOR CHOOSE */}
        <div className="xl:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>{t.selectChunkTitle}</span>
          </h3>

          <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 py-3">
            {chunks.map((chunk, idx) => (
              <button
                key={chunk.id}
                onClick={() => setSelectedChunkForMath(chunk)}
                className={`w-full text-left p-3 rounded-lg border text-xs flex justify-between items-center transition-all ${
                  selectedChunkForMath?.id === chunk.id
                    ? 'bg-emerald-500/15 border-emerald-500/40 font-medium'
                    : 'bg-slate-950/40 border-slate-850/60 hover:bg-slate-800/30'
                }`}
              >
                <span className="truncate pr-4 text-slate-300 font-mono">"{chunk.text}"</span>
                <span className="text-[9px] font-bold font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  {t.chunkPrefix} #{idx}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* MATH SIMULATION BOX */}
        <div className="xl:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2 pb-3 border-b border-slate-800">
              <Hash className="w-4 h-4 text-emerald-400" />
              <span>{t.cosineMathTitle}</span>
            </h3>

            {similarityResult && selectedChunkForMath ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs leading-relaxed">
                {/* LEFT FORMULA PANEL */}
                <div className="space-y-2 font-mono">
                  <div>
                    <span className="text-indigo-400 font-bold">{t.queryVecLabel} [Q]:</span>
                    <div className="bg-slate-950/80 p-2 rounded text-[10px] text-slate-400 border border-slate-900 overflow-x-auto truncate">
                      [{similarityResult.queryVecSample.map(v => v.toFixed(4)).join(', ')}, ...] (128d)
                    </div>
                  </div>
                  <div>
                    <span className="text-emerald-400 font-bold">{t.chunkVecLabel} [C]:</span>
                    <div className="bg-slate-950/80 p-2 rounded text-[10px] text-slate-400 border border-slate-900 overflow-x-auto truncate">
                      [{similarityResult.chunkVecVecSample.map(v => v.toFixed(4)).join(', ')}, ...] (128d)
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 text-slate-300 border border-slate-900 text-[11px] font-sans">
                    <strong className="text-slate-100">{t.mathFormulaTitle}</strong>
                    <div className="text-[10px] text-emerald-400 my-1 bg-black/40 px-2 py-1 rounded font-mono">
                      Cosine Similarity = A • B / (||A|| * ||B||)
                    </div>
                    {t.mathFormulaText}
                  </div>
                </div>

                {/* RIGHT OUTCOME PANEL */}
                <div className="flex flex-col items-center justify-center bg-slate-950 rounded-xl p-4 border border-slate-850 text-center">
                  <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase mb-1">
                    {t.cosineScoreLabel}
                  </span>

                  <span className="font-extrabold text-3xl font-mono text-emerald-400 my-2">
                    {similarityResult.similarity.toFixed(6)}
                  </span>

                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-1 border border-slate-800">
                    <div className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full" style={{ width: `${similarityResult.similarity * 100}%` }} />
                  </div>

                  <span className="text-[9px] text-slate-500 mt-2 font-mono">
                    Query: "{ragQuery.substring(0, 30)}..."
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-600 text-xs italic py-8 text-center">{lang === 'zh' ? '请选择一个分块以显示余弦定理计算。' : 'Please select a chunk to see math computations.'}</div>
            )}
          </div>
        </div>
      </div>

      {/* HYBRID SEARCH & RRF */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>{t.hybridSearchTitle}</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">{t.hybridSearchDesc}</p>
          </div>

          <div className="flex items-center space-x-4 shrink-0 bg-slate-950 p-2 rounded-lg border border-slate-850">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-indigo-400 block font-bold">{t.denseWeightLabel} {Math.round(denseWeight * 100)}%</span>
              <input
                type="range" min="0" max="1" step="0.1" value={denseWeight}
                onChange={(e) => {
                  const dw = parseFloat(e.target.value);
                  setDenseWeight(dw);
                  setSparseWeight(parseFloat((1 - dw).toFixed(1)));
                }}
                className="w-24 accent-indigo-500 cursor-pointer h-1 rounded"
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-emerald-400 block font-bold">{t.sparseWeightLabel} {Math.round(sparseWeight * 100)}%</span>
              <input
                type="range" min="0" max="1" step="0.1" value={sparseWeight}
                onChange={(e) => {
                  const sw = parseFloat(e.target.value);
                  setSparseWeight(sw);
                  setDenseWeight(parseFloat((1 - sw).toFixed(1)));
                }}
                className="w-24 accent-emerald-500 cursor-pointer h-1 rounded"
              />
            </div>
          </div>
        </div>

        <div className="relative flex items-center bg-slate-950 rounded-lg border border-slate-850">
          <Search className="w-4 h-4 text-slate-500 absolute left-3" />
          <input
            type="text"
            value={ragQuery}
            onChange={(e) => setRagQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-transparent border-none text-slate-200 text-xs pl-9 pr-4 py-2.5 focus:outline-none"
          />
        </div>

        {/* RRF BOARD RESULTS */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-xs font-mono border-collapse text-left">
            <thead>
              <tr className="bg-slate-950 text-[10px] text-slate-400 border-b border-slate-800 font-bold font-sans">
                <th className="p-3">{t.colChunkIdx}</th>
                <th className="p-3">{t.colSnippet}</th>
                <th className="p-3 text-indigo-400">{t.colDenseRank}</th>
                <th className="p-3 text-emerald-400">{t.colSparseRank}</th>
                <th className="p-3 text-purple-400">{t.colFusedScore}</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-600 italic">No search results computed yet. Type a search query above.</td>
                </tr>
              ) : (
                searchResults.map((result, idx) => (
                  <tr key={result.id} className="border-b border-slate-800 bg-slate-900/10 hover:bg-slate-900/40 transition">
                    <td className="p-3 font-bold text-slate-400">#{result.id.replace('chunk-', '')}</td>
                    <td className="p-3 text-slate-300 max-w-[250px] truncate" title={result.text}>"{result.text}"</td>
                    <td className="p-3 text-indigo-300 font-medium">Rank {result.denseRank} <span className="opacity-60">({result.denseScore.toFixed(3)})</span></td>
                    <td className="p-3 text-emerald-300 font-medium">Rank {result.sparseRank} <span className="opacity-60">({result.sparseScore.toFixed(3)})</span></td>
                    <td className="p-3 bg-indigo-950/10">
                      <span className="font-extrabold text-purple-300">{result.rrfScore.toFixed(6)}</span>
                      <span className="text-[10px] bg-purple-500/15 border border-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded ml-2.5 font-bold font-sans">
                        {t.rankPrefix} {idx + 1} {t.rankSuffix}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850/80 text-[10px] text-slate-500 leading-relaxed font-sans">
          {t.rrfExplanation}
        </div>
      </div>
    </div>
  );
};
export default TabRAG;
