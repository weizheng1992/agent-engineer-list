import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createMcpClient() {
  const client = new Client(
    { name: "mini-cursor-client", version: "1.0.0" },
    { capabilities: {} }
  );

  // Spawn our embedded server running under bun relative to current module path
  const serverPath = path.resolve(__dirname, "server.ts");
  
  const transport = new StdioClientTransport({
    command: "bun",
    args: ["run", serverPath],
    env: process.env as Record<string, string>
  });

  await client.connect(transport);
  return client;
}

export async function executeLocalMcpTool(toolName: string, args: Record<string, any>) {
  const client = await createMcpClient();
  try {
    const result = await client.callTool({
      name: toolName,
      arguments: args
    });
    return result;
  } finally {
    // Close connection properly
    await client.close();
  }
}
