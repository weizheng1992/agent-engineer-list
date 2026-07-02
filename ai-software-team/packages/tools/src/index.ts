export interface Tool {
  name: string;
  description: string;
  execute: (...args: any[]) => Promise<any>;
}

// File system tools placeholder
export const filesystemTools = {
  name: "filesystem",
  description: "Read, write, list files and directories"
};

// Sandbox execution tools placeholder
export const sandboxTools = {
  name: "sandbox",
  description: "Execute code in an E2B secure sandbox"
};

// GitHub API tools placeholder
export const githubTools = {
  name: "github",
  description: "Manage GitHub repositories, issues, and PRs"
};
