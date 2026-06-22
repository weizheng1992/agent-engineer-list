const baseURL = process.env.AI_BASE_URL || 'http://127.0.0.1:11211/api/openai/v1';
const apiKey = process.env.AI_API_KEY || 'dummy';
const model = process.env.AI_MODEL || 'gemini-3.1-pro-preview:latest';

console.log('=== TESTING TOOLS CALL ===');
console.log('Base URL:', baseURL);
console.log('Model:', model);

async function main() {
  const payload = {
    model: model,
    messages: [{ role: 'user', content: '帮我解析一下package.json 文件呢' }],
    tools: [
      {
        type: 'function',
        function: {
          name: 'read_file',
          description: 'Read the full contents of a file in the workspace.',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Relative or absolute path of the file to read.' }
            },
            required: ['path']
          }
        }
      }
    ],
    tool_choice: 'auto',
    stream: true
  };

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log('Headers:', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));

    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      console.log('Stream chunks:');
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          console.log('CHUNK:', JSON.stringify(chunk));
        }
      }
    } else {
      const text = await res.text();
      console.log('Error Response:', text);
    }
  } catch (err: any) {
    console.error('Error occurred:', err.message);
  }
}

main();
