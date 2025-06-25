import fs from 'fs';
const QUEUE_PATH = './queue.json';

function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) return [];
  return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2), 'utf-8');
}

export function addTaskToQueue(task) {
  const queue = loadQueue();
  queue.push(task);
  saveQueue(queue);
}

export function getNextTask() {
  const queue = loadQueue();
  const task = queue.shift();
  saveQueue(queue);
  return task;
}

export function getQueue() {
  return loadQueue();
}