# Agent Engineer 学习路线 2026

## 目标

6个月掌握现代 Agent 开发能力：

-   AI Chat
-   Tool Calling
-   MCP
-   Agent Runtime
-   Workflow Agent
-   Planning
-   Reflection
-   Memory
-   Context Engineering
-   Multi Agent
-   Harness Engineering

------------------------------------------------------------------------

# 技术栈

## 前端

-   Vue 3
-   TypeScript
-   Vite
-   Tailwind CSS
-   shadcn-vue
-   assistant-ui

## 后端

-   Node.js 22+
-   TypeScript
-   Fastify
-   PostgreSQL
-   Redis
-   Drizzle ORM

## Agent

核心：

-   LangGraph.js

辅助：

-   LangChain.js
-   Vercel AI SDK

## 协议

重点：

-   MCP (Model Context Protocol)

了解：

-   A2A (Agent to Agent)

------------------------------------------------------------------------

# 阶段 1：LLM Application 基础 

时间：2周

目标：

掌握 LLM 应用开发。

学习：

-   Prompt
-   System Prompt
-   Structured Output
-   Streaming
-   Token
-   Context Window

项目： [chatbox](https://github.com/weizheng1992/chatbot)

## AI Chat

功能：

-   对话
-   流式输出
-   Markdown
-   Code Highlight
-   历史记录

目录： 

    ai-chat

    frontend
    backend
    llm
    stream
    storage

------------------------------------------------------------------------

# 阶段 2：Tool Calling

时间：3周

目标：

让 Agent 使用外部工具。

学习：

-   Function Calling
-   Tool Schema
-   Tool Router
-   Error Handling

项目： [temporal-ai-agent](https://github.com/weizheng1992/temporal-ai-agent)

## AI Assistant

工具：

-   weather
-   calculator
-   search
-   database

架构：

    User

    Agent

    Tool Router

    Tools

实现：

-   timeout
-   retry
-   fallback

------------------------------------------------------------------------

# 阶段 3：MCP

时间：3周

目标：

掌握现代 Agent 工具协议。

学习：

-   MCP Server
-   MCP Client
-   Resource
-   Tool

项目：[mini-cursor-agent](./mini-cursor-agent/)

## MCP Developer Assistant

MCP Server:

-   filesystem
-   git
-   terminal
-   database

架构：

    Agent

    MCP Client

    MCP Server

    Tools

------------------------------------------------------------------------

# 阶段 4：Agent Runtime

时间：3周

目标：

理解 Agent 内部运行机制。

项目：

## Mini Agent Runtime

实现：

    observe

    think

    act

    evaluate

包含：

-   State
-   Message
-   Tool
-   Memory

------------------------------------------------------------------------

# 阶段 5：Workflow Agent

时间：4周

目标：

学习生产级 Agent 流程。

技术：

LangGraph

学习：

-   Node
-   Edge
-   State
-   Checkpoint

项目：

## AI 项目管理 Agent

流程：

    Planner

    Executor

    Validator

    Finish

能力：

1.  分析需求
2.  生成计划
3.  执行任务
4.  验证结果

------------------------------------------------------------------------

# 阶段 6：Planning Agent

时间：3周

项目：

## AI Coding Planner

输入：

优化 Vue 项目

输出：

1.  分析代码
2.  修改组件
3.  运行测试
4.  提交代码

架构：

    Planner

    Executor

    Reviewer

------------------------------------------------------------------------

# 阶段 7：Reflection Agent

时间：2周

项目：

## Code Review Agent

流程：

    Coder

    Reviewer

    Fixer

能力：

-   找问题
-   自动修复
-   重试

------------------------------------------------------------------------

# 阶段 8：Memory + Context Engineering

时间：4周

重点：

现代 Agent 核心。

学习：

-   Context Window 管理
-   Summary
-   Compression
-   Retrieval
-   Memory

项目：

## Long Running Agent

保存：

-   对话
-   状态
-   决策
-   任务进度

技术：

-   PostgreSQL
-   pgvector
-   Redis

------------------------------------------------------------------------

# 阶段 9：Multi Agent

时间：4周

项目：

## AI Software Team

角色：

-   Manager
-   Architect
-   Frontend
-   Backend
-   QA

架构：

    Supervisor

    ├── Architect
    ├── Developer
    ├── Tester
    └── Reviewer

学习：

-   Agent Communication
-   Delegation
-   Role Design

------------------------------------------------------------------------

# 阶段 10：Harness Engineering

时间：6周

目标：

开发类似 Claude Code / Cursor 的系统。

学习：

## Tool System

-   filesystem
-   shell
-   git

## Skill System

示例：

    skills

    vue

    SKILL.md

## Hook System

执行前检查：

    npm install

    security check

## Sandbox

Docker 隔离执行。

## Permission

控制：

-   read
-   write
-   execute

------------------------------------------------------------------------

# 最终项目

## Mini Claude Code

技术：

-   Vue3
-   Node.js
-   LangGraph
-   MCP
-   PostgreSQL
-   Redis
-   Docker

功能：

用户：

    帮我开发一个后台系统

Agent：

1.  理解需求
2.  生成计划
3.  修改代码
4.  执行测试
5.  修复问题
6.  Git 提交

架构：

    Frontend

    Agent Runtime

    ├── MCP
    ├── Tools
    ├── Memory
    ├── Skills
    └── Sandbox

------------------------------------------------------------------------

# 推荐学习顺序

1.  Tool Calling
2.  MCP
3.  Agent Runtime
4.  LangGraph
5.  Planning
6.  Reflection
7.  Context Engineering
8.  Multi Agent
9.  Harness Engineering

------------------------------------------------------------------------

# 每周安排

每天：

-   30分钟理论
-   2小时编码
-   30分钟源码学习

每周完成一个小项目。

------------------------------------------------------------------------

最终能力：

-   Agent Backend Engineer
-   AI Application Engineer
-   AI Infra Engineer
