import fs from 'fs';
const DB_PATH = './users.db.json';

function loadAllUsers() {
  if (!fs.existsSync(DB_PATH)) return {};
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveAllUsers(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function getUserMemory(userId) {
  const db = loadAllUsers();
  return db[userId] || {};
}

export function setUserMemory(userId, data) {
  const db = loadAllUsers();
  db[userId] = data;
  saveAllUsers(db);
}

export function updateUserMemory(userId, key, value) {
  const db = loadAllUsers();
  db[userId] = db[userId] || {};
  db[userId][key] = value;
  saveAllUsers(db);
}

export function appendUserLog(userId, entry) {
  const db = loadAllUsers();
  db[userId] = db[userId] || {};
  db[userId].task_log = db[userId].task_log || [];
  db[userId].task_log.push(entry);
  saveAllUsers(db);
}