import { queryOllama } from './ollama.js';
import { getAllMemory } from './memory.js';

async function analyzeMemory() {
  const memory = JSON.stringify(getAllMemory());
  const prompt = `
Analyze the following memory and task history. Identify:
1. Common task errors or failures
2. Patterns in tool usage
3. Suggestions to improve prompts or inputs
Respond in JSON format:

{
  "summary": "string",
  "issues": ["string"],
  "recommendations": ["string"],
  "prompt_tweaks": ["string"]
}

### Memory:
${memory}
`;

  const result = await queryOllama(prompt);
  console.log("Analysis Result:\n", result);
}

analyzeMemory();