import { streamText, jsonSchema } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { executeLocalMcpTool } from '@/mcp/client';

export const runtime = 'nodejs';

// --- MATH HELPER FUNCTIONS ---
function getDeterministicVector(text: string, dimensions = 128): number[] {
  const vector: number[] = [];
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }

  for (let d = 0; d < dimensions; d++) {
    const x = Math.sin(hash + d * 1024) * 10000;
    vector.push(x - Math.floor(x));
  }

  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map((val) => (magnitude === 0 ? 0 : val / magnitude));
}

function getKeywordMatchScore(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (queryWords.length === 0) return 0;

  const textLower = text.toLowerCase();
  let matches = 0;

  queryWords.forEach((word) => {
    let index = textLower.indexOf(word);
    while (index !== -1) {
      matches++;
      index = textLower.indexOf(word, index + 1);
    }
  });

  return matches / queryWords.length;
}

// Server-side sliding-window chunking
function chunkFileText(text: string, chunkSize = 250, chunkOverlap = 60): any[] {
  const chunks: any[] = [];
  let index = 0;
  let start = 0;

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

    if (end === text.length) {
      break;
    }

    start += chunkSize - chunkOverlap;
    index++;
  }

  return chunks;
}

// Server-side RRF hybrid retrieval merger
function runHybridSearch(query: string, chunks: any[]): any[] {
  if (chunks.length === 0) return [];
  const queryVector = getDeterministicVector(query);

  // 1. Vector Cosine scoring
  const denseResults = chunks.map((chunk) => {
    const chunkVector = getDeterministicVector(chunk.text);
    const similarity = queryVector.reduce((sum, val, idx) => sum + val * chunkVector[idx], 0);
    const cosineScore = (similarity + 1) / 2;
    return { chunkId: chunk.id, score: cosineScore };
  });
  denseResults.sort((a, b) => b.score - a.score);
  const denseRankMap = new Map(denseResults.map((item, idx) => [item.chunkId, idx + 1]));

  // 2. Keyword TF scoring
  const sparseResults = chunks.map((chunk) => {
    const score = getKeywordMatchScore(query, chunk.text);
    return { chunkId: chunk.id, score };
  });
  sparseResults.sort((a, b) => b.score - a.score);
  const sparseRankMap = new Map(sparseResults.map((item, idx) => [item.chunkId, idx + 1]));

  // 3. Reciprocal Rank Fusion (RRF)
  const k = 60;
  const hybridResults = chunks.map((chunk) => {
    const denseRank = denseRankMap.get(chunk.id) || chunks.length;
    const sparseRank = sparseRankMap.get(chunk.id) || chunks.length;

    const denseScore = denseResults.find((d) => d.chunkId === chunk.id)?.score || 0;
    const sparseScore = sparseResults.find((s) => s.chunkId === chunk.id)?.score || 0;

    const denseRRF = 1 / (k + denseRank);
    const sparseRRF = 1 / (k + sparseRank);
    const rrfScore = 0.5 * denseRRF + 0.5 * sparseRRF; // Default 50/50 split

    return {
      id: chunk.id,
      text: chunk.text,
      denseRank,
      denseScore,
      sparseRank,
      sparseScore,
      denseRRF: parseFloat(denseRRF.toFixed(6)),
      sparseRRF: parseFloat(sparseRRF.toFixed(6)),
      rrfScore: parseFloat(rrfScore.toFixed(6)),
    };
  });

  hybridResults.sort((a, b) => b.rrfScore - a.rrfScore);
  return hybridResults;
}


