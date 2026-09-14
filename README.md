# Dream Stage — AI Artist Discovery & Booking Platform

Dream Stage is a third-party artist × event network for connecting performers with event organisers across India.

## Core product
- Artists can join the platform and maintain their own bio, stage name, genres, fee, experience, profile tags and availability.
- Event managers can create events for music, stand-up comedy, open mics, clubbing/DJs, celebrity appearances, corporate events, weddings, festivals and more.
- Managers can edit any event they created, including date, time, location, genre, budget and description.
- Managers can remove their own events. Removal is a soft cancellation so booking records remain auditable.
- Booking integrity uses a two-step approval: artist accepts first, then the event manager confirms.
- Artists can cancel a confirmed performance only when more than 24 hours remain before the event.
- After a completed event, the manager can submit a 1–5 rating, written feedback, tags and an optional flag/reason against the artist.
- The public landing page explains the marketplace and the neutral third-party role between artists and organisers.
- GROQ AI matching remains optional; deterministic fallback matching works when the free-tier API quota is exhausted.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- AI: GROQ
- REST APIs

## Run

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

Backend: http://localhost:5000

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Important API additions

### Events
- `POST /api/events` — create
- `PATCH /api/events/:id` — edit an event created by the manager
- `DELETE /api/events/:id` — remove/cancel an event created by the manager

### Artist profile
- `PATCH /api/artists/me` — artist updates their profile
- `GET /api/artists/:id/feedback` — view manager feedback history

### Bookings
- `PATCH /api/bookings/:id/cancel` — artist cancellation, enforced server-side at >24 hours before event
- `POST /api/bookings/:id/feedback` — manager post-event rating/feedback/tags/flag

## Demo accounts
- Manager: `manager@dreamstage.com` / `password123`
- Artist: `arjun@dreamstage.com` / `password123`

Do not present the seeded fictional artists as real Dream Stage artists.
