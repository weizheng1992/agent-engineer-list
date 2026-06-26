import { useState, useEffect, useRef } from 'react';

// Common interfaces
export interface FileItem {
  name: string;
  path: string;
  size: number;
  score: number;
  type: string;
}

export interface ASTItem {
  type: string;
  name: string;
  source?: string;
  params?: string;
  line: number;
}

export interface ChunkItem {
  id: string;
  text: string;
  start: number;
  end: number;
  size: number;
}

export interface HybridSearchResult {
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

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ReActStep {
  type: 'plan' | 'execute' | 'verify' | 'telemetry';
  message: string;
  timestamp: string;
}

// 1. Language preference Hook
export function useLanguage() {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');

  useEffect(() => {
    const savedLang = localStorage.getItem('context_eng_lang') as 'zh' | 'en';
    if (savedLang === 'zh' || savedLang === 'en') {
      setLang(savedLang);
    }
  }, []);

  const toggleLang = () => {
    const nextLang = lang === 'zh' ? 'en' : 'zh';
    setLang(nextLang);
    localStorage.setItem('context_eng_lang', nextLang);
  };

  return { lang, setLang, toggleLang };
}

// 2. Workspace Tree Mapping Hook
export function useWorkspaceFiles(setLoading: (val: boolean) => void, setChunkText: (val: string) => void) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [astOutline, setASTOutline] = useState<ASTItem[]>([]);
  const [customCode, setCustomCode] = useState<string>(
`import { NextResponse } from 'next/server';
import { db } from '@/db';

export interface User {
  id: string;
  name: string;
}

export async function POST(req: Request) {
  const { id } = await req.json();
  const user = await db.query.users.findFirst();
  return NextResponse.json({ success: true, user });
}`
  );

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/context-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list-files' }),
      });
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
        if (data.files.length > 0) {
          handleFileSelect(data.files[0].path);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (filePath: string) => {
    setSelectedFile(filePath);
    setLoading(true);
    try {
      const contentRes = await fetch('/api/context-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read-file', filePath }),
      });
      const contentData = await contentRes.json();
      if (contentData.success) {
        setFileContent(contentData.content);
        setChunkText(contentData.content); // Sync to RAG Tab

        const astRes = await fetch('/api/context-engine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'parse-ast', code: contentData.content }),
        });
        const astData = await astRes.json();
        if (astData.success) {
          setASTOutline(astData.outline);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleParseCustomCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/context-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'parse-ast', code: customCode }),
      });
      const data = await res.json();
      if (data.success) {
        setASTOutline(data.outline);
        setSelectedFile('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  return {
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
  };
}

