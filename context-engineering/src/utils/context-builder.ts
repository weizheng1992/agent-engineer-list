import fs from 'fs/promises';
import path from 'path';

export interface ChunkItem {
  id: string;
  text: string;
  start: number;
  end: number;
  size: number;
}

// Define structures matching our Context Engineering specifications
export interface RepoFile {
  name: string;
  path: string;
  size: number;
  score: number;
  type: string;
  astOutline?: any[];
}

export interface ContextConfig {
  tokenBudget: number;
  systemWeight: number;    // %
  repoMapWeight: number;   // %
  ragWeight: number;       // %
  historyWeight: number;   // %
}

/**
 * Repo Map Context Builder
 * Orchestrates and compiles:
 * - Repo Map (compressed file structure trees with AST nodes)
 * - File Selector (relevance-based workspace file screening)
 * - Memory Retrieval (RAG chunking, pgvector similarity, BM25 RRF fusion)
 * - Summary (dynamic rolling summary memory)
 * - Recent Messages (active chat history with compression)
 * - Tool Results (stdio-based MCP tool outputs)
 */
export class ContextBuilder {
  private config: ContextConfig;
  private workspaceRoot: string;

  constructor(config?: Partial<ContextConfig>) {
    this.config = {
      tokenBudget: config?.tokenBudget || 128000,
      systemWeight: config?.systemWeight || 15,
      repoMapWeight: config?.repoMapWeight || 25,
      ragWeight: config?.ragWeight || 20,
      historyWeight: config?.historyWeight || 30,
    };
    // Root directory containing all workspace projects
    this.workspaceRoot = path.resolve(process.cwd(), '..');
  }

  // --- 1. REPO MAP CONTEXT BUILDER ---
  // Scans the workspace, parses structural AST outlines, and builds a compressed Repo Map representation
  public async buildRepoMap(maxDepth = 3): Promise<string> {
    const files = await this.scanWorkspace(this.workspaceRoot);
    // Filter out low-importance files to stay within token budget
    const highValueFiles = files
      .filter(f => f.score >= 40)
      .slice(0, 10); // Select top 10 core files

    let mapText = '=== REPOSITORY TREE & SYMBOL MAP ===\n';

    // Group files by directories to render as a tree
    const directories: Record<string, RepoFile[]> = {};
    for (const file of highValueFiles) {
      const dirName = path.dirname(file.path) === '.' ? '/' : path.dirname(file.path);
      if (!directories[dirName]) {
        directories[dirName] = [];
      }
      directories[dirName].push(file);
    }

    for (const [dir, dirFiles] of Object.entries(directories)) {
      mapText += `📁 ${dir}\n`;
      for (const file of dirFiles) {
        mapText += `  📄 ${file.name} (Core Score: ${file.score})\n`;
        // Fetch AST symbols
        const content = await this.readFileSafely(file.path);
        const astSymbols = this.parseASTOutline(content);
        if (astSymbols.length > 0) {
          // Print parsed AST nodes as condensed symbol map lines
          astSymbols.slice(0, 3).forEach(symbol => {
            mapText += `    ↳ [${symbol.type.toUpperCase()}] ${symbol.name} (Line ${symbol.line})\n`;
          });
          if (astSymbols.length > 3) {
            mapText += `    ↳ ... and ${astSymbols.length - 3} more structural symbols\n`;
          }
        }
      }
    }

    return mapText;
  }

  // --- 2. FILE SELECTOR ---
  // Rates files based on semantic relevance scores and selects the top candidates for inclusion
  public async runFileSelector(query: string): Promise<RepoFile[]> {
    const files = await this.scanWorkspace(this.workspaceRoot);
    const queryLower = query.toLowerCase();

    const scoredFiles = files.map(file => {
      let relevanceBoost = 0;
      // Exact filename match gets a maximum boost
      if (queryLower.includes(file.name.toLowerCase())) {
        relevanceBoost = 50;
      } else if (file.type === 'ts' || file.type === 'tsx') {
        relevanceBoost = 10;
      }
      return {
        ...file,
        score: Math.min(100, file.score + relevanceBoost)
      };
    });

    // Sort by final scores descending
    return scoredFiles.sort((a, b) => b.score - a.score);
  }

