# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgroSistem is a full-stack agricultural management and APIA reporting application (Romanian agriculture). It handles crop tracking, work operations, harvest distribution, fuel management, and GAEC 7 compliance reporting.

**Language**: The application UI and all domain terms are in Romanian.

## Tech Stack

- **Backend**: Node.js + Express 5 + Sequelize ORM + PostgreSQL
- **Frontend**: React 18 (single-file SPA in `frontend/src/App.js` — ~1525 lines, all inline styles) + xlsx (SheetJS) for Excel export
- **Auth**: JWT (stateless, Bearer token in Authorization header)
- **Build**: react-scripts (CRA)

## Development Commands

```bash
# Backend (port 5001)
cd backend && npm install
npm run dev          # with nodemon
npm start            # without nodemon (node server.js)

# Frontend (port 3001, separate terminal)
cd frontend && npm install
npm start            # react-scripts start

# Production build (backend serves frontend)
cd frontend && npm run build
cd ../backend && node server.js
```

There are no tests configured — `npm test` in backend exits with error by design.

## Architecture

### Backend (`backend/`)

- **Entry**: `server.js` — Express server, Sequelize sync (`alter: true`), seeds default crops/work types, serves frontend build in production
- **Config**: `config/db.js` (Sequelize/PostgreSQL), `config/initCrops.js` and `config/initWorkTypes.js` (seed data on startup)
- **Auth middleware**: `middleware/authMiddleware.js` — all routes except `/api/auth` are protected
- **Models**: `models/index.js` defines all relationships:
  - User → Farm → Block → Parcel → ParcelSeason → Work/Harvest
  - Farm also owns HarvestSession and FuelEntry
  - Crop and WorkType are reference tables
- **Controllers/Routes**: 10 resource pairs (auth, farm, block, parcel, crop, parcelSeason, work, harvest, fuel, report)

### Frontend (`frontend/src/`)

- **Single component**: `App.js` contains everything — UI components (Card, Btn, Input, Select, Table, ParcelMap, etc.), state management, API calls, and all 10 tabs
- **Tabs**: Dashboard, Terenuri (land), Culturi (crops), Lucrări (works), Fișe Tehnice (tech sheets), Recoltare (harvest), Rapoarte APIA (reports), Reg. Fermier (Form 013), Reg. Exploatație (Form 001), Motorină (fuel)
- **Excel export**: `exportExcel()` and `exportExcelMultiHeader()` helpers using SheetJS (xlsx) with merged header cells
- **State**: React useState/useCallback/useMemo, localStorage for token and user persistence (`agrosistem_user`, `agrosistem_token`)
- **Styling**: All CSS via inline `style` props using a color palette object `C`

### Key Domain Logic

- **Crop rotation warnings**: Alerts when same crop is assigned to same parcel in consecutive years
- **GAEC 7 verification**: Validates crop diversity rules (main crop ≤75% for farms >10 ha)
- **Harvest distribution**: Proportionally distributes harvest sessions across parcels by area
- **APIA reports**: Generates compliance declarations with crop diversity analysis
- **Registrul Fermierului (Form 013)**: Per-parcel detail register — fertilization, treatment, seeding, maintenance, harvest, production KG/HA
- **Registrul Exploatației (Form 001)**: Per-parcel crop rotation register — primary, secondary, successive, and winter crops with work periods

## API Pattern

All API calls from frontend use a helper `api(url, options)` that prepends the base URL and attaches the JWT token. Backend endpoints follow REST conventions under `/api/{resource}`.

### Report Endpoints

- `GET /api/reports/apia/:farmId/:year` — APIA declaration with GAEC 7 compliance
- `GET /api/reports/registru-fermier/:farmId/:year` — Form 013 (Registrul Fermierului)
- `GET /api/reports/registru-exploatatie/:farmId/:year` — Form 001 (Registrul Exploatației)

## Environment Variables

Backend `.env`: `PORT`, `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`, `NODE_ENV`, `JWT_SECRET`
Frontend `.env`: `PORT=3001`

For deployment (Render.com), backend uses `DATABASE_URL` connection string instead of individual DB vars.
