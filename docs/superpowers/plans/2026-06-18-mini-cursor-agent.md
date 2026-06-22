# Mini Cursor Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Mini Cursor Agent that implements a ReAct (Plan -> Execute -> Verify) loop using standard MCP and displays streaming logs/steps on a React 19 UI.

**Architecture:** Embedded Next.js application acting as an MCP Client communicating with an embedded MCP Server via local stdio channels, integrated with Vercel AI SDK 6 for streaming, and Drizzle ORM + Postgres/Redis for state tracking.

**Tech Stack:** Next.js, React 19, TypeScript, Vercel AI SDK 6, Drizzle ORM, Postgres, Redis, Tailwind CSS, Playwright, Bun.

---

### Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `mini-cursor-agent/package.json`
- Create: `mini-cursor-agent/tsconfig.json`
- Create: `mini-cursor-agent/tailwind.config.ts`
- Create: `mini-cursor-agent/postcss.config.mjs`
- Create: `mini-cursor-agent/src/app/globals.css`
- Test: Verify project builds with `bun run build`

- [ ] **Step 1: Write `package.json`**
Configure package.json with React 19, Next.js, Vercel AI SDK 6, Drizzle, and Lucide React.
```json
{
  "name": "mini-cursor-agent",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "ai": "^4.0.0",
    "@ai-sdk/openai": "^1.0.0",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "drizzle-orm": "^0.38.0",
    "postgres": "^3.4.0",
    "ioredis": "^5.4.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0-alpha",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "drizzle-kit": "^0.30.0",
    "@playwright/test": "^1.49.0"
  }
}
```

- [ ] **Step 2: Create Tailwind config & Globals CSS**
Write a standard Globals CSS and PostCSS config to support Tailwind.

- [ ] **Step 3: Run installation & Verify build**
Run: `bun install`
Expected: Installation completes.

---

### Task 2: Database Schema & Drizzle Setup

**Files:**
- Create: `mini-cursor-agent/src/db/schema.ts`
- Create: `mini-cursor-agent/src/db/index.ts`
- Create: `mini-cursor-agent/drizzle.config.ts`

- [ ] **Step 1: Write Drizzle database schema**
Define `sessions` and `messages` tables storing conversation history and ReAct steps.
```typescript
import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  steps: jsonb('steps').$type<Array<{
    type: 'plan' | 'execute' | 'verify';
    message: string;
    details?: any;
    timestamp: string;
  }>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

- [ ] **Step 2: Initialize Drizzle connection**
Write connection using `postgres` client and read from `POSTGRES_URL`.

- [ ] **Step 3: Run migration**
Run: `bunx drizzle-kit push`
Expected: Database schemas are successfully synced to PostgreSQL.

---

### Task 3: MCP Server & Client stdio Integration

**Files:**
- Create: `mini-cursor-agent/src/mcp/server.ts`
- Create: `mini-cursor-agent/src/mcp/client.ts`
- Test: Write unit test to verify MCP Server-Client communication over stdio.

- [ ] **Step 1: Implement local MCP Server**
Implement an MCP Server using `@modelcontextprotocol/sdk` exposing a standard `read_file` tool.
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from 'node:fs/promises';

const server = new Server({ name: "mini-cursor-fs-server", version: "1.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "read_file",
    description: "Read the content of a file in the workspace",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"]
    }
  }]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "read_file") {
    const filePath = request.params.arguments?.path as string;
    const content = await fs.readFile(filePath, 'utf-8');
    return { content: [{ type: "text", text: content }] };
  }
  throw new Error("Tool not found");
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 2: Implement MCP Client**
Build the client that spawns the server as a child process and communicates via stdio transport.

---

### Task 4: ReAct Loop & AI SDK Tool Routing

**Files:**
- Create: `mini-cursor-agent/src/app/api/chat/route.ts`

- [ ] **Step 1: Write `/api/chat` router**
Use Vercel AI SDK `streamText` to call OpenAI API, capture the intermediate tools execution steps, and stream them along with the main assistant response.
```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    tools: {
      read_file: {
        description: 'Read the contents of a file',
        parameters: z.object({ path: z.string() }),
        execute: async ({ path }) => {
          // 1. Plan step is emitted
          // 2. Execute step via MCP Client -> MCP Server
          // 3. Verify step is emitted
        }
      }
    }
  });
  return result.toDataStreamResponse();
}
```

---

### Task 5: Dual-pane UI Layout & Streaming

**Files:**
- Create: `mini-cursor-agent/src/app/page.tsx`
- Create: `mini-cursor-agent/src/app/layout.tsx`

- [ ] **Step 1: Write chat UI layout**
Create a dual-pane layout:
- Left pane: Message area + Streaming answer markdown.
- Right pane: Active ReAct Steps timeline (Plan -> Execute -> Verify).

---

### Task 6: E2E Playwright Verification

**Files:**
- Create: `mini-cursor-agent/tests/agent-flow.spec.ts`

- [ ] **Step 1: Write Playwright E2E test**
Simulate typing "帮我分析项目里面的 package.json" and verify the right panel renders the Plan, Execute (read_file), and Verify steps.
