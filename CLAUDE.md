# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web application for managing attendance and statistics for the **École du Sabat** (Adventist Bible School). Tracks weekly presence (Sabbat = Saturday), learning frequency, and global statistics per class and per quarter.

Both **backend** (`backend/` — NestJS + Prisma + PostgreSQL) and **frontend** (`frontend/` — Next.js App Router + Redux Toolkit + TailwindCSS v4) are implemented and functional.

## Commands

### Backend — run from `backend/`

```bash
# Development
npm run start:dev       # Run with ts-node (no build needed)
npm run build           # Compile to dist/
npm run start           # Run compiled output

# Database
npm run prisma:migrate  # Run migrations (creates DB tables)
npm run prisma:generate # Regenerate Prisma client after schema change
npm run seed            # Seed initial data (5 global questions, sample data)
npm run db:setup        # migrate + seed in one step

# Code quality
npm run lint            # ESLint --fix
npm test                # Jest unit tests
```

Backend runs on `http://0.0.0.0:3001` (LAN-accessible — intentional for local network deployment).

### Frontend — run from `frontend/`

```bash
npm run dev        # Development server (Next.js)
npm run build      # Production build
npm run lint       # ESLint
```

Frontend runs on `http://localhost:3000` (or LAN IP for mobile devices).
Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to the backend's LAN IP.

## Architecture

### Module structure

Each feature is a self-contained NestJS module under `src/`:

| Module | Responsibility |
|---|---|
| `auth/` | JWT login, guards (`JwtAuthGuard`, `RolesGuard`, `ClasseAccessGuard`), decorators (`@CurrentUser`, `@Roles`) |
| `utilisateurs/` | User CRUD — ADMIN, RESPONSABLE, MEMBRE accounts |
| `classes/` | Class CRUD; endpoint to list users unassigned to any class |
| `registres/` | Annual registry management (one per year) |
| `appels/` | Attendance sessions — creation, update, delete; emits WebSocket events |
| `dashboard/` | Read-only statistics aggregations (avg learning freq, top 5 classes) |
| `questions-globales/` | Full CRUD for global questions (ADMIN only); read-only for other roles |
| `calendrier/` | Utility to calculate which months have 5 Sabbats (Saturdays) |
| `realtime/` | Socket.IO gateway on `/realtime`; rooms `classe:{id}` and `admin` |
| `prisma/` | PrismaService wrapper (global module) |

### Request lifecycle

`Request → JwtAuthGuard → RolesGuard → ClasseAccessGuard (RESPONSABLE routes) → Controller → Service → Prisma → (optionally) RealtimeGateway`

Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` is applied at app bootstrap.

### Real-time

After each `appel` create/update/delete, the service calls `RealtimeGateway` which emits:
- `appel:created` / `appel:updated` / `appel:deleted` to room `classe:{classeId}`
- `dashboard:refresh` to room `admin`

## Business Rules

**Roles:**
- `ADMIN` — full access to all data
- `RESPONSABLE` — scoped to their own class only (`ClasseAccessGuard` enforces this); must have `classeId` on their user record
- `MEMBRE` — no login (email and password are null in DB); attendance-only entity

**Appel uniqueness:** `(classeId, trimestre, mois, sabbat)` is unique. Creating a duplicate returns an error that includes the existing record's id.

**Sabbat 5:** Only exists in months that have 5 Saturdays — `calendrier` module calculates this.

**Learning frequency:** Stored as integer 1–7 (days/week), `null` when not provided (never 0). Dashboard taux = `avg(frequenceApprentissage / 7)` over **present** members only.

**1 RESPONSABLE = 1 class** (via `classeId` on Utilisateur), but a class can have multiple responsables.

## Key Constraints

- `backend/.env` contains `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT` — required to run
- CORS is open (`origin: '*'`) — intentional for LAN use, not production internet
- `frontend/.env.local` must have `NEXT_PUBLIC_API_URL` pointing to the backend's LAN IP (not `localhost`)
- Prettier: single quotes, trailing commas; enforced by ESLint
- Dark mode: class-based (`dark` on `<html>`), TailwindCSS v4 `@custom-variant dark (&:where(.dark, .dark *))`
- i18n: `lib/i18n.tsx` — `LanguageProvider` wraps `app/(admin)/layout.tsx`; `useT()` in any client component

## Documentation

Specifications are in `docs/` (French):
- `01-cahier-des-charges.md` — functional requirements & scope
- `02-modele-donnees.md` — ER diagram & data model rules
- `03-architecture-technique.md` — technical stack & API endpoint list
- `04-specifications-fonctionnelles.md` — detailed feature specs
