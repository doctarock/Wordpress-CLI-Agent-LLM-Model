import fetch from 'node-fetch';
import fs from 'fs';

export async function runHttpApi({ url, method = 'GET', headers = {}, body = null }) {
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await response.text();
    logHttpApi({ url, method, headers, body }, text);
    return text;
  } catch (err) {
    logHttpApi({ url, method, headers, body }, err.message);
    return err.message;
  }
}

function logHttpApi(request, response) {
  const timestamp = new Date().toISOString();
  const log = `\n[${timestamp}]\nRequest:\n${JSON.stringify(request, null, 2)}\n\nResponse:\n${response}\n`;
  fs.appendFileSync('./logs/httpapi.log', log);
}