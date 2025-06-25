import fs from 'fs';
import path from 'path';
import { setTimeout } from 'timers/promises';

const OLLAMA_API_URL = process.env.Ollama_API_URL || 'http://localhost:11434/api/chat';
const MODEL = process.env.DEFAULT_MODEL || 'phi3:mini';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const cliDocPath = './resources/wp_cli_command_reference.json';
let cliDocString;

try {
  cliDocString = fs.readFileSync(cliDocPath, 'utf-8');
} catch (err) {
  console.error(`Failed to read CLI documentation file: ${err.message}`);
  throw err;
}

const logPath = path.join(logsDir, 'agent.log');

function logToFile(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

/**
 * Queries the Ollama API with a given prompt.
 * @param {string} prompt - The user's input prompt
 * @returns {Promise<string>} - The API response or empty string on failure
 */
export async function queryOllama(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Invalid prompt');
  }

  const payload = {
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a JSON reasoning engine. Respond ONLY with a JSON object. Do not use markdown or any explanation.
          You have the following options to respond with:
          ${cliDocString}
          
          Please find the most likely command from the list above that relates to the user's prompt.
          
          Replace any words in angle brackets in command strings with their correct values before returning e.g. "wp plugin install <plugin>" should return as "wp plugin install woocommerce" where "woocommerce" replaces "<plugin>" if the user wishes to install woocommerce.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    stream: false,
    temperature: 0,
  };

  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logToFile(`❌ Ollama API error: ${response.status} ${response.statusText}\n${errorText}`);
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (typeof data.message?.content !== 'string') {
      logToFile('❌ Invalid response format from Ollama API');
      return '';
    }

    const result = data.message.content.trim();
    logToFile(`✅ Ollama returned (truncated): ${result.slice(0, 200)}`);
    return result;
  } catch (err) {
    logToFile(`❌ Fetch failed: ${err.message}`);
    throw err;
  }
}

/**
 * Retries the queryOllama function with exponential backoff.
 * @param {string} prompt - The user's input prompt
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<string>} - The API response or empty string on failure
 */
export async function queryOllamaWithRetry(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await queryOllama(prompt);
    } catch (err) {
      if (i === retries - 1) throw err;
      const delay = Math.pow(2, i) * 1000;
      await setTimeout(delay);
    }
  }
}
