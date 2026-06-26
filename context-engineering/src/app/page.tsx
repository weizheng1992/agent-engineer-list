'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  RefreshCw
} from 'lucide-react';

// Import our newly modularized sub-components
import Sidebar from '@/components/Sidebar';
import AgentChat from '@/components/AgentChat';
import TabPromptBudget from '@/components/TabPromptBudget';
import TabRepoAST from '@/components/TabRepoAST';
import TabRAG from '@/components/TabRAG';
import TabAdvanced from '@/components/TabAdvanced';
import { i18n } from '@/components/i18n';

// Import our custom state-management hooks
import {
  useLanguage,
  useWorkspaceFiles,
  useRAGPlayground,
  useAdvancedControls,
  FileItem,
  ASTItem,
  ChunkItem,
  HybridSearchResult,
  Message,
  ReActStep
} from '@/hooks/useContextEngine';

export default function ContextEngineeringDashboard() {
  const [activeTab, setActiveTab] = useState<'budget' | 'code' | 'rag' | 'advanced'>('budget');
  const [loading, setLoading] = useState(false);

  // 1. Language Hook
  const { lang, toggleLang } = useLanguage();

  // --- AGENT CHAT STATES (LEFT PANEL) ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [reactSteps, setReactSteps] = useState<ReActStep[]>([]);
  const [sseRawLogs, setSseRawLogs] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sseEndRef = useRef<HTMLDivElement>(null);

  // 2. RAG Playground Hook (Needs lang & messages)
  const {
    chunkText,
    setChunkText,
    chunkSize,
    setChunkSize,
    chunkOverlap,
    setChunkOverlap,
    chunks,
    setChunks,
    ragQuery,
    setRagQuery,
    denseWeight,
    setDenseWeight,
    sparseWeight,
    setSparseWeight,
    searchResults,
    setSearchResults,
    selectedChunkForMath,
    setSelectedChunkForMath,
    similarityResult,
    handleChunkText
  } = useRAGPlayground(lang, messages, setLoading);

  // 3. Workspace Files Hook (Needs setLoading & setChunkText)
  const {
    files,
    selectedFile,
    setSelectedFile,
    fileContent,
    setFileContent,
    astOutline,
    setASTOutline,
    customCode,
    setCustomCode,
    loadFiles,
    handleFileSelect,
    handleParseCustomCode
  } = useWorkspaceFiles(setLoading, setChunkText);

  // 4. Advanced Controls Hook (Needs lang, messages, chunks, setLoading)
  const {
    compressText,
    setCompressText,
    compressionLevel,
    setCompressionLevel,
    compressedResult,
    summaryMemory,
    setSummaryMemory,
    isSummarizing,
    rerankedChunks,
    setRerankedChunks,
    hasReranked,
    setHasReranked,
    handleGenerateSummaryMemory
  } = useAdvancedControls(lang, messages, chunks, setLoading);

  // --- TAB 1: TOKEN BUDGET STATES ---
  const [tokenBudget, setTokenBudget] = useState(128000); // 128k
  const [systemWeight, setSystemWeight] = useState(15);   // %
  const [repoMapWeight, setRepoMapWeight] = useState(25); // %
  const [historyWeight, setHistoryWeight] = useState(30); // %
  const [ragWeight, setRagWeight] = useState(20);     // %

  // Computed token counts
  const systemTokens = Math.round((tokenBudget * systemWeight) / 100);
  const repoMapTokens = Math.round((tokenBudget * repoMapWeight) / 100);
  const historyTokens = Math.round((tokenBudget * historyWeight) / 100);
  const ragTokens = Math.round((tokenBudget * ragWeight) / 100);
  const remainingTokens = Math.max(0, tokenBudget - (systemTokens + repoMapTokens + historyTokens + ragTokens));

  const [promptVariables, setPromptVariables] = useState({
    systemPrompt: '',
    repoMap: '',
    retrievedChunks: '',
    history: '',
    userQuery: '',
  });

  const [promptTemplate, setPromptPromptTemplate] = useState(
`=== SYSTEM INSTRUCTIONS ===
{{SYSTEM_PROMPT}}

=== REPOSITORY TREE MAP ===
{{REPO_MAP}}

=== RELEVANT CONTEXT (RAG) ===
{{RETRIEVED_CHUNKS}}

=== CONVERSATION HISTORY ===
{{HISTORY}}

=== USER QUERY ===
{{USER_QUERY}}`
  );

  const [compiledPrompt, setCompiledPrompt] = useState('');

  const compilePrompt = () => {
    let result = promptTemplate;
    result = result.replace('{{SYSTEM_PROMPT}}', promptVariables.systemPrompt);
    result = result.replace('{{REPO_MAP}}', promptVariables.repoMap);
    result = result.replace('{{RETRIEVED_CHUNKS}}', promptVariables.retrievedChunks);
    result = result.replace('{{HISTORY}}', promptVariables.history);
    result = result.replace('{{USER_QUERY}}', promptVariables.userQuery);
    setCompiledPrompt(result);
  };

  useEffect(() => {
    compilePrompt();
  }, [promptVariables, promptTemplate]);

  // Synchronize placeholder promptVariables on language toggle (before active chat starts)
  useEffect(() => {
    if (messages.length <= 1) {
      setPromptVariables({
        systemPrompt: lang === 'zh'
          ? '你是一个强大的 AI 编程助理。你需要充分利用大地图上下文（Repo Map）与检索召回（RAG Chunks），给出高精准度的代码修改意见。'
          : 'You are an advanced AI coding assistant. Fully leverage Repo Maps and RAG retrieved context chunks to output high-accuracy code modification plans.',
        repoMap: lang === 'zh'
          ? '📁 src/\n  📄 page.tsx (核心视图 - 重要度: 90)\n  📄 route.ts (上下文 API - 重要度: 85)\n📁 src/db/\n  📄 schema.ts (数据结构 - 重要度: 95)'
          : '📁 src/\n  📄 page.tsx (Core Workspace View - Core Score: 90)\n  📄 route.ts (Context Engine API - Core Score: 85)\n📁 src/db/\n  📄 schema.ts (Database Schema - Core Score: 95)',
        retrievedChunks: lang === 'zh'
          ? '[分块-0]: import { pgTable, text } from "drizzle-orm/pg-core";\n[分块-1]: export const sessions = pgTable("sessions", { id: uuid("id") });'
          : '[Chunk-0]: import { pgTable, text } from "drizzle-orm/pg-core";\n[Chunk-1]: export const sessions = pgTable("sessions", { id: uuid("id") });',
        history: lang === 'zh'
          ? '用户: 数据库怎么配？\n助手: 使用 drizzle-orm 的 pgTable 声明 sessions。'
          : 'User: How does the schema work?\nAssistant: The schema defines sessions and messages with pgTable in drizzle-orm.',
        userQuery: lang === 'zh'
          ? '如何新增一张名为 logs 的数据库表？'
          : 'How do I add a new table named logs?',
      });
    }
  }, [lang, messages]);

  // Synchronize active live chat history (JSON) to the Advanced tab's Context Compression input box!
  useEffect(() => {
    if (messages.length > 1) {
      const rawChatHistoryJson = JSON.stringify(messages, null, 2);
      setCompressText(rawChatHistoryJson);
    }
  }, [messages]);

  // --- CHAT AGENT HANDLER (LEFT PANEL STREAMING) ---
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    setChatLoading(true);
    const userMsg: Message = { role: 'user', content: chatInput };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');

    // Reset current trace and sse telemetry logs
    setReactSteps([]);
    setSseRawLogs([]);

    // --- SMART PROACTIVE FILE SELECTOR & RAG MATCHING FAIL-SAFE ---
    const queryLower = chatInput.toLowerCase();
    const matchedFile = files.find(f => queryLower.includes(f.name.toLowerCase()));
    if (matchedFile) {
      handleFileSelect(matchedFile.path);
    }

    // Clear system greetings
    const cleanPayload = updatedMessages.filter((msg, idx) => !(msg.role === 'assistant' && idx === 0));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: cleanPayload,
          contextSettings: {
            tokenBudget,
            compressionLevel,
          }
        }),
      });

      if (!response.body) throw new Error("No response body.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiContent = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      let buffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            // Log raw chunks
            setSseRawLogs((prev) => [...prev, line]);

            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;

            const prefix = line.slice(0, colonIndex);
            const payloadStr = line.slice(colonIndex + 1);

            if (prefix === '0') {
              try {
                const textChunk = JSON.parse(payloadStr);
                if (typeof textChunk === 'string') {
                  aiContent += textChunk;
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (updated.length > 0) {
                      updated[updated.length - 1] = { role: 'assistant', content: aiContent };
                    }
                    return updated;
                  });
                }
              } catch (e) {}
            } else if (prefix === '2') {
              try {
                const packet = JSON.parse(payloadStr);
                if (packet && typeof packet === 'object') {
                  // Handle steps
                  setReactSteps((prev) => {
                    if (prev.some(item => item.message === packet.message && item.type === packet.type)) {
                      return prev;
                    }
                    return [...prev, packet as ReActStep];
                  });

                  // --- MAGIC TELEMETRY INTEGRATION ---
                  if (packet.type === 'telemetry' && packet.details) {
                    const { filePath, fileContent: content, chunks: telemetryChunks, query: telemetryQuery, searchResults: telemetryRRF } = packet.details;

                    // --- UNIVERSAL QUERY SYNC ---
                    if (telemetryQuery) {
                      setRagQuery(telemetryQuery);
                      setPromptVariables(prev => ({
                        ...prev,
                        userQuery: telemetryQuery
                      }));
                    }

                    if (filePath && content) {
                      setSelectedFile(filePath);
                      setFileContent(content);
                      setActiveTab('code'); // Auto-switch tab to AST map!

                      // Re-parse AST outline
                      const astRes = await fetch('/api/context-engine', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'parse-ast', code: content }),
                      });
                      const astData = await astRes.json();
                      if (astData.success) {
                        setASTOutline(astData.outline);
                      }
                    }

                    // Dynamically map real-time telemetry into the RAG tab!
                    if (content && telemetryChunks && telemetryQuery && telemetryRRF) {
                      setChunkText(content);
                      setChunks(telemetryChunks);
                      setSearchResults(telemetryRRF);
                      if (telemetryChunks.length > 0) {
                        setSelectedChunkForMath(telemetryChunks[0]);
                      }

                      // --- DYNAMIC RE-RANKING MAP (TAB 4) ---
                      const top3 = telemetryRRF.slice(0, 3).map((item: any, index: number) => {
                        const boost = index === 0 ? 0.09 : index === 1 ? -0.12 : -0.22;
                        const baseScore = item.denseScore || 0.75;
                        const rerankScore = Math.min(0.98, Math.max(0.15, baseScore + boost));

                        return {
                          id: item.id.replace('chunk-', ''),
                          text: item.text,
                          rawScore: baseScore,
                          rerankScore: rerankScore,
                          initialRank: index + 1,
                          finalRank: 0,
                        };
                      });
                      setHasReranked(false);
                      setRerankedChunks(top3);

                      // --- DYNAMIC SUMMARY MEMORY GENERATOR ---
                      const fileName = filePath ? filePath.split('/').pop() : 'code file';
                      const summaryText = lang === 'zh'
                        ? `会话动态滚动记忆：环境装配就绪。用户就 [${fileName}] 及 [${telemetryQuery.substring(0, 35)}...] 的运行逻辑发起提问。智能体启动了本地 MCP 管道，编译提取出该文件的关键 AST 节点，并将其滑动切分成了 ${telemetryChunks.length} 个多色召回块，融合后的最优语境已顺利推送给 LLM 做后续推理。`
                        : `Evolving Memory Summary: Workspace initialized. User queried [${fileName}] regarding [${telemetryQuery.substring(0, 35)}...]. Code agent invoked stdio MCP client, split contents into ${telemetryChunks.length} multi-colored blocks, and pushed the optimal hybrid search context to LLM for reasoning.`;

                      setSummaryMemory(summaryText);

                      // --- SYNC TO PROMPT COMPILER VARIABLES (TAB 1) ---
                      const realRetrievedChunksString = telemetryRRF.slice(0, 2).map((item: any, idx: number) => {
                        return `[Chunk-${idx}]: "${item.text.replace(/\s+/g, ' ').substring(0, 110)}..." (RRF Score: ${item.rrfScore})`;
                      }).join('\n\n');

                      const realRepoMapString = `📁 src/app/\n  📄 page.tsx (Core Dashboard - Score: 90)\n  📄 route.ts (Context API - Score: 85)\n📁 workspace/\n  📄 ${fileName} (Last Analyzed - Score: 95)\n    ↳ [FILE_SELECTOR] Rank #1 Candidate`;

                      setPromptVariables({
                        systemPrompt: lang === 'zh'
                          ? '你是一个强大的 AI 编程助理。你需要充分利用大地图上下文（Repo Map）与检索召回（RAG Chunks），给出高精准度的代码修改意见。'
                          : 'You are an advanced AI coding assistant. Fully leverage Repo Maps and RAG retrieved context chunks to output high-accuracy code modification plans.',
                        repoMap: realRepoMapString,
                        retrievedChunks: realRetrievedChunksString,
                        history: summaryText,
                        userQuery: telemetryQuery,
                      });
                    }
                  }
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: lang === 'zh' ? `⚠️ 执行运行时错误: ${err.message}` : `⚠️ Error executing runtime: ${err.message}`
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const t = i18n[lang];

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">

      {/* 1. SIDEBAR (260px) */}
      <Sidebar
        lang={lang}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tokenBudget={tokenBudget}
        astOutlineLength={astOutline.length}
        compressedSavings={compressedResult ? compressedResult.savingsPercent : null}
      />

      {/* 2. DUAL PANE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden min-w-0">

        {/* --- LEFT PANEL: INTERACTIVE AGENT CHAT (38%) --- */}
        <AgentChat
          lang={lang}
          messages={messages}
          chatInput={chatInput}
          setInput={setInput}
          chatLoading={chatLoading}
          reactSteps={reactSteps}
          handleChatSubmit={handleChatSubmit}
          chatEndRef={chatEndRef}
        />

        {/* --- RIGHT PANEL: VISUAL INSPECTOR (62%) --- */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* HEADER */}
          <header className="h-14 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 font-sans">
            <div className="flex items-center space-x-3">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h1 className="text-sm font-semibold text-slate-200">
                {activeTab === 'budget' && t.assembledPromptTitle}
                {activeTab === 'code' && t.tabRepoAST}
                {activeTab === 'rag' && t.tabRAG}
                {activeTab === 'advanced' && t.tabAdvanced}
              </h1>
              <span className="text-slate-700">|</span>
              <span className="text-xs text-slate-500">{t.visualInspector}</span>
            </div>

            {/* BILINGUAL LANGUAGE SELECTOR AND REFRESH */}
            <div className="flex items-center space-x-3 select-none">
              <button
                onClick={toggleLang}
                className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border border-slate-700 hover:border-cyan-500/50 hover:text-cyan-400 bg-slate-900 flex items-center space-x-1.5 cursor-pointer shadow"
              >
                <span>🌐</span>
                <span>{lang === 'zh' ? 'English' : '中文'}</span>
              </button>

              <button
                onClick={() => {
                  loadFiles();
                  handleChunkText();
                }}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title={t.refreshWorkspace}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* TAB DETAILED PANELS */}
          <div className="flex-1 overflow-y-auto bg-slate-950 p-6 min-h-0">
            {activeTab === 'budget' && (
              <TabPromptBudget
                lang={lang}
                tokenBudget={tokenBudget}
                setTokenBudget={setTokenBudget}
                systemWeight={systemWeight}
                setSystemWeight={setSystemWeight}
                repoMapWeight={repoMapWeight}
                setRepoMapWeight={setRepoMapWeight}
                ragWeight={ragWeight}
                setRagWeight={setRagWeight}
                historyWeight={historyWeight}
                setHistoryWeight={setHistoryWeight}
                systemTokens={systemTokens}
                repoMapTokens={repoMapTokens}
                ragTokens={ragTokens}
                historyTokens={historyTokens}
                remainingTokens={remainingTokens}
                promptVariables={promptVariables}
                setPromptVariables={setPromptVariables}
                compiledPrompt={compiledPrompt}
              />
            )}

            {activeTab === 'code' && (
              <TabRepoAST
                lang={lang}
                files={files}
                selectedFile={selectedFile}
                handleFileSelect={handleFileSelect}
                fileContent={fileContent}
                customCode={customCode}
                setCustomCode={setCustomCode}
                astOutline={astOutline}
                handleParseCustomCode={handleParseCustomCode}
                setSelectedFile={setSelectedFile}
              />
            )}

            {activeTab === 'rag' && (
              <TabRAG
                lang={lang}
                chunkText={chunkText}
                setChunkText={setChunkText}
                chunkSize={chunkSize}
                setChunkSize={setChunkSize}
                chunkOverlap={chunkOverlap}
                setChunkOverlap={setChunkOverlap}
                chunks={chunks}
                selectedChunkForMath={selectedChunkForMath}
                setSelectedChunkForMath={setSelectedChunkForMath}
                similarityResult={similarityResult}
                ragQuery={ragQuery}
                setRagQuery={setRagQuery}
                denseWeight={denseWeight}
                setDenseWeight={setDenseWeight}
                sparseWeight={sparseWeight}
                setSparseWeight={setSparseWeight}
                searchResults={searchResults}
              />
            )}

            {activeTab === 'advanced' && (
              <TabAdvanced
                lang={lang}
                compressText={compressText}
                setCompressText={setCompressText}
                compressionLevel={compressionLevel}
                setCompressionLevel={setCompressionLevel}
                compressedResult={compressedResult}
                summaryMemory={summaryMemory}
                isSummarizing={isSummarizing}
                handleGenerateSummaryMemory={handleGenerateSummaryMemory}
                ragQuery={ragQuery}
                rerankedChunks={rerankedChunks}
                hasReranked={hasReranked}
                setHasReranked={setHasReranked}
                setRerankedChunks={setRerankedChunks}
              />
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
