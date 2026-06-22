# Mini Cursor Agent Design Specification

## 1. Overview
Mini Cursor Agent is a web-based coding assistant interface mimicking the core behavior of modern agent systems like Claude Code or Cursor. It implements a fully trace-able **ReAct** (Reasoning and Action) loop consisting of **Plan → Execute → Verify** stages, driven by standard Model Context Protocol (MCP) integrations.

- **Frontend**: Next.js 16, React 19, Tailwind CSS.
- **Backend/Runtime**: Node.js, Vercel AI SDK 6, PostgreSQL (Drizzle ORM), Redis.
- **Protocol**: Model Context Protocol (MCP) for tools.
- **Environment**: Bun runtime.

---

## 2. System Architecture

### Embedded Single-Process Architecture
We adopt an embedded architecture where the Next.js API server acts as both the MCP Client and runs the MCP Server in-process or as a local stdio child process.

```
[User UI] <---> [Next.js API Routes] <---> [ReAct Agent Runtime]
                                                  |
                                                  v
                                            [MCP Client]
                                                  | (stdio)
                                                  v
                                           [Local MCP Server]
                                            (filesystem tools)
```

---

## 3. Database Schema
We store both conversation history and high-fidelity step-by-step logs for the ReAct loop to render on the frontend.

```typescript
// schema.ts
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

---

## 4. UI Design
The UI features a high-productivity split-pane workspace layout:

- **Left Pane (60%)**: AI Chat Interface
  - Session navigation sidebar.
  - Streaming Markdown responses with code syntax highlighting.
  - User prompt input field.
- **Right Pane (40%)**: Agent Telemetry Panel
  - Active status bar (Idle, Thinking, Executing, Verifying).
  - Chronological tree of ReAct Steps:
    - 🔍 **Plan**: The reasoning step explaining *what* the agent decided to do and *why*.
    - 🛠️ **Execute**: Visual representation of tool execution (MCP call) with inputs/outputs.
    - ✅ **Verify**: Self-verification feedback ensuring the action succeeded.
  - Live console logs streaming raw JSON-RPC traffic.

---

## 5. Development Plan
1. **Scaffold Next.js 16 + React 19 Project** under `mini-cursor-agent`.
2. **Database Setup**: Configure Drizzle ORM, PostgreSQL connection, and migration scripts.
3. **MCP Infrastructure**: Build standard stdio-based MCP Server and Node.js MCP Client.
4. **ReAct Loop Implementation**: Set up Vercel AI SDK 6, custom tool routing, and Step tracking.
5. **UI & Streaming**: Build the split-pane Tailwind interface, streaming ReAct steps via Server-Sent Events (SSE).
6. **E2E & Verification**: Add Playwright test to verify standard flow (e.g., analyzing a file).
