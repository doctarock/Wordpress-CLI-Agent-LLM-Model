import fs from 'fs';
const DB_PATH = './agent.db.json';
const EXPIRATION_MS = { 'task_log': 1000 * 60 * 60 * 24 * 7 };

function loadMemory() {
  if (!fs.existsSync(DB_PATH)) return {};
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  return expireOldEntries(data);
}

function saveMemory(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function expireOldEntries(data) {
  const now = Date.now();
  for (const key in EXPIRATION_MS) {
    if (Array.isArray(data[key])) {
      data[key] = data[key].filter(entry => {
        const entryTime = new Date(entry.time || entry.timestamp || 0).getTime();
        return now - entryTime <= EXPIRATION_MS[key];
      });
    }
  }
  return data;
}

export function getMemory(key) {
  return loadMemory()[key];
}

export function setMemory(key, value) {
  const db = loadMemory();
  db[key] = value;
  saveMemory(db);
}

export function appendToMemory(key, value) {
  const db = loadMemory();
  if (!Array.isArray(db[key])) db[key] = [];
  db[key].push(value);
  saveMemory(db);
}

export function getAllMemory() {
  return loadMemory();
}

export function getTaskHistory(limit = 10) {
  const db = loadMemory();
  return (db.task_log || []).slice(-limit).reverse();
}