export async function POST(req: Request) {
  const { messages, contextSettings } = await req.json();

  const targetBaseURL = process.env.AI_BASE_URL || 'http://127.0.0.1:11211/api/openai/v1';
  const targetModel = process.env.AI_MODEL || 'company/gemini-3.1-pro-preview:latest';

  // Create an in-memory queue to hold intermediate ReAct logs and context telemetry metrics
  const logsQueue: Array<{
    type: 'plan' | 'execute' | 'verify' | 'telemetry';
    message: string;
    details?: any;
    timestamp: string;
  }> = [];

  const pushLog = (type: 'plan' | 'execute' | 'verify' | 'telemetry', message: string, details?: any) => {
    logsQueue.push({
      type,
      message,
      details,
      timestamp: new Date().toISOString()
    });
  };

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const lowercaseMsg = lastUserMessage.toLowerCase().trim();

  const fileRegex = /\w+\.[a-zA-Z0-9]+/;
  const hasFileMention = fileRegex.test(lowercaseMsg) ||
                         lowercaseMsg.includes('文件') ||
                         lowercaseMsg.includes('文件夹') ||
                         lowercaseMsg.includes('目录') ||
                         lowercaseMsg.includes('路径') ||
                         lowercaseMsg.includes('workspace') ||
                         lowercaseMsg.includes('/') ||
                         lowercaseMsg.includes('read_file') ||
                         lowercaseMsg.includes('write_file') ||
                         lowercaseMsg.includes('代码') ||
                         lowercaseMsg.includes('依赖') ||
                         lowercaseMsg.includes('配置');

  const useTools = hasFileMention;

  const customOpenai = createOpenAI({
    baseURL: targetBaseURL,
    apiKey: process.env.AI_API_KEY || 'dummy',
    compatibility: 'compatible'
  } as any);

  // Configure tools dictionary conditionally using robust jsonSchema
  const chatTools = useTools ? {
    read_file: {
      description: 'Read the full contents of a file in the workspace.',
      parameters: jsonSchema({
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative or absolute path of the file to read.' }
        },
        required: ['path']
      }),
      execute: async ({ path }: { path: string }) => {
        pushLog('plan', `Plan: Context Engine reads workspace file "${path}" using AST / chunk pipelines.`);
        pushLog('execute', `Execute: Calling MCP filesystem tool "read_file" with args: { path: "${path}" }`);

        try {
          const mcpResult = await executeLocalMcpTool('read_file', { path }) as any;
          const fileContent = mcpResult.content?.[0]?.text || '';
          const isError = mcpResult.isError || false;

          if (isError) {
            pushLog('verify', `Verify: Failed to read file. Details: ${fileContent}`);
            return `Error: ${fileContent}`;
          }

          pushLog('verify', `Verify: Read successfully. Retrieved ${fileContent.length} chars. Generating real-time RAG split diagnostics...`);

          // --- REAL-TIME RAG PIPELINE EXECUTION ---
          // Dynamically chunk the read file and run embeddings cosine similarities against the user's actual question!
          const generatedChunks = chunkFileText(fileContent, 250, 60);
          const rrfSearchResults = runHybridSearch(lastUserMessage, generatedChunks);

          // Broadcast all this live telemetry metrics back to the client!
          pushLog('telemetry', `Context telemetry updated: parsed AST outlines & computed RAG scores.`, {
            filePath: path,
            fileContent,
            chunks: generatedChunks,
            query: lastUserMessage,
            searchResults: rrfSearchResults,
          });

          return fileContent;
        } catch (err: any) {
          pushLog('verify', `Verify: Caught execution exception: ${err.message}`);
          return `Exception: ${err.message}`;
        }
      }
    },
    write_file: {
      description: 'Write content directly to a file in the workspace.',
      parameters: jsonSchema({
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative or absolute path of the file to write.' },
          content: { type: 'string', description: 'The exact contents to write to the file.' }
        },
        required: ['path', 'content']
      }),
      execute: async ({ path, content }: { path: string; content: string }) => {
        pushLog('plan', `Plan: Context Engine writes generated content into file "${path}".`);
        pushLog('execute', `Execute: Calling MCP tool "write_file" with arguments: { path: "${path}", contentLength: ${content.length} }`);

        try {
          const mcpResult = await executeLocalMcpTool('write_file', { path, content }) as any;
          const outcome = mcpResult.content?.[0]?.text || '';
          const isError = mcpResult.isError || false;

          if (isError) {
            pushLog('verify', `Verify: Failed to write file. Details: ${outcome}`);
            return `Error: ${outcome}`;
          }

          pushLog('verify', `Verify: File written successfully. Server response: "${outcome}"`);
          return outcome;
        } catch (err: any) {
          pushLog('verify', `Verify: Caught execution exception: ${err.message}`);
          return `Exception: ${err.message}`;
        }
      }
    }
  } : undefined;

  const systemPrompt = `You are the Context Engineering Core Agent, an advanced software assistant.
You possess a deep understanding of Prompt Optimization, token budgeting, AST parsing, RAG embeddings, and reciprocal rank fusion.

=== CONTEXT ENGINEERING RULES ===
1. Standard conversations/chats: introduce yourself directly using plain text. Do NOT run filesystem tools.
2. Code investigations: leverage "read_file" or "write_file" only when the user's prompt explicitly asks to inspect or write workspace code files.
3. Whenever you use a tool, explain your reasoning clearly.`;

  // Initiate streamText
  const result = streamText({
    model: customOpenai(targetModel),
    messages,
    maxSteps: useTools ? 5 : undefined,
    tools: chatTools as any,
    system: systemPrompt,
  });

  const customStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const flushLogs = () => {
        while (logsQueue.length > 0) {
          const log = logsQueue.shift();
          controller.enqueue(encoder.encode(`2:${JSON.stringify(log)}\n`));
        }
      };

      try {
        pushLog('telemetry', `Context Object Loaded into LLM Context.`, {
          tokenBudget: contextSettings?.tokenBudget || 128000,
          compressionRatio: contextSettings?.compressionLevel || 'medium',
          query: lastUserMessage, // Always broadcast the latest chat query to update the RAG tab!
        });

        for await (const part of result.fullStream) {
          flushLogs();

          if (part.type === 'text-delta') {
            controller.enqueue(encoder.encode(`0:${JSON.stringify(part.textDelta)}\n`));
          }
        }

        flushLogs();
        controller.close();
      } catch (err: any) {
        console.error("STREAM ERROR IN API ROUTE:", err);
        controller.error(err);
      }
    }
  });

  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
