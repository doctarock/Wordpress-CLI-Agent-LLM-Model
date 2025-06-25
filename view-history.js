import { getTaskHistory } from './memory.js';

const history = getTaskHistory(10);
console.log("\n=== Task History (Latest 10) ===");
history.forEach((task, index) => {
  console.log(`\n#${index + 1} — ${task.time}`);
  console.log(`Input: ${task.input}`);
  console.log(`Tool: ${task.tool}`);
  console.log(`Params:`, task.params);
  console.log(`Result:`, task.result);
});