import { streamText, jsonSchema } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { executeLocalMcpTool } from '@/mcp/client';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const targetBaseURL = process.env.AI_BASE_URL || 'http://127.0.0.1:11211/api/openai/v1';
  const targetModel = process.env.AI_MODEL || 'company/gemini-3.1-pro-preview:latest';
  console.log("=== API CHAT ROUTE RECEIVED REQUEST ===");
  console.log(`- Target OpenAI Base URL: ${targetBaseURL}`);
  console.log(`- Target Model: ${targetModel}`);

  // Create an in-memory queue to hold intermediate ReAct logs
  const logsQueue: Array<{ type: 'plan' | 'execute' | 'verify'; message: string; timestamp: string }> = [];
  
  const pushLog = (type: 'plan' | 'execute' | 'verify', message: string) => {
    logsQueue.push({
      type,
      message,
      timestamp: new Date().toISOString()
    });
  };

  // Find the last user message to detect explicit file/path intent
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const lowercaseMsg = lastUserMessage.toLowerCase().trim();

  // Detect if user explicitly mentions a file name (e.g. package.json, test.ts, .css, .env)
  // or explicitly uses file-system trigger keywords
  const fileRegex = /\w+\.[a-zA-Z0-9]+/;
  const hasFileMention = fileRegex.test(lowercaseMsg) || 
                         lowercaseMsg.includes('.env') ||
                         lowercaseMsg.includes('.git') ||
                         lowercaseMsg.includes('文件') || 
                         lowercaseMsg.includes('文件夹') || 
                         lowercaseMsg.includes('目录') || 
                         lowercaseMsg.includes('路径') || 
                         lowercaseMsg.includes('workspace') || 
                         lowercaseMsg.includes('/') ||
                         lowercaseMsg.includes('read_file') ||
                         lowercaseMsg.includes('write_file') ||
                         lowercaseMsg.includes('项目') ||
                         lowercaseMsg.includes('工程') ||
                         lowercaseMsg.includes('代码') ||
                         lowercaseMsg.includes('依赖') ||
                         lowercaseMsg.includes('结构') ||
                         lowercaseMsg.includes('配置');

  console.log("DEBUG DETECTION:", {
    lastUserMessage,
    hasFileMention,
    lowercaseMsg,
    fileRegexMatch: fileRegex.test(lowercaseMsg)
  });

  // Strict routing: ONLY define the tools block if there is a clear request to read/write/modify a file object.
  // This physically strips the "tools" field from the JSON payload when the user is chatting, preventing 
  // any buggy custom local proxy gateways from forcing tool execution.
  const useTools = hasFileMention;

  // Revert back to standard built-in OpenAI provider, which is 100% compatible with /responses on genai-bridge
  const customOpenai = createOpenAI({
    baseURL: process.env.AI_BASE_URL || 'http://127.0.0.1:11211/api/openai/v1',
    apiKey: process.env.AI_API_KEY || 'dummy',
    compatibility: 'compatible'
  } as any);

  // Read configurable model name from your .env configuration
  const modelName = process.env.AI_MODEL || 'company/gemini-3.1-pro-preview:latest';

  // Configure tools dictionary conditionally using robust jsonSchema (independent of Zod version prototype issues)
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
        pushLog('plan', `Plan: Read file "${path}" to analyze its configuration/dependencies.`);
        pushLog('execute', `Execute: Calling MCP tool "read_file" with arguments: { path: "&quot;${path}&quot;" }`);

        try {
          const mcpResult = await executeLocalMcpTool('read_file', { path }) as any;
          const fileContent = mcpResult.content?.[0]?.text || '';
          const isError = mcpResult.isError || false;

          if (isError) {
            pushLog('verify', `Verify: Failed to read file. Details: ${fileContent}`);
            return `Error: ${fileContent}`;
          }

          pushLog('verify', `Verify: Successfully read file "${path}". Retrieved ${fileContent.length} characters.`);
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
        pushLog('plan', `Plan: Write generated/updated content into file "${path}".`);
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

  // A unified, single static system prompt to prevent backend caching or gateway 500 errors.
  // It removes biased few-shot examples and strictly tells the model not to simulate tool calls if none were executed.
  const systemPrompt = `You are Mini Cursor Agent, a highly capable software engineering assistant.
You have access to local filesystem tools through the Model Context Protocol (MCP) to help explore, read, or modify files in the workspace (when tools are provided).

=== TOOL CALLING & CONVERSATION RULES ===
1. CASUAL CONVERSATION & GREETINGS:
   - If the user greets you (e.g., "你好", "hello", "hi"), asks who you are (e.g., "你是", "你是谁", "who are you"), or engages in general small talk, answer directly using plain text.
   - DO NOT call any tool under these circumstances. Do not read package.json or any workspace files. Simply introduce yourself directly as Mini Cursor Agent.

2. WORKSPACE & FILE OPERATIONS:
   - ONLY call tools when the user's prompt explicitly requires interacting with actual files, code, or structure in the local workspace (e.g., "分析 package.json", "查看当前项目结构", "查看 src/app/page.tsx", "把以下代码写入 test.js").
   - If no specific workspace file operation, local project analysis, or local code modification is requested, reply directly using plain text. Do not invoke or simulate any tools.

=== ReAct Pattern ===
Whenever you decide to use a tool, follow the ReAct pattern:
1. PLAN: Explain why you need to call the tool and what you expect to achieve.
2. EXECUTE: Call the tool with precise arguments.
3. VERIFY: Analyze the output of the tool to verify success before making further plans or outputting your final response.

=== RESPONSE RULE ===
If you called any MCP tools in this turn, you must briefly state which tools you called and their parameters at the end of your response. If you did not call any tools, DO NOT mention or simulate any tool calls.`;

  // Initiate streamText with standard responses endpoint.
  const result = streamText({
    model: customOpenai(modelName),
    messages,
    maxSteps: useTools ? 5 : undefined, // Only use multi-step loop if tools are loaded
    tools: chatTools as any, // This is physically undefined when useTools is false!
    system: systemPrompt,
  });

  // Create a customized stream that yields both our custom ReAct logs and standard text chunks in a non-blocking way
  const customStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Flush any logs currently waiting in the logsQueue
      const flushLogs = () => {
        while (logsQueue.length > 0) {
          const log = logsQueue.shift();
          controller.enqueue(encoder.encode(`2:${JSON.stringify(log)}\n`));
        }
      };

      try {
        // Read chunks from fullStream to perfectly drive the multi-step tool execution loop
        for await (const part of result.fullStream) {
          // Flush any logs (like tool execution states) queued before yielding text chunks
          flushLogs();

          if (part.type === 'text-delta') {
            console.log("- Stream Chunk:", JSON.stringify(part.textDelta));
            controller.enqueue(encoder.encode(`0:${JSON.stringify(part.textDelta)}\n`));
          }
        }

        // Final flush of trailing logs
        flushLogs();
        controller.close();
      } catch (err: any) {
        console.error("STREAM ERROR IN API ROUTE:", err);
        controller.error(err);
      }
    }
  });

  // Return custom stream response
  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
