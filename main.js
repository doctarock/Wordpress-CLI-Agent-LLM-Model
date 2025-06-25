import { queryOllama } from './ollama.js';
import { getAllMemory, setMemory, appendToMemory } from './memory.js';
import { wpSites } from './config.js';
import { tools } from './tools/registry.js';
import fs from 'fs';
import path from 'path';

export async function runCommandAgent(userInput, userId = 'default') {
  // Path to your JSON file
  const cliDocPath = './resources/wp_cli_command_reference.json';

  // Read the file as a UTF-8 string
  const cliDocString = fs.readFileSync(cliDocPath, 'utf-8');
  const memorySnapshot = JSON.stringify(getAllMemory(), null, 2);
  const prompt = `Return results in the following JSON format [{command:command,summary:summary}]: ${userInput}`;
  logPrompt(prompt);
  logResponse("getting response");
  const raw = await queryOllama(prompt);
  logResponse(raw);
  
  const summary = raw.trim().split("\n")[0];

  const toolMap = [
    { keywords: ['wp-cli', 'plugin', 'theme', 'WordPress'], tool: 'wp-cli' },
    { keywords: ['http', 'REST', 'endpoint'], tool: 'http' },
    { keywords: ['shell', 'command line', 'terminal'], tool: 'shell' }
  ];

  const tool = toolMap.find(t => t.keywords.some(k => summary.includes(k)))?.tool || false;

  const params = { site: 'site1', command: summary };

  const result = await tools[tool]?.run(params) || 'Tool not available or failed. '+raw;

  appendToMemory('task_log', {
    userId,
    input: userInput,
    summary,
    tool,
    params,
    result,
    time: new Date().toISOString()
  });

  return result;
}
export async function runAgent(userInput, userId = 'default') {
  const memorySnapshot = getAllMemory();
  const memoryFormatted = JSON.stringify(memorySnapshot.task_log.slice(-5), null, 2);
  const availableTools = Object.entries(tools).map(
    ([name, t]) => `- ${name}: ${t.description}`
  ).join('\n');


// Path to your JSON file
const cliDocPath = './resources/wp_cli_command_reference.json';

// Read the file as a UTF-8 string
const cliDocString = fs.readFileSync(cliDocPath, 'utf-8');


  const fullPrompt = `You are a helpful autonomous agent that can use tools to accomplish tasks, by responding with JSON you can select the tool and action, your json response will perform the action autonomously through an API that has been constructed for your use. Only respond in JSON data, do not give an explanation in plain text. You need a good understanding of wordpress and its rest api and cli tools to perform successfully.

## GOAL:
${userInput}

## TOOLS AVAILABLE:
${availableTools}

## WP-CLI COMMANDS AVAILABLE:
${cliDocString}

You may only use the above tools in your response, by their exact name as listed above.

## MEMORY:
${memorySnapshot}

## CONSTRAINTS:
- Respond only in JSON format
- Always return: { "summary": "...", "tool": "...", "params": { ... } }

## EXAMPLES:

Input:
"Install a plugin on site1 using wp-cli"

Output:
{
  "summary": "Install plugin",
  "tool": "wp-cli",
  "params": {
    "site": "site1",
    "command": "plugin install jetpack --activate"
  }
}

Input:
"Get current WordPress version of site2"

Output:
{
  "summary": "Check WP version",
  "tool": "wp-cli",
  "params": {
    "site": "site2",
    "command": "core version"
  }
}

## NOW COMPLETE THIS TASK:
${userInput}`;

  const timeNow = Date.now();
  // Write prompt to a temp file inside the project folder
  const tempDir = path.join(process.cwd(), 'temp_prompts');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  const tempPath = path.join(tempDir, `ollama_prompt_${timeNow}.txt`);
  fs.writeFileSync(tempPath, fullPrompt, 'utf-8');

  const raw = await queryOllama(tempPath);
  console.log("🧠 RAW RESPONSE FROM OLLAMA:\n", raw);
  // const tempDir2 = path.join(process.cwd(), 'temp_responses');
  // if (!fs.existsSync(tempDir2)) fs.mkdirSync(tempDir2);
  // const tempPath2 = path.join(tempDir2, `ollama_response_${timeNow}.txt`);
  // fs.writeFileSync(tempPath2, raw, 'utf-8');
  const json = extractJson(raw);

  console.log("Summary:", json.summary);
  console.log("Tool:", json.tool);
  console.log("Params:", JSON.stringify(json.params));

  let result = 'No tool executed.\r\n'+raw;
  //const tool = tools[json.tool];
  const tool = 'wp-cli';
  
  if (json.params.site) {
    json.params.site = wpSites[json.params.site] || '.';
  }
  result = await tool.run(json.params);

  appendToMemory('task_log', {
    userId,
    input: userInput,
    response: raw,
    tool: json.tool,
    params: json.params,
    result,
    time: new Date().toISOString()
  });

  if (Array.isArray(json.memoryUpdates)) {
    for (const update of json.memoryUpdates) {
      if (update.action === 'set') {
        setMemory(update.key, update.value);
      } else if (update.action === 'append') {
        appendToMemory(update.key, update.value);
      }
    }
  }

  if (json.nextTask) {
    console.log("Continuing with next task...");
    await runCommandAgent(json.nextTask, userId);
  }
}

function extractJson(response) {
  const match = response.match(/{[\s\S]+}/);
  return match ? JSON.parse(match[0]) : {};
}
function logPrompt(result) {
  const timestamp = new Date().toISOString();
  fs.writeFileSync('./logs/prompt.log', result);
}
function logResponse(result) {
  const timestamp = new Date().toISOString();
  fs.writeFileSync('./logs/response.log', result);
}