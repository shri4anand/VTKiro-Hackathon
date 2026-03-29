# ClearSignal

ClearSignal is an accessibility-focused crisis communication platform that makes emergency alerts and crisis information understandable for everyone, especially vulnerable populations.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgautamsoni%2FVTKiro-Hackathon&env=LLM_API_KEY,HUME_API_KEY&envDescription=API%20keys%20required%20to%20run%20ClearSignal&envLink=https%3A%2F%2Fgithub.com%2Fgautamsoni%2FVTKiro-Hackathon%2Fblob%2Fmain%2F.env.example&project-name=clearsignal&repository-name=clearsignal)

## The Problem

During emergencies, official alerts are often too complex for people with low literacy, cognitive disabilities, or non-native English speakers to understand quickly. This creates a critical barrier to accessing life-saving information when time matters most.

## What It Does

### Text Simplification
Takes complex emergency alerts and rewrites them at three reading levels (Grade 3, 6, and 9) using AI, ensuring critical safety information is preserved while making it easier to understand.

### Multi-Language Support
Translates simplified content into 5 languages (Spanish, French, Mandarin Chinese, Arabic, Portuguese) so non-English speakers can access life-saving information.

### Audio Playback
Converts text to speech so people with visual impairments or reading difficulties can hear the alerts.

### Automated Crisis News Feed
Continuously pulls emergency and crisis news articles, automatically simplifies them, and displays them in an accessible format that updates every 5 minutes.

### Full Accessibility
Built with keyboard navigation, screen reader support, ARIA labels, and proper contrast ratios so people with disabilities can use it effectively.

## Tech Stack

- **Frontend**: React/TypeScript with Tailwind CSS, Vite
- **Backend**: Node.js serverless functions (Vercel)
- **AI**: OpenAI for text simplification, Hume AI for text-to-speech
- **Data**: GDACS RSS feed for real-time crisis events
- **Testing**: Comprehensive property-based testing

## Team

- Arihita Dirghangi
- Gautam Soni
- Shriram Anand

## Deploy to Vercel (1-click)

Click the **Deploy with Vercel** button above, then add these environment variables when prompted:

| Variable | Description |
|----------|-------------|
| `LLM_API_KEY` | OpenAI API key for text simplification |
| `LLM_MODEL` | Model to use (optional, defaults to `gpt-5.4-mini`) |
| `HUME_API_KEY` | Hume AI API key for text-to-speech |

That's it — Vercel builds the frontend and deploys the backend as serverless functions automatically.

## Local Development

Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

Then run the backend and frontend in separate terminals:

### Backend (Express API server)

```bash
cd backend
npm install
npm run dev
```

This starts the backend on `http://localhost:3001`.

### Frontend (React app)

```bash
cd frontend
npm install
npm run dev
```

This starts the Vite dev server on `http://localhost:5173`. API calls are automatically proxied to the local backend.

## Project Structure

```
/
├── api/                  # Vercel serverless functions
│   ├── feed.ts           # GET  /api/feed
│   ├── simplify.ts       # POST /api/simplify
│   ├── health.ts         # GET  /api/health
│   └── tts/
│       ├── index.ts      # POST /api/tts
│       └── debug.ts      # GET  /api/tts/debug
├── backend/              # Shared backend logic (imported by api/)
│   └── src/
│       ├── llm.ts        # OpenAI integration
│       ├── tts.ts        # Hume AI integration
│       ├── feed.ts       # Crisis feed aggregation
│       ├── gdacs.ts      # GDACS RSS parsing
│       ├── scorer.ts     # Flesch-Kincaid scoring
│       ├── validation.ts # Request validation
│       └── types.ts      # Shared TypeScript types
├── frontend/             # Vite + React SPA
│   └── src/
├── vercel.json           # Vercel deployment config
└── .env.example          # Environment variable reference
```
