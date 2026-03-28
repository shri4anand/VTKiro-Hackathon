# ClearSignal

ClearSignal is an accessibility-focused crisis communication platform that makes emergency alerts and crisis information understandable for everyone, especially vulnerable populations.

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

- **Frontend**: React/TypeScript with Tailwind CSS
- **Backend**: Node.js
- **AI**: OpenAI for text simplification
- **Testing**: Comprehensive property-based testing to ensure correctness
- **Deployment**: AWS (frontend and backend components)

## Team

- Arihita Dirghangi
- Gautam Soni
- Shriram Anand

## How to Run the App

The app has two parts - backend and frontend - that need to run separately:

### Backend (API server)

```bash
cd backend
npm install  # if you haven't already
npm run dev
```

This starts the backend server on port 3000 (check `backend/src/index.ts` for the exact port).

### Frontend (React app)

```bash
cd frontend
npm install  # if you haven't already
npm run dev
```

This starts the Vite dev server, typically on http://localhost:5173.