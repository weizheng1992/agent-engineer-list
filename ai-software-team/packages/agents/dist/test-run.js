import { ChatOpenAI } from "@langchain/openai";
import * as fs from "fs";
import * as path from "path";
export const runSingleAgentTest = async (requirement) => {
    // Use config from .env to direct to local LLM Gateway
    const apiKey = process.env.AI_API_KEY || "dummy";
    const baseURL = process.env.AI_BASE_URL || "http://127.0.0.1:11211/api/openai/v1";
    const modelName = process.env.AI_MODEL || "gemini-3.1-pro-preview:latest";
    console.log(`[TEST] Connecting to local LLM Gateway at: ${baseURL}`);
    console.log(`[TEST] Using model: ${modelName}`);
    const model = new ChatOpenAI({
        apiKey: apiKey,
        configuration: {
            baseURL: baseURL,
        },
        modelName: modelName,
        temperature: 0.1,
    });
    try {
        console.log(`[TEST] Sending prompt to local gateway: "${requirement}"`);
        const response = await model.invoke([
            {
                role: "system",
                content: "You are an AI Developer Agent. Generate a JavaScript file that outputs console.log('hello') as requested. Return ONLY valid executable javascript code blocks, with NO markdown formatting (do NOT wrap in ```js ... ```)."
            },
            {
                role: "user",
                content: requirement
            }
        ]);
        const code = response.content.toString().trim();
        console.log(`[TEST] LLM Gateway generated code:\n${code}`);
        // Define target path in the agent project workspace
        const targetDir = path.resolve(process.cwd(), "tmp");
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        const targetFile = path.join(targetDir, "hello.js");
        // Write code to the hello.js file
        fs.writeFileSync(targetFile, code, "utf-8");
        console.log(`[TEST] File written successfully to: ${targetFile}`);
        return targetFile;
    }
    catch (error) {
        console.error(`[TEST] LLM Connection Error:`, error);
        throw error;
    }
};
//# sourceMappingURL=test-run.js.map