import express from 'express';
import path from 'path';
import fs from 'fs';
import { addTaskToQueue } from './queue.js';

const app = express();
const PORT = 3000;

app.use(express.static('ui'));
app.use(express.json());
app.use('/logs', express.static(path.join(process.cwd(), 'logs')));

app.get('/', (req, res) => {
  res.sendFile('ui/index.html', { root: '.' });
});

app.get('/memory', (req, res) => {
  try {
    const db = JSON.parse(fs.readFileSync('agent.db.json', 'utf-8'));
    res.json(db);
  } catch {
    res.status(500).json({ error: 'Could not load memory' });
  }
});

app.post('/submit', (req, res) => {
  const { input, userId} = req.body;
  if (!input || !userId) {
    return res.status(400).json({ message: 'Missing input, userId, or profile' });
  }
  //addTaskToQueue({ input: `[${profile.toUpperCase()} PROFILE] ${input}`, userId });
  addTaskToQueue({ input: `${input}`, userId });
  res.json({ message: 'Task submitted to queue.' });
});
app.post('/clear-memory', (req, res) => {
  fs.writeFileSync('agent.db.json', "[]", 'utf-8');
});

app.listen(PORT, () => {
  console.log(`Agent UI running at http://localhost:${PORT}`);
});