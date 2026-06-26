'use client';

import React from 'react';
import {
  Compass,
  Loader2,
  FileCode,
  FileText,
  Code,
  Zap
} from 'lucide-react';
import { i18n } from './i18n';

interface FileItem {
  name: string;
  path: string;
  size: number;
  score: number;
  type: string;
}

interface ASTItem {
  type: string;
  name: string;
  source?: string;
  params?: string;
  line: number;
}

interface TabRepoASTProps {
  lang: 'zh' | 'en';
  files: FileItem[];
  selectedFile: string;
  handleFileSelect: (path: string) => void;
  fileContent: string;
  customCode: string;
  setCustomCode: (val: string) => void;
  astOutline: ASTItem[];
  handleParseCustomCode: () => void;
  setSelectedFile: (path: string) => void;
}

export const TabRepoAST: React.FC<TabRepoASTProps> = ({
  lang,
  files,
  selectedFile,
  handleFileSelect,
  fileContent,
  customCode,
  setCustomCode,
  astOutline,
  handleParseCustomCode,
  setSelectedFile
}) => {
  const t = i18n[lang];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fadeIn font-sans">
      {/* 2.1 FILE INDEX & REPO MAP */}
      <div className="xl:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[650px]">
        <div className="pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>{t.repoMapTitle}</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
            {t.repoMapDescText}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-1.5 pr-1">
          {files.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500 mb-2" />
              {t.scanningFiles}
            </div>
          ) : (
            files.map((file, idx) => (
              <button
                key={idx}
                onClick={() => handleFileSelect(file.path)}
                className={`w-full text-left p-3 rounded-lg border flex items-center justify-between transition-all ${
                  selectedFile === file.path
                    ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-950/40 border-slate-850/60 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {file.type === 'tsx' || file.type === 'ts' ? (
                    <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate font-mono">{file.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{file.path}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 font-mono">
                  <span className="text-[9px] text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    file.score >= 80
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : file.score >= 60
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-850 text-slate-400 border-slate-700/40'
                  }`}>
                    {t.scoreLabel}: {file.score}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 2.2 AST PARSE OUTLINE */}
      <div className="xl:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[650px]">
        {/* TAB SWITCH */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <Code className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-slate-200">
              {selectedFile
                ? `${t.astParserTitle}: ${selectedFile.split('/').pop()}`
                : t.customCodeParserTitle}
            </span>
          </div>

          <div className="flex space-x-1.5">
            <button
              onClick={() => handleFileSelect(files[0]?.path || '')}
              className={`px-3 py-1 rounded text-xs transition-all border cursor-pointer ${
                selectedFile
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 font-medium'
                  : 'bg-slate-950 text-slate-500 border-slate-850 hover:text-slate-300'
              }`}
            >
              {t.workspaceFileBtn}
            </button>
            <button
              onClick={() => {
                setSelectedFile('');
                handleParseCustomCode();
              }}
              className={`px-3 py-1 rounded text-xs transition-all border cursor-pointer ${
                !selectedFile
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 font-medium'
                  : 'bg-slate-950 text-slate-500 border-slate-850 hover:text-slate-300'
              }`}
            >
              {t.pasteCodeBtn}
            </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 min-h-0">
          {/* LEFT PANE: CODE PREVIEW */}
          <div className="flex flex-col h-full min-h-0 border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
            <div className="bg-slate-900/60 px-3 py-2 border-b border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between items-center shrink-0">
              <span>{t.codeViewerLabel}</span>
              <span>UTF-8</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed relative">
              {selectedFile ? (
                <pre className="text-slate-300 select-text whitespace-pre-wrap">{fileContent}</pre>
              ) : (
                <textarea
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="w-full h-full bg-transparent border-none text-slate-300 focus:outline-none focus:ring-0 resize-none font-mono text-[11px] leading-relaxed p-0 whitespace-pre"
                  placeholder={t.pasteCodePlaceholder}
                />
              )}
            </div>

            {!selectedFile && (
              <div className="p-2 border-t border-slate-800 bg-slate-900/40 shrink-0">
                <button
                  onClick={handleParseCustomCode}
                  className="w-full py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-cyan-100 text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{t.runASTBtn}</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT PANE: AST EXTRACTIONS */}
          <div className="flex flex-col h-full min-h-0 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
            <div className="bg-slate-900/60 px-3 py-2 border-b border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between items-center shrink-0">
              <span>{t.astOutlineLabel}</span>
              <span className="text-cyan-400 font-bold">{astOutline.length} Elements</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {astOutline.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs p-4 text-center">
                  <Code className="w-8 h-8 opacity-30 text-cyan-500 animate-pulse mb-1" />
                  <p>{t.noASTOutline}</p>
                  <p className="text-[10px] opacity-75">{t.noASTDesc}</p>
                </div>
              ) : (
                astOutline.map((node, index) => {
                  let badgeBg = 'bg-slate-850 text-slate-300 border-slate-700/55';
                  if (node.type === 'import') badgeBg = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                  else if (node.type === 'function' || node.type === 'arrow-function') badgeBg = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                  else if (node.type === 'class') badgeBg = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                  else if (node.type === 'interface/type') badgeBg = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                  else if (node.type === 'schema') badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                  return (
                    <div key={index} className="p-2.5 rounded border border-slate-800/80 bg-slate-900/30 flex items-start space-x-2.5">
                      <span className="text-[9px] font-mono text-slate-500 mt-1">L{node.line}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border ${badgeBg} uppercase shrink-0`}>
                            {node.type}
                          </span>
                          <span className="text-xs font-bold text-slate-200 truncate font-mono">
                            {node.name}
                          </span>
                        </div>
                        {node.source && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                            from '{node.source}'
                          </div>
                        )}
                        {node.params && (
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate italic bg-slate-950/60 p-1 rounded">
                            {lang === 'zh' ? '参数' : 'Params'}: ({node.params})
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-900/40 border-t border-slate-850 text-[10px] text-slate-500 leading-normal shrink-0">
              {t.symbolsBenefit}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TabRepoAST;
