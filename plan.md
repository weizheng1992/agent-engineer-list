# Implementation Plan - Initialize AI Software Team Monorepo

We will set up a brand new Turborepo monorepo named `ai-software-team` in the current workspace. This architecture will perfectly support the 4-week AI Software Team development plan.

## Proposed Project Structure

```text
ai-software-team/
├── package.json               # Monorepo root package.json (Turborepo, pnpm/bun/npm workspaces)
├── turbo.json                 # Turborepo configuration
├── apps/
│   └── web/                   # Next.js 15 Frontend
│       ├── package.json
│       ├── next.config.mjs
│       ├── tsconfig.json
│       ├── src/
│       │   ├── app/           # App Router
│       │   └── components/    # AgentTimeline, MessageBubble, etc.
│       └── tailwind.config.ts
└── packages/
    ├── agents/                # Core Agent Logic
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── supervisor.ts
    │       ├── architect.ts
    │       ├── developer.ts
    │       ├── tester.ts
    │       └── reviewer.ts
    ├── graph/                 # LangGraph State & Orchestration
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── state.ts
    │       └── workflow.ts
    └── tools/                 # MCP & Custom Toolkits
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── github.ts
            ├── sandbox.ts
            └── filesystem.ts
```

## Implementation Steps

### Phase 1: Setup Workspace Roots & Configs
1. Create directories for `ai-software-team`, `apps/web`, `packages/agents`, `packages/graph`, `packages/tools`.
2. Write root files:
   - `ai-software-team/package.json` (defining workspaces for Bun/npm/pnpm, setting up dev/build scripts, and installing `turbo` as devDependency)
   - `ai-software-team/turbo.json` (configuring Turborepo task pipeline)
   - `ai-software-team/tsconfig.json` (base tsconfig)

### Phase 2: Create Packages & Setup LangGraph Foundations
1. Create `packages/graph`:
   - Initialize `package.json`, `tsconfig.json`.
   - Write standard LangGraph state definition `packages/graph/src/state.ts` (defining `SoftwareTeamState` with `Annotation.Root`).
   - Write initial workflow entry `packages/graph/src/workflow.ts` (with simple state nodes & edges).
2. Create `packages/agents`:
   - Initialize `package.json`, `tsconfig.json`.
   - Create empty skeleton files for `supervisor.ts`, `architect.ts`, `developer.ts`, `tester.ts`, `reviewer.ts`.
3. Create `packages/tools`:
   - Initialize `package.json`, `tsconfig.json`.
   - Create placeholder skeleton files for `github.ts`, `sandbox.ts`, `filesystem.ts`.

### Phase 3: Create Next.js 15 App
1. Initialize `apps/web` (Next.js 15 with App Router, TypeScript strict, Tailwind CSS).
2. Wire up workspace references so `apps/web` can import from `@ai-software-team/agents`, `@ai-software-team/graph`, and `@ai-software-team/tools`.
3. Build skeleton endpoints:
   - `app/api/agent/stream/route.ts` (SSE route template)
   - `app/(dashboard)/project/[id]/page.tsx` (page layout)
4. Build UI component skeletons:
   - `components/AgentTimeline.tsx`
   - `components/MessageBubble.tsx`

### Phase 4: Verification & Lockfile Generation
1. Run `bun install` or `npm install` in `ai-software-team` to resolve and link workspace packages.
2. Run build/check commands to verify there are no TypeScript compilation errors.