// 3. RAG Sandbox & Similarity calculator Hook
export function useRAGPlayground(
  lang: 'zh' | 'en',
  messages: Message[],
  setLoading: (val: boolean) => void
) {
  const [chunkText, setChunkText] = useState<string>('');
  const [chunkSize, setChunkSize] = useState(250);
  const [chunkOverlap, setChunkOverlap] = useState(60);
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [ragQuery, setRagQuery] = useState('How to optimize context engineering?');
  const [denseWeight, setDenseWeight] = useState(0.5);
  const [sparseWeight, setSparseWeight] = useState(0.5);
  const [searchResults, setSearchResults] = useState<HybridSearchResult[]>([]);

  // Similarity Math States
  const [selectedChunkForMath, setSelectedChunkForMath] = useState<ChunkItem | null>(null);
  const [similarityResult, setSimilarityResult] = useState<{
    similarity: number;
    queryVecSample: number[];
    chunkVecVecSample: number[];
  } | null>(null);

  // Initialize placeholder text dynamically
  useEffect(() => {
    if (messages.length <= 1) {
      setChunkText(
        lang === 'zh'
          ? `Context Engineering (上下文工程) 是在 Agent 运行时中设计、优化和压缩发送给大语言模型（LLM）的信息的实践。

在现代 AI 应用中，上下文虽然是个金矿，但也是性能瓶颈。LLM 不仅按 Token 收费，而且在长上下文下响应会变慢。此外，模型还会受到“迷失在中间 (Lost in the middle)”现象的影响，即忽略放置在海量上下文中间的关键信息。

为了解决这一痛点，先进的上下文工程采用了多种技术：
1. AST 解析器：直接提取核心代码元素结构，而无需读取整个文件原文。
2. 语义或递归分块 (Chunking)：将长文本切割成高度聚焦的代码/文本分块。
3. 混合检索 (Hybrid Search)：结合向量和关键字搜索得分，并使用 RRF (倒数排名融合) 算法。
4. 二次重排 (Re-ranking) 模型：对检索出的分块重新评分，确保绝对的关联性。`
          : `Context Engineering is the practice of designing, optimizing, and compressing the information sent to Large Language Models inside Agent Runtimes.

In modern applications, context is a goldmine, but also a bottleneck. LLMs charge by the token and slow down with larger contexts. Moreover, models can suffer from the "lost in the middle" phenomenon, where they ignore critical information placed in the middle of a massive context.

To solve this, advanced context engineering uses multiple techniques:
1. AST Parsers extract core code elements without reading full files.
2. Semantic or Recursive chunking cuts long text into highly focused blocks.
3. Hybrid Search fuses Vector and Keyword search scores using Reciprocal Rank Fusion (RRF).
4. Re-ranking models scores the retrieved context a second time to ensure absolute relevance.`
      );
    }
  }, [lang, messages]);

  const handleChunkText = async () => {
    if (!chunkText) return;
    setLoading(true);
    try {
      const res = await fetch('/api/context-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chunk-text',
          text: chunkText,
          chunkSize,
          chunkOverlap,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChunks(data.chunks);
        if (data.chunks.length > 0) {
          setSelectedChunkForMath(data.chunks[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleHybridSearch = async () => {
    if (chunks.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/context-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'hybrid-search',
          query: ragQuery,
          chunks,
          denseWeight,
          sparseWeight,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateSimilarityMath = () => {
    if (!selectedChunkForMath || !ragQuery) return;

    const getVector = (text: string) => {
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
      }
      const vec: number[] = [];
      for (let d = 0; d < 128; d++) {
        const x = Math.sin(hash + d * 1024) * 10000;
        vec.push(x - Math.floor(x));
      }
      const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
      return vec.map(v => mag === 0 ? 0 : v / mag);
    };

    const qVec = getVector(ragQuery);
    const cVec = getVector(selectedChunkForMath.text);
    const dotProduct = qVec.reduce((sum, val, idx) => sum + val * cVec[idx], 0);
    const similarity = (dotProduct + 1) / 2;

    setSimilarityResult({
      similarity,
      queryVecSample: qVec.slice(0, 5),
      chunkVecVecSample: cVec.slice(0, 5),
    });
  };

  useEffect(() => {
    handleChunkText();
  }, [chunkText, chunkSize, chunkOverlap]);

  useEffect(() => {
    calculateSimilarityMath();
  }, [selectedChunkForMath, ragQuery]);

  useEffect(() => {
    if (chunks.length > 0) {
      handleHybridSearch();
    }
  }, [chunks, denseWeight, sparseWeight, ragQuery]);

  return {
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
    handleChunkText,
    handleHybridSearch
  };
}

// 4. Advanced Controls (Compression, Summary & Re-ranking) Hook
export function useAdvancedControls(
  lang: 'zh' | 'en',
  messages: Message[],
  chunks: ChunkItem[],
  setLoading: (val: boolean) => void
) {
  const [compressText, setCompressText] = useState<string>(
`[2026-06-26 14:02:11] SYSTEM: Initializing Agent Runtime Session...
[2026-06-26 14:02:12] INFO: Connecting to Local Model Gateway: http://127.0.0.1:11211
[2026-06-26 14:02:13] DEBUG: Loading schemas inside workspace dbs...
[2026-06-26 14:02:14] TRACE: Table 'sessions' loaded with columns: id (uuid), title (text), created_at (timestamp).
[2026-06-26 14:02:14] TRACE: Table 'messages' loaded with columns: id (uuid), session_id (uuid), role (text), content (text), steps (jsonb).
[2026-06-26 14:02:15] WARN: Redis not active, falling back to local memory cache.
[2026-06-26 14:02:16] USER_INPUT: "How does the sessions table schema work?"
[2026-06-26 14:02:17] THINK: Checking local filesystem for drizzle schema mapping.
[2026-06-26 14:02:18] TOOL_CALL: read_file({ path: "src/db/schema.ts" })
[2026-06-26 14:02:19] TOOL_RESPONSE: import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'; export const sessions = pgTable('sessions', { id: uuid('id').defaultRandom().primaryKey(), title: text('title').notNull() });`
  );
  const [compressionLevel, setCompressionLevel] = useState<'medium' | 'high'>('medium');
  const [compressedResult, setCompressedResult] = useState<{
    originalLength: number;
    compressedLength: number;
    savingsPercent: number;
    compressedText: string;
  } | null>(null);

  const [summaryMemory, setSummaryMemory] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [rerankedChunks, setRerankedChunks] = useState<Array<{
    id: string;
    text: string;
    rawScore: number;
    rerankScore: number;
    initialRank: number;
    finalRank: number;
  }>>([]);
  const [hasReranked, setHasReranked] = useState(false);

  // Sync placeholder summary
  useEffect(() => {
    if (messages.length <= 1) {
      setSummaryMemory(
        lang === 'zh'
          ? '用户查询了 Postgres 的 sessions 表的数据库定义结构。智能体执行了对 src/db/schema.ts 文件的读取，定位到该表由 id, title, created_at 三个字段组成，类型分属 UUID 与 text。'
          : 'The user queried about the Postgres sessions table schema. The agent read src/db/schema.ts, locating the sessions table columns (id, title, created_at).'
      );
    }
  }, [lang, messages]);

  // Sync placeholder chunks
  useEffect(() => {
    if (chunks.length === 0) {
      setRerankedChunks(
        lang === 'zh'
          ? [
              { id: '1', text: '文本相似度与余弦相似矩阵是通过 128 维确定性稠密浮点向量进行数学计算得出的。', rawScore: 0.89, rerankScore: 0.95, initialRank: 2, finalRank: 1 },
              { id: '2', text: 'Drizzle ORM 支持 PostgreSQL 的各种表结构配置，比如 pgTable、uuid、text 及 pgCore 字段。', rawScore: 0.92, rerankScore: 0.45, initialRank: 1, finalRank: 3 },
              { id: '3', text: 'AST (抽象语法树) 可以快速拆解并分析 TS/JS 的函数结构，提取入参名、返回类型以及依赖源。', rawScore: 0.74, rerankScore: 0.88, initialRank: 3, finalRank: 2 },
            ]
          : [
              { id: '1', text: 'Sentence similarity and cosine metrics are calculated using dense float vectors.', rawScore: 0.89, rerankScore: 0.95, initialRank: 2, finalRank: 1 },
              { id: '2', text: 'Drizzle ORM supports PostgreSQL table configurations like pgTable and pgCore.', rawScore: 0.92, rerankScore: 0.45, initialRank: 1, finalRank: 3 },
              { id: '3', text: 'AST (Abstract Syntax Tree) parses function structures to map parameters and names.', rawScore: 0.74, rerankScore: 0.88, initialRank: 3, finalRank: 2 },
            ]
      );
    }
  }, [lang, chunks]);

  const handleCompress = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/context-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compress',
          text: compressText,
          compressionLevel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCompressedResult({
          originalLength: data.originalLength,
          compressedLength: data.compressedLength,
          savingsPercent: data.savingsPercent,
          compressedText: data.compressedText,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummaryMemory = () => {
    setIsSummarizing(true);
    setTimeout(() => {
      setSummaryMemory(
        lang === 'zh'
          ? `滚动会话摘要更新：会话成功启动。Redis 连接中断但成功回退至本地内存。用户发起对 sessions 数据库表的结构查询。智能体成功对 src/db/schema.ts 执行了 AST 解析，获取到主键、标题及创建时间字段。`
          : `Evolving Summary Memory: Workspace initialized. System flagged Redis failure. User queried session schemas. Code agent parsed 'src/db/schema.ts', exposing columns: [id: uuid, title: text]. Core metadata successfully retrieved.`
      );
      setIsSummarizing(false);
    }, 1200);
  };

  useEffect(() => {
    handleCompress();
  }, [compressText, compressionLevel]);

  return {
    compressText,
    setCompressText,
    compressionLevel,
    setCompressionLevel,
    compressedResult,
    summaryMemory,
    setSummaryMemory,
    isSummarizing,
    setIsSummarizing,
    rerankedChunks,
    setRerankedChunks,
    hasReranked,
    setHasReranked,
    handleCompress,
    handleGenerateSummaryMemory
  };
}
export default useLanguage;
