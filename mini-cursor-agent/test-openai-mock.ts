import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

// Mock global fetch to intercept and print request details without making any network connection
global.fetch = async (url: any, options: any) => {
  console.log('\n=== INTERCEPTED FETCH CALL ===');
  console.log('URL:', url);
  console.log('Method:', options?.method);
  console.log('Headers:', JSON.stringify(options?.headers || {}, null, 2));
  console.log('==============================\n');
  
  // Return a mocked successful response compatible with OpenAI spec
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    text: async () => JSON.stringify({
      id: 'chatcmpl-mock',
      object: 'chat.completion',
      created: Date.now(),
      model: 'mock-model',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'Hello! I am a mocked response from port 11211.',
          },
          finish_reason: 'stop',
        },
      ],
    }),
  } as any;
};

const customOpenai = createOpenAI({
  baseURL: process.env.AI_BASE_URL || 'http://127.0.0.1:11211/api/openai/v1',
  apiKey: process.env.AI_API_KEY || 'dummy',
  compatibility: 'compatible'
} as any);

async function main() {
  console.log('=== RUNNING MOCK OPENAI TEST ===');
  try {
    const response = await generateText({
      model: customOpenai(process.env.AI_MODEL || 'company/gemini-3.1-pro-preview:latest'),
      prompt: 'Hello, are you there?',
    });
    console.log('Response text:', response.text);
  } catch (error: any) {
    console.error('Error occurred:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

main();
