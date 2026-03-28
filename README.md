# ClearSignal
AI Crisis Text Simplifier (Accessibility Focus)

Problem: Emergency alerts and crisis info are often too complex for people with low literacy, non-native speakers, or cognitive disabilities.
Solution: Paste any alert → AI rewrites it into:

## 👥 Team 
- Arihita Dirghangi  
- Gautam Soni
- Shriram Anand

How to run the app:

The app has two parts - backend and frontend - that need to run separately:

Backend (API server):

cd backend
npm install  # if you haven't already
npm run dev
This starts the backend server on port 3000 (check backend/src/index.ts for the exact port).

Frontend (React app):

cd frontend
npm install  # if you haven't already
npm run dev
This starts the Vite dev server, typically on http://localhost:5173.
