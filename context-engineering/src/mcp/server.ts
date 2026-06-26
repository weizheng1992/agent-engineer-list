import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from 'node:fs/promises';
import path from 'node:path';

const server = new Server(
  { name: "context-engine-fs-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read_file",
        description: "Read the full contents of a file in the workspace.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Path to the file to read (can be absolute or relative to workspace)." }
          },
          required: ["path"]
        }
      },
      {
        name: "write_file",
        description: "Write content to a file in the workspace.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Path to the file to write." },
            content: { type: "string", description: "The content to write into the file." }
          },
          required: ["path", "content"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "read_file") {
    const rawPath = args?.path as string;
    if (!rawPath) throw new Error("Missing 'path' argument");

    // Resolve relative to workspace root (the parent folder containing the projects)
    const resolvedPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), "..", rawPath);
    try {
      const text = await fs.readFile(resolvedPath, "utf-8");
      return {
        content: [{ type: "text", text }]
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error reading file: ${err.message}` }]
      };
    }
  }

  if (name === "write_file") {
    const rawPath = args?.path as string;
    const content = args?.content as string;
    if (!rawPath) throw new Error("Missing 'path' argument");
    if (content === undefined) throw new Error("Missing 'content' argument");

    const resolvedPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), "..", rawPath);
    try {
      await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
      await fs.writeFile(resolvedPath, content, "utf-8");
      return {
        content: [{ type: "text", text: `Successfully wrote file to ${resolvedPath}` }]
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error writing file: ${err.message}` }]
      };
    }
  }

  throw new Error(`Tool not found: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Context Engine MCP Server connected via stdio transport!");
