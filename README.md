# GoalCoach

AI accountability coach that sends SMS reminders, tracks goals, and chats with users using OpenAI + Twilio.

## Features

- SMS reminders via Twilio
- AI-powered accountability chatbot
- Goal tracking
- Daily reminders
- SQLite persistence
- Cron-based scheduler

## Tech Stack

- Node.js + Express
- Twilio Messaging API
- OpenAI API
- SQLite

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Twilio Webhook

Point your Twilio incoming SMS webhook to:

```bash
POST /sms/webhook
```

Example using ngrok:

```bash
ngrok http 3000
```

Then configure:

```bash
https://your-ngrok-url.ngrok-free.app/sms/webhook
```

## Example Goal Creation

POST /goals

```json
{
  "phone": "+12065551234",
  "name": "Aarin",
  "title": "Apply to 5 internships",
  "frequency": "daily",
  "reminder_time": "18:00"
}
```

## Future Improvements

- React frontend dashboard
- Goal streak tracking
- Vector memory for long-term coaching
- Adaptive reminder timing
- Weekly AI summaries
- WhatsApp support
