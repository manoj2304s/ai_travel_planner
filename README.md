# AI Travel Planner

It is a full-stack AI-powered travel planning web application built as a technical assessment. Users can register, log in, and generate complete day-by-day travel itineraries using an LLM, along with budget estimates and hotel suggestions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, Tailwind CSS, TypeScript |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB (Atlas) |
| Authentication | JWT + bcryptjs |
| AI | Google Gemini 2.5 Flash |
| Deployment | Vercel (frontend), Render (backend) |

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google AI Studio API key

### Backend (local)

```bash
cd backend
npm install
```

Create `.env`:
```
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

```bash
npm run dev
```

### Frontend (local)

```bash
cd frontend
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Visit `http://localhost:3000`

### Deployed URLs
- Frontend: `<vercel_url>`
- Backend: `<render_url>`

---

## Architecture

├── frontend/          # Next.js App Router

│   ├── app/

│   │   ├── (auth)/        # login, register pages

│   │   └── (dashboard)/   # protected pages

│   ├── components/

│   └── lib/

│       ├── api.ts         # axios instance with JWT interceptor

│       └── auth.ts        # token/user localStorage helpers

│

└── backend/           # Express REST API

└── src/

├── models/        # Mongoose schemas (User, Trip)

├── routes/        # auth.ts, trips.ts

├── middleware/    # verifyToken.ts

└── services/      # llm.ts (Gemini integration)

---

## Authentication & Authorization

- Passwords are hashed using **bcryptjs** (12 salt rounds)
- On login/register, server issues a signed **JWT** (7 day expiry)
- Token is stored in **localStorage** and attached to every API request via an Axios request interceptor
- All trip routes are protected by `verifyToken` middleware
- Every database query filters by `userId` — users cannot access or modify other users' data
- A 401 response on the frontend automatically clears local storage and redirects to login

---

## AI Agent Design

- Uses **Google Gemini 2.5 Flash** via the `@google/genai` SDK
- On trip creation, a single prompt generates the full itinerary, budget estimate, and hotel suggestions in one API call — avoiding multiple round trips
- The prompt enforces strict JSON output with a defined schema, which is parsed and validated before saving to MongoDB
- For day regeneration, the prompt includes all other days' activities as context, preventing the AI from repeating activities already planned — this is the core of the **Smart Regenerate** creative feature

---

## Creative Feature — Smart Regenerate with Context Awareness

**Problem:** Most AI itinerary tools regenerate a day in isolation, often producing activities that duplicate what's already planned on other days. This creates a frustrating experience where the user has to manually check for repeats.

**Solution:** When a user regenerates a specific day with a custom instruction (e.g. "more outdoor activities"), the prompt explicitly passes all other days' activities to the AI and instructs it not to repeat them. The AI is also guided by the user's instruction, making the regenerated day both unique and personalized.

**Why it matters:** It's a small prompt engineering decision with a large UX impact. It shows awareness of how LLMs behave and how to design around their limitations.

---

## Key Design Decisions & Trade-offs

**Single LLM call per trip** — itinerary, budget, and hotels are generated together in one prompt. This keeps latency low and avoids multiple API calls. The trade-off is a slightly more complex prompt and response parsing.

**Structured JSON output** — the AI is instructed to return raw JSON only. This makes parsing reliable and avoids dealing with markdown-wrapped responses in most cases. A cleanup step strips any accidental code fences before parsing.

**Budget estimate is generated once** — the budget reflects typical travel costs at creation time based on destination, duration, and budget preference. It is not recalculated on itinerary edits, as it is a high-level estimate rather than a precise per-activity calculation.

**JWT in localStorage** — chosen for simplicity given the assessment scope. In production, httpOnly cookies would be more secure against XSS attacks.

---

## Known Limitations

- Budget estimate does not update when activities are added or removed
- No pagination on the dashboard for users with many trips
- Gemini free tier has rate limits — rapid consecutive requests may be throttled
- No email verification on registration

---

## Commit History

Development was done incrementally with meaningful commits reflecting the build order: project setup → auth → trip model → LLM service → trip routes → frontend auth → dashboard → trip form → itinerary view → deployment.
