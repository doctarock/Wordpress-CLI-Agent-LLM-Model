import { execSync } from 'child_process';
import fs from 'fs';

export function runWpCli(command, sitePath = '.') {
  try {
    const fullCommand = `cd ${sitePath} && wp ${command}`;
    const output = execSync(fullCommand, { encoding: 'utf-8' });
    logWpCli(fullCommand, output);
    return output;
  } catch (err) {
    logWpCli(command, err.message);
    return err.message;
  }
}

function logWpCli(command, result) {
  const timestamp = new Date().toISOString();
  const log = `\n[${timestamp}]\nWP-CLI Command:\n${command}\n\nResult:\n${result}\n`;
  fs.writeFileSync('./logs/wpcli.log', log);
}