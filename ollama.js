import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch'; // make sure it's installed

const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
const MODEL = 'phi3:mini';

// Path to JSON file
const cliDocPath = './resources/wp_cli_command_reference.json';
// Read the file as a UTF-8 string
const cliDocString = fs.readFileSync(cliDocPath, 'utf-8');

const logPath = path.join(process.cwd(), 'logs', 'agent.log');
function logToFile(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

export async function queryOllama(prompt) {
  const payload = {
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a JSON reasoning engine. Respond ONLY with a JSON object. Do not use markdown or any explanation. 
        You have the following options to respond with:
        ${cliDocString}
        
        Please find the most likely command from the list above that relates to the users prompt.
        
        Replace any words in angle brackets in command strings with their correct values before returning e.g. "wp plugin install <plugin>" should return as "wp plugin install woocommerce" where "woocommerce" replaces "<plugin>" if the user wishes to install woocommerce.`
        
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    stream: false,
    temperature: 0
  };

  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logToFile(`❌ Ollama API error: ${response.status} ${response.statusText}\n${errorText}`);
      return '';
    }

    const data = await response.json();
    const result = data.message?.content ?? '';
    logToFile(`✅ Ollama returned: ${result.slice(0, 200)}`);
    return result.trim();
  } catch (err) {
    logToFile(`❌ Fetch failed: ${err.message}`);
    return '';
  }
}