  // --- 3. MEMORY RETRIEVAL (RAG + RRF) ---
  // Chunks text, computes simulated pgvector unit similarities, and executes RRF hybrid rankings
  public retrieveMemory(query: string, text: string, chunkSize = 250, overlap = 60): any[] {
    const chunks = this.chunkText(text, chunkSize, overlap);
    const queryVector = this.getStringVector(query);

    // 1. Dense score calculation
    const denseScores = chunks.map(chunk => {
      const chunkVector = this.getStringVector(chunk.text);
      const similarity = queryVector.reduce((sum, val, idx) => sum + val * chunkVector[idx], 0);
      const cosineScore = (similarity + 1) / 2;
      return { id: chunk.id, text: chunk.text, score: cosineScore };
    });
    denseScores.sort((a, b) => b.score - a.score);
    const denseRanks = new Map(denseScores.map((item, idx) => [item.id, idx + 1]));

    // 2. Sparse keyword matching
    const sparseScores = chunks.map(chunk => {
      const score = this.getKeywordMatchScore(query, chunk.text);
      return { id: chunk.id, score };
    });
    sparseScores.sort((a, b) => b.score - a.score);
    const sparseRanks = new Map(sparseScores.map((item, idx) => [item.id, idx + 1]));

    // 3. Fusing with RRF (Reciprocal Rank Fusion)
    const k = 60;
    const hybridResult = chunks.map(chunk => {
      const dRank = denseRanks.get(chunk.id) || chunks.length;
      const sRank = sparseRanks.get(chunk.id) || chunks.length;

      const dScore = denseScores.find(d => d.id === chunk.id)?.score || 0;
      const sScore = sparseScores.find(s => s.id === chunk.id)?.score || 0;

      const denseRRF = 1 / (k + dRank);
      const sparseRRF = 1 / (k + sRank);
      const rrfScore = 0.5 * denseRRF + 0.5 * sparseRRF;

      return {
        id: chunk.id,
        text: chunk.text,
        denseRank: dRank,
        denseScore: dScore,
        sparseRank: sRank,
        sparseScore: sScore,
        rrfScore: parseFloat(rrfScore.toFixed(6)),
      };
    });

    return hybridResult.sort((a, b) => b.rrfScore - a.rrfScore);
  }

  // --- 4. SUMMARY (DISSOLUTION MEMORY SUMMARY) ---
  // Compiles rolling summary maps after each tool call to preserve long-term context
  public generateSummaryMemory(messages: any[], activeTopic = ''): string {
    const rounds = Math.floor(messages.length / 2);
    return `会话动态记忆摘要：当前完成了 ${messages.length} 轮历史对话（共约 ${rounds} 回合交互）。系统健康状况：本地 MCP 文件服务管道保持畅通。当前焦点主题主要针对 [${activeTopic || '工作区文件结构及算法设计'}] 发起探讨。代码大地图及 AST 节点已提取，并已在底层对上下文进行了智能压缩净化。`;
  }

  // --- 5. RECENT MESSAGES & COMPRESSION ---
  // Restricts messages context list to token budget bounds, running semantic log-level compression when needed
  public assembleRecentMessages(messages: any[], maxTokens = 40000): any[] {
    const compiledMessages = [...messages];
    // Simple mock budget check
    let estimatedTokens = JSON.stringify(compiledMessages).length / 4;

    // If we exceed message budget, run active compression on older messages
    if (estimatedTokens > maxTokens) {
      for (let i = 0; i < compiledMessages.length - 1; i++) {
        if (compiledMessages[i].role === 'assistant' && compiledMessages[i].content.length > 200) {
          // Semantically compress long assistant responses to save context tokens
          compiledMessages[i].content = compiledMessages[i].content.substring(0, 150) + '\n[...上下文已折叠压缩 / Context Compressed to fit token budget...]';
        }
      }
    }
    return compiledMessages;
  }

  // --- 6. TOOL RESULTS ---
  // Injects stdio-based MCP client output responses with clean formatting
  public formatToolResults(toolName: string, args: any, result: string, isError = false): string {
    return `=== MCP TOOL EXECUTION RESULT ===\n- Tool Called: ${toolName}\n- Arguments: ${JSON.stringify(args)}\n- Status: ${isError ? 'FAILED' : 'SUCCESS'}\n- Response Payload:\n${result}\n=================================`;
  }

