import { getNextTask } from './queue.js';
import { runAgent, runCommandAgent } from './main.js';

async function processQueue() {
  const task = getNextTask();
  if (!task) {
    console.log('Queue is empty.');
    return;
  }
  console.log('Processing queued task:', task.input);
  await runCommandAgent(task.input, task.userId || 'default');
}

processQueue();