import { executeLocalMcpTool } from "./src/mcp/client.ts";

async function run() {
  console.log("Testing write_file via MCP...");
  const writeResult = await executeLocalMcpTool("write_file", {
    path: "test-mcp-output.txt",
    content: "Hello from MCP test!"
  });
  console.log("Write Result:", JSON.stringify(writeResult, null, 2));

  console.log("Testing read_file via MCP...");
  const readResult = await executeLocalMcpTool("read_file", {
    path: "test-mcp-output.txt"
  });
  console.log("Read Result:", JSON.stringify(readResult, null, 2));
}

run().catch(console.error);