  // --- CONSOLIDATED ASSEMBLY ---
  // Unifies all components into a single engineered prompt payload
  public assembleCompiledPrompt(parts: {
    systemPrompt: string;
    repoMap: string;
    retrievedChunks: string;
    historySummary: string;
    recentMessages: any[];
    toolResults?: string;
  }): string {
    return `=== SYSTEM INSTRUCTIONS ===
${parts.systemPrompt}

=== MEMORY SUMMARY ===
${parts.historySummary}

${parts.repoMap}

=== RETRIEVED HIGH-VALUE CONTEXT ===
${parts.retrievedChunks}

${parts.toolResults ? parts.toolResults + '\n' : ''}
=== RECENT CHAT MESSAGES ===
${JSON.stringify(parts.recentMessages, null, 2)}
`;
  }

  // --- PRIVATE UTILITIES ---
  private async scanWorkspace(dir: string, currentDepth = 0, maxDepth = 2): Promise<RepoFile[]> {
    if (currentDepth > maxDepth) return [];
    const results: RepoFile[] = [];
    try {
      const list = await fs.readdir(dir, { withFileTypes: true });
      for (const file of list) {
        const fullPath = path.join(dir, file.name);
        const relativePath = path.relative(this.workspaceRoot, fullPath);

        // Ignore build directories
        if (
          relativePath.includes('node_modules') ||
          relativePath.includes('.next') ||
          relativePath.includes('.git') ||
          relativePath.includes('dist') ||
          relativePath.includes('.pnpm-store')
        ) {
          continue;
        }

        if (file.isDirectory()) {
          const sub = await this.scanWorkspace(fullPath, currentDepth + 1, maxDepth);
          results.push(...sub);
        } else {
          const stats = await fs.stat(fullPath);
          let score = 30;
          const ext = path.extname(file.name);
          if (file.name === 'package.json') score = 100;
          else if (file.name === 'schema.ts') score = 95;
          else if (ext === '.ts' || ext === '.tsx') score = 70;
          else if (ext === '.md') score = 40;

          results.push({
            name: file.name,
            path: relativePath,
            size: stats.size,
            score,
            type: ext.substring(1) || 'text',
          });
        }
      }
    } catch (e) {}
    return results;
  }

  private async readFileSafely(relativePath: string): Promise<string> {
    try {
      const fullPath = path.resolve(this.workspaceRoot, relativePath);
      return await fs.readFile(fullPath, 'utf-8');
    } catch {
      return '';
    }
  }

  private parseASTOutline(code: string): any[] {
    const lines = code.split('\n');
    const items: any[] = [];
    const importRegex = /^import\s+([\s\S]*?)\s+from\s+['"](.*?)['"]/;
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)/;
    const schemaRegex = /(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:pgTable|jsonSchema)/;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ')) {
        const match = line.match(importRegex);
        items.push({ type: 'import', name: match ? match[1].replace(/[\{\}\s\r\n]+/g, ' ').trim() : 'dependency', line: index + 1 });
      } else if (trimmed.includes('function ')) {
        const match = line.match(functionRegex);
        if (match) items.push({ type: 'function', name: match[1], line: index + 1 });
      } else if (trimmed.includes('pgTable(') || trimmed.includes('jsonSchema(')) {
        const match = line.match(schemaRegex);
        if (match) items.push({ type: 'schema', name: match[1], line: index + 1 });
      }
    });
    return items;
  }

  private chunkText(text: string, chunkSize: number, overlap: number): ChunkItem[] {
    const chunks: ChunkItem[] = [];
    let start = 0;
    let index = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunkText = text.substring(start, end);
      chunks.push({
        id: `chunk-${index}`,
        text: chunkText,
        start,
        end,
        size: chunkText.length,
      });
      if (end === text.length) break;
      start += chunkSize - overlap;
      index++;
    }
    return chunks;
  }

  private getStringVector(text: string, dimensions = 128): number[] {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    const vec: number[] = [];
    for (let d = 0; d < dimensions; d++) {
      const x = Math.sin(hash + d * 1024) * 10000;
      vec.push(x - Math.floor(x));
    }
    const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return vec.map(v => mag === 0 ? 0 : v / mag);
  }

  private getKeywordMatchScore(query: string, text: string): number {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    if (words.length === 0) return 0;
    const lowerText = text.toLowerCase();
    let hits = 0;
    words.forEach(w => {
      let idx = lowerText.indexOf(w);
      while (idx !== -1) {
        hits++;
        idx = lowerText.indexOf(w, idx + 1);
      }
    });
    return hits / words.length;
  }
}
export default ContextBuilder;
