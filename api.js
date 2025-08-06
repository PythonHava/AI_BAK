require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Make sure HOST_ADDRESS is defined
const ollama_host = process.env.HOST_ADDRESS;

if (!ollama_host) {
  console.error('❌ HOST_ADDRESS environment variable is not set. Exiting...');
  process.exit(1);
}

console.log(`✅ Using Ollama Host: ${ollama_host}`);

async function getModels() {
  try {
    const response = await fetch(`${ollama_host}/api/tags`);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('❌ Failed to fetch models:', err.message);
    process.exit(1); // prevent Railway from keeping a crashing app running
  }
}

function postRequest(data, signal) {
  const URL = `${ollama_host}/api/generate`;
  return fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal
  });
}

async function getResponse(response, callback) {
  const reader = response.body.getReader();
  let partialLine = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const textChunk = new TextDecoder().decode(value);
    const lines = (partialLine + textChunk).split('\n');
    partialLine = lines.pop();

    for (const line of lines) {
      if (line.trim() === '') continue;
      const parsed = JSON.parse(line);
      callback(parsed);
    }
  }

  if (partialLine.trim() !== '') {
    const parsed = JSON.parse(partialLine);
    callback(parsed);
  }
}

// ✅ Optional Test Run: Logs models if working
getModels().then(models => {
  console.log("✅ Available Models:", models);
});
