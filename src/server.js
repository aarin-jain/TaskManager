import express from 'express';
import dotenv from 'dotenv';
import cron from 'node-cron';
import Database from 'better-sqlite3';
import twilio from 'twilio';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new Database('goalcoach.db');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Initialize tables

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE,
  name TEXT
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT,
  frequency TEXT,
  reminder_time TEXT,
  status TEXT DEFAULT 'active'
);
`);

app.get('/', (req, res) => {
  res.send('GoalCoach API Running');
});

app.post('/goals', (req, res) => {
  const { phone, name, title, frequency, reminder_time } = req.body;

  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

  if (!user) {
    const result = db.prepare('INSERT INTO users (phone, name) VALUES (?, ?)').run(phone, name);
    user = { id: result.lastInsertRowid };
  }

  db.prepare(
    'INSERT INTO goals (user_id, title, frequency, reminder_time) VALUES (?, ?, ?, ?)'
  ).run(user.id, title, frequency, reminder_time);

  res.json({ success: true });
});

app.post('/sms/webhook', async (req, res) => {
  const incoming = req.body.Body.toLowerCase();
  const from = req.body.From;

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(from);

  if (!user) {
    return res.send('User not found');
  }

  let reply = "Stay consistent. You got this.";

  if (incoming.includes("done")) {
    reply = "Nice work. Progress logged.";
  } else if (incoming.includes("skip")) {
    reply = "Alright, reset for tomorrow.";
  } else if (incoming.includes("tired")) {
    reply = "Do the smallest version today. 10 minutes counts.";
  }

  await client.messages.create({
    body: reply,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: from
  });

  res.send('OK');
});

cron.schedule('* * * * *', async () => {
  const goals = db.prepare('SELECT goals.*, users.phone FROM goals JOIN users ON users.id = goals.user_id').all();

  const now = new Date();
  const currentTime = now.toTimeString().slice(0,5);

  for (const goal of goals) {
    if (goal.reminder_time === currentTime) {
      const text = `Reminder: ${goal.title}. Stay consistent today.`;

      await client.messages.create({
        body: text,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: goal.phone
      });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
