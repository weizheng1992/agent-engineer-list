import { ChatOpenAI } from "@langchain/openai";
import { supervisor, architect, developer, tester, reviewer } from "./index.js";
// Helper to get LLM instance mapped to the local gateway
const getModel = () => {
    const apiKey = process.env.AI_API_KEY || "dummy";
    const baseURL = process.env.AI_BASE_URL || "http://127.0.0.1:11211/api/openai/v1";
    const modelName = process.env.AI_MODEL || "gemini-3.1-pro-preview:latest";
    return new ChatOpenAI({
        apiKey,
        configuration: { baseURL },
        modelName,
        temperature: 0.2,
    });
};
export const runMultiAgentTest = async (requirement) => {
    const model = getModel();
    console.log(`\n======================================================`);
    console.log(`🚀 STARTING MULTI-AGENT COLLABORATION TEST`);
    console.log(`📝 Requirement: "${requirement}"`);
    console.log(`======================================================\n`);
    // 1. Supervisor Orchestrates
    console.log(`[1] 🧑‍✈️ [Supervisor] Routing and organizing task...`);
    const supervisorResponse = await model.invoke([
        { role: "system", content: supervisor.systemPrompt },
        { role: "user", content: `Please delegate the steps to fulfill this requirement: "${requirement}". List what the Architect, Developer, Tester and Reviewer must do.` }
    ]);
    const delegationPlan = supervisorResponse.content.toString().trim();
    console.log(`\n--- Supervisor's Plan ---`);
    console.log(delegationPlan);
    console.log(`-------------------------\n`);
    // 2. Architect Designs System
    console.log(`[2] 📐 [Architect] Creating Architectural Design / ADR...`);
    const architectResponse = await model.invoke([
        { role: "system", content: architect.systemPrompt },
        { role: "user", content: `Based on Supervisor's delegation plan:\n${delegationPlan}\n\nCreate a system architecture design and specification for: "${requirement}"` }
    ]);
    const systemDesign = architectResponse.content.toString().trim();
    console.log(`\n--- Architect's Design Specification ---`);
    console.log(systemDesign);
    console.log(`----------------------------------------\n`);
    // 3. Developer Generates Code
    console.log(`[3] 💻 [Developer] Generating source code files...`);
    const developerResponse = await model.invoke([
        { role: "system", content: developer.systemPrompt },
        { role: "user", content: `Based on Architect's design:\n${systemDesign}\n\nWrite the code to meet the requirement: "${requirement}". Only output valid file structure & source code inside Markdown code blocks.` }
    ]);
    const generatedCode = developerResponse.content.toString().trim();
    console.log(`\n--- Developer's Generated Code ---`);
    console.log(generatedCode);
    console.log(`----------------------------------\n`);
    // 4. Tester Validates via Unit Tests
    console.log(`[4] 🧪 [Tester] Writing tests and assertion cases...`);
    const testerResponse = await model.invoke([
        { role: "system", content: tester.systemPrompt },
        { role: "user", content: `Analyze the generated code:\n${generatedCode}\n\nWrite automated Vitest test cases to thoroughly verify its behavior and correctness.` }
    ]);
    const testCases = testerResponse.content.toString().trim();
    console.log(`\n--- Tester's Unit Tests ---`);
    console.log(testCases);
    console.log(`---------------------------\n`);
    // 5. Reviewer Checks Code Quality & Security
    console.log(`[5] 🔍 [Reviewer] Auditing code safety and style...`);
    const reviewerResponse = await model.invoke([
        { role: "system", content: reviewer.systemPrompt },
        { role: "user", content: `Review the Developer's code:\n${generatedCode}\n\nAnd Tester's cases:\n${testCases}\n\nProvide an evaluation and approval verdict.` }
    ]);
    const reviewVerdict = reviewerResponse.content.toString().trim();
    console.log(`\n--- Reviewer's Quality Verdict ---`);
    console.log(reviewVerdict);
    console.log(`----------------------------------\n`);
    console.log(`======================================================`);
    console.log(`🎉 MULTI-AGENT COLLABORATION TEST COMPLETED SUCCESSFULLY!`);
    console.log(`======================================================\n`);
};
//# sourceMappingURL=test-multi-agents.js.map