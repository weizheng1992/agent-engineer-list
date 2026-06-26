# Mini Cursor Agent (Workspace Analyzer) 💻🔍

[English](#english) | [中文](#中文)

---

## English

An embedded Next.js 15 + React 19 application representing a modern **AI Software Engineering Agent (Workspace Analyzer)**. It implements an autonomous **ReAct (Plan ➔ Execute ↳ Verify) Loop** running on top of the Model Context Protocol (MCP) using local `stdio` channels.

### 🌟 Key Features
- **ReAct Loop Execution Tracing**: Real-time display of the agent's Planning, Executing (tool calls), and Verifying (outcome inspection) loops.
- **Embedded MCP Server & Client**: Communicates via standard `stdio` std-pipes, executing secure workspace operations (e.g., `read_file`, `write_file`).
- **Postgres Session History**: Stores conversations and telemetry traces persistently using **Drizzle ORM** & **Postgres**.
- **SSE Stream Multiplexing**: Splits AI text-deltas (`0:...`) and ReAct runtime tool execution payloads (`8:...` / `2:...`) over a single server-sent event (SSE) stream.
- **Bi-directional Integration**: Direct links to jump to the `Context Engineering` dashboard on port `3002`.

### 🛠️ Tech Stack
- **Framework**: Next.js 15.1.0 + React 19 + TypeScript
- **Agent Platform**: Vercel AI SDK 6 (`ai`, `@ai-sdk/openai`)
- **Protocol**: Model Context Protocol (MCP) SDK
- **Database**: Drizzle ORM + PostgreSQL (`postgres` client)
- **Styling**: Tailwind CSS + Lucide React icons
- **Package Manager / Runtime**: Bun 1.3+

---

## 中文

本项目是一个基于 Next.js 15 和 React 19 开发的现代 **AI 软件工程智能体 (Workspace Analyzer)**。它在大语言模型与本地工作区之间架起桥梁，通过标准的 Model Context Protocol (MCP) `stdio` 本地管道，实现全自动的 **ReAct (Plan 规划 ➔ Execute 执行 ↳ Verify 验证) 自循环推理和文件操作**。

### 🌟 核心功能
- **ReAct 自推理循环跟踪**：直观、精美地呈现智能体在接收任务后的“规划、调用本地工具执行、校验执行结果并调整方案”的思维风暴全过程。
- **内嵌 MCP 客户端与服务端通信**：使用 stdio 标准输入输出进程管道，执行安全的工作区文件读取（`read_file`）与文件写入（`write_file`）动作。
- **Postgres 状态持久化**：使用 **Drizzle ORM** 和 **PostgreSQL**，持久化存储用户对话、ReAct 步长日志以及运行时遥测数据。
- **SSE 日志流复用器**：独创将大模型 AI 文本 Delta 流（标记为 `0:`）与 ReAct 内部运行时 RPC 包（标记为 `2:` / `8:`）打包复用在单条 SSE (Server-Sent Events) 长连接流中，保障前端极速响应。
- **双向应用集成**：内置直接跨端口跳转体验 `3002` 端口的 `Context Engineering` (上下文工程) 面板。

### 🛠️ 技术栈
- **全栈框架**：Next.js 15.1.0 + React 19 + TypeScript
- **智能体开发**：Vercel AI SDK 6 (`ai`, `@ai-sdk/openai`)
- **通讯协议**：Model Context Protocol (MCP) SDK
- **数据库技术**：Drizzle ORM + PostgreSQL (`postgres` 驱动)
- **界面样式**：Tailwind CSS + Lucide React 响应式图标
- **包管理与运行**：Bun 1.3+

---

## 🚀 Quick Start / 快速启动

### 1. Configure Environment Variables / 配置环境变量
Create a `.env` file in the project root:
在项目根目录创建并配置 `.env` 文件：
```env
# Drizzle Database configuration
POSTGRES_URL=postgres://postgres:postgres@localhost:5432/mini_cursor_agent

# Model Gateway credentials
AI_BASE_URL=http://127.0.0.1:11211/api/openai/v1
AI_API_KEY=dummy
AI_MODEL=gemini-3.1-pro-preview:latest # or llama3, qwen2.5 etc.
```

### 2. Install Dependencies / 安装依赖
Make sure you have **Bun** installed globally.
确保您已安装 **Bun**。
```bash
bun install
```

### 3. Run Development Server / 启动服务
Start the app on port `3001`:
在端口 `3001` 上启动本地开发：
```bash
bun dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser.
在浏览器访问 [http://localhost:3001](http://localhost:3001)。

---

## 📁 Codebase Architecture / 目录架构

- `src/app/page.tsx`: Core Workspace Analyzer client-side chat interface.
- `src/app/api/chat/route.ts`: Streaming API router orchestrating ReAct loop logs and MCP tool calling.
- `src/mcp/server.ts`: Embedded stdio MCP Server exposing `read_file` and `write_file` tools.
- `src/mcp/client.ts`: Embedded stdio MCP Client managing node child-processes and JSON-RPC std-pipes.
- `src/db/schema.ts`: Drizzle PostgreSQL relational schemas tracking sessions, messages & steps.
