# Context Engineering Dashboard & Playground 🌐📊

[English](#english) | [中文](#中文)

---

## English

A highly visual, educational, and functional **Context Engineering Dashboard & Playground** built for AI Software Engineering Agent Runtimes. This dashboard demonstrates how modern coding agents (such as Claude Code and Cursor) manage token budgets, assemble prompts, parse structures, slice text for RAG, calculate embeddings, and run advanced cross-encoder re-ranking.

### 🌟 Key Features
- **🌐 One-Click Bilingual Toggle (i18n)**: Fully responsive language switching (Chinese/English) on-the-fly, backed by localized local storage.
- **🧭 Dynamic Token Budget Slider (Tab 1)**: Interactive SVG token allocation bar showing live adjustments of System Prompt, Repo Map, Retrieved Chunks, History Summary, and Free Buffer sizes.
- **💻 Repo Map Scanner & AST Parser (Tab 2)**: Recursively parses workspace files and rates them by core priority. Extracts imports, classes, function signatures, and database schemas dynamically.
- **📊 Interactive RAG & pgvector Sandbox (Tab 3)**: Sliding-window chunking preview with alternating colored boundaries, 128-dim Cosine similarity dot-product math board, and Hybrid BM25/Vector RRF (Reciprocal Rank Fusion) ranking results.
- **✨ Advanced Context Optimization (Tab 4)**: Rules-based Chat Log compressor with saved tokens indicator gauge, rolling session memory distillation summaries, Adaptive Routing indicators, and Cross-Encoder Re-ranking card animations.
- **⚡ Proactive Client-Side File Radar Sync**: Seamlessly syncs AST maps, RAG slices, and prompt compilers the moment a workspace file name is entered in the chat room.

### 🛠️ Tech Stack
- **Framework**: Next.js 15.5.19 + React 19 + TypeScript
- **State Management**: Highly modular Custom Hook architecture (`src/hooks/useContextEngine.ts`)
- **Agent Pipeline**: Vercel AI SDK 6 (`ai`, `@ai-sdk/openai`)
- **Protocol**: Model Context Protocol (MCP) child-process client/server std-pipes
- **Database / Styling**: PostgreSQL + Tailwind CSS v4 + Lucide React Icons

---

## 中文

本项目是一个面向现代大语言模型（LLM）智能体运行时的 **上下文工程（Context Engineering）可视化交互调试沙盒与仪表盘**。该工作台将复杂的 Token 分配、工程大地图、RAG 向量检索原理与高级长上下文管护手段，全部转化为 100% 动态流、实时响应、像素级可控的高颜值 Web 交互面板。

### 🌟 核心功能
- **🌐 一键无级中英文切换 (i18n)**：全界面、算法介绍、计算公式及演示数据的双语一键零延迟切换，自动利用本地存储记住语言偏好。
- **🧭 Token 动态预算分配与提示词编译器 (Tab 1)**：60 帧极速响应的 Token 总额与细分模块占比（System, Repo Map, RAG, History, Buffer）分配滑块与 SVG 伸缩条。支持左侧修改变量，右侧实时插值拼接生成最终大模型 Payload 并预估 Token 大小。
- **💻 代码大地图扫描与 AST 语法树析构 (Tab 2)**：递归扫描本地真实工作区文件，评定文件推荐重要度。内置无依赖 AST 提取引擎，一键剖析 TS/JS 文件的 `imports` 依赖、函数入参 `params` 以及数据库 schemas 骨架并高亮渲染。
- **📊 交互式 RAG 滑动分块与相似度沙盒 (Tab 3)**：支持自定义大小和 overlap 的多色交替滑动窗口切片可视化。内置 **pgvector 128维余弦检索底层数学代数板**，列出浮点向量、点积公式与余弦相似度实测得分。表格化呈现 BM25 精确命中与向量检索名次的 **RRF (倒数排名融合)** 合并过程。
- **✨ 高级上下文管理、滚动总结与精排 (Tab 4)**：去除多余换行、时间戳和堆栈的真实会话 JSON 压缩减负板并配有 `% Tokens 节省环形图`；多轮对话后动态将调用链浓缩为一句长记忆的记事卡片；自适应路由分发雷达；以及 **Cross-Encoder 深度二次重排卡片排序动画**。
- **⚡ 主动式 RAG 协同雷达**：用户在左侧提问中提到文件名时，无需等大模型流式推理工具，前端在**按下发送键的瞬间**即主动载入并切分重绘该文件 AST 树和 RAG 沙盘，保证绝对对应、无断档。

### 🛠️ 技术栈
- **全栈框架**：Next.js 15.5.19 + React 19 + TypeScript
- **状态架构**：精心解耦的组合式自定义 Hooks 驱动架构 (`src/hooks/useContextEngine.ts`)
- **词典管理**：集中化翻译字典模型 (`src/components/i18n.ts`)
- **全栈协议 / 样式**：Stdio MCP Client/Server, Tailwind CSS v4, Lucide React

---

## 🚀 Quick Start / 快速启动

### 1. Configure Environment Variables / 配置环境变量
Create a `.env` file in the project root:
在项目根目录创建并配置 `.env` 文件：
```env
# Postgres Database connection
POSTGRES_URL=postgres://postgres:postgres@localhost:5432/context_engineering

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

### 3. Run Development Server / 启动开发
Start the dashboard on port `3002`:
在端口 `3002` 上启动本地开发：
```bash
bun dev
```
Open [http://localhost:3002](http://localhost:3002) in your browser.
在浏览器访问 [http://localhost:3002](http://localhost:3002)。

---

## 📁 Custom Hooks & Modular Architecture / 解耦组件与 Hooks 结构

To achieve extreme clean code, the large page logic is factored into modular sub-components and specialized react hooks:
为了保持极致精简、高可读性的页面结构，所有的组件及状态机逻辑已经彻底高内聚解耦：

- `src/hooks/useContextEngine.ts`: Declares `useLanguage`, `useWorkspaceFiles`, `useRAGPlayground`, `useAdvancedControls` state orchestrators.
- `src/components/i18n.ts`: Centralized bilingual English/Chinese localization dictionary.
- `src/components/Sidebar.tsx`: Persistent navigation drawer with indicators.
- `src/components/AgentChat.tsx`: Dedicated local chat container displaying ReAct Trace rolls.
- `src/components/TabPromptBudget.tsx`: Prompt variable templates and sliders visualizer.
- `src/components/TabRepoAST.tsx`: Workspace tree explorer and AST parsed card lists.
- `src/components/TabRAG.tsx`: Multi-colored sliding-window chunks visualizer, dot product math panels, and RRF rankings.
- `src/components/TabAdvanced.tsx`: Chat history JSON log cleaners, router radar widgets, and reranking card shuffler.
