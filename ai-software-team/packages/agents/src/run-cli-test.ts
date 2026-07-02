import { runSingleAgentTest } from "./test-run.js";

const run = async () => {
  const requirement = "创建一个js文件，输出console.log（hello）";
  console.log("=== STARTING AGENT DEVELOPMENT CYCLE TEST ===");
  try {
    const result = await runSingleAgentTest(requirement);
    console.log("=== TEST COMPLETED SUCCESSFULLY ===");
  } catch (error) {
    console.error("=== TEST FAILED ===");
  }
};

run();
