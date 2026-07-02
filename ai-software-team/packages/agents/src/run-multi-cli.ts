import { runMultiAgentTest } from "./test-multi-agents.js";

const run = async () => {
  const requirement = "创建一个js文件，输出console.log（hello）";
  try {
    await runMultiAgentTest(requirement);
  } catch (error) {
    console.error("Multi-agent integration test failed:", error);
  }
};

run();
