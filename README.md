# Volleyball Live Scorekeeper

A real-time volleyball scorekeeping app built for UCSB Men's Club Volleyball. A scorekeeper logs plays courtside from their phone — points, kills, aces, blocks, errors — and anyone with the link sees the score update live, with no refresh, like a live sports ticker.

Live app: https://volleyball-tracker-psi.vercel.app
Backend API: https://volleyball-tracker-production-c8eb.up.railway.app

## Features

- Live scorekeeping — log attacks, serves, and blocks with correct win/error attribution, updating the score in real time
- Real-time sync — powered by Socket.io; every connected device watching a set sees updates instantly, no polling or manual refresh
- Automatic match logic — sets complete at 25 points (win by 2), matches complete based on a configurable best-of-1/3/5 format, all enforced on the backend
- Undo — reverses the last logged action, correctly rolling back score changes and set/match completion state if needed
- Player statistics — hitting %, ace %, service error %, and block % calculated live from raw play-by-play data, viewable career-wide or per match
- Dedicated viewer screen — a read-only live scoreboard for teammates and spectators, separate from the scorekeeper's controls
- Roster management — add/edit players with jersey numbers and positions

## Tech stack

- Frontend: React (Vite), Socket.io-client
- Backend: Node.js, Express, Socket.io
- Database: PostgreSQL
- Deployment: Vercel (frontend), Railway (backend + database)

## Architecture

The app follows a standard client/server model with a WebSocket layer added for real-time updates:

- REST API handles all CRUD operations (matches, players, sets, actions) and encapsulates scoring/completion business logic in the backend, not the client
- Socket.io rooms scope real-time broadcasts to a specific set, so multiple concurrent matches don't cross-contaminate updates
- PostgreSQL schema uses foreign keys to model relationships (action to set to match, action to player), with nullable player_id on action to represent opponent-scored plays

## Running locally

Backend:
cd server
npm install
(create a .env file based on .env.example)
node index.js

Frontend:
cd client
npm install
(create a .env file based on .env.example)
npm run dev

## Future improvements

- Multi-team support — scope matches/players/rosters to a team table, so multiple teams can use the app without seeing each other's data
- Authentication — login system to support multi-team access control, likely building on a TOTP (2FA) implementation as a follow-up learning project
- Database transactions — wrap multi-step operations (scoring, undo) in proper BEGIN/COMMIT/ROLLBACK transactions to guarantee atomicity
- Additional edge-case handling — prevent duplicate set numbers, add richer validation on match/player creation

## About this project

Built as a way to learn full-stack development hands-on — React, Express, PostgreSQL, WebSockets, and deployment — while building something genuinely usable for my own club volleyball team.
