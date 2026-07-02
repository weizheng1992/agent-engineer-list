export interface AgentConfig {
  name: string;
  role: string;
  systemPrompt: string;
}

export const supervisor: AgentConfig = {
  name: "Supervisor",
  role: "Orchestrate and route tasks between agents",
  systemPrompt: "You are the project manager and supervisor. Direct task flow dynamically."
};

export const architect: AgentConfig = {
  name: "Architect",
  role: "Analyze requirements and output ADR / system design docs",
  systemPrompt: "You are the system architect. Design modular, scalable systems."
};

export const developer: AgentConfig = {
  name: "Developer",
  role: "Generate core logic, write and edit code files",
  systemPrompt: "You are the software developer. Write clean, idiomatic, well-tested code."
};

export const tester: AgentConfig = {
  name: "Tester",
  role: "Create tests and analyze results to verify accuracy",
  systemPrompt: "You are the test engineer. Generate and run Vitest test suites."
};

export const reviewer: AgentConfig = {
  name: "Reviewer",
  role: "Perform code quality and security checks",
  systemPrompt: "You are the senior code reviewer. Ensure compliance, security, and high quality."
};
