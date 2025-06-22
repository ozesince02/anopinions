# Anonymous Chat App

A real-time, anonymous chat app built with Express, Socket.IO, and PostgreSQL.

## Features
- Unique room links (`/room/:code`)
- Anonymous “Badmos N” user names
- Persistent message history in PostgreSQL
- Identity preserved across page refresh (via localStorage)

## Setup
1. Copy `.env.example` to `.env` and fill in your PG credentials.
2. `npm install`
3. `npm run dev`
4. Visit `http://localhost:3000/`

# .gitignore
.gitignore
node_modules/
.env
npm-debug.log*
