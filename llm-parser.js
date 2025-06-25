import { queryOllama } from './ollama.js';

function extractJsonBlock(text) {
  const match = text.match(/{[\s\S]+}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    return null;
  }
}

function validateParsedJson(json) {
  return json && typeof json === 'object'
    && 'summary' in json
    && 'tool' in json
    && 'params' in json;
}

function rephrasePrompt(basePrompt, attempt) {
  return `${basePrompt}\n\n(! Attempt ${attempt + 1} failed to produce valid JSON. Please try again, respond strictly in JSON format only as:\n{ "summary": "...", "tool": "...", "params": {...} })`;
}

export async function runWithParser(basePrompt, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const prompt = rephrasePrompt(basePrompt, attempt);
    const raw = await queryOllama(prompt);
    const json = extractJsonBlock(raw);
    if (validateParsedJson(json)) {
      return json;
    }
  }

  // Log invalid result
  return {
    summary: 'Failed to extract valid JSON after retries',
    tool: 'none',
    params: {}
  };
}
