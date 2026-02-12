# DrugSafe AI - Drug Interaction Checker

## Overview
DrugSafe AI is an AI-powered drug interaction checker built with NVIDIA Nemotron via NIM API. Users input multiple medications and receive instant analysis of potential drug-drug interactions including severity classification, interaction mechanisms, clinical significance, and actionable recommendations.

## Architecture
- **Frontend**: React + TypeScript with Tailwind CSS, dark-themed medical UI
- **Backend**: Express.js server with NVIDIA NIM API integration
- **AI Model**: NVIDIA Llama 3.3 Nemotron Super 49B via NIM API
- **No Database**: Uses in-memory drug database (20 common medications)

## Project Structure
```
client/src/
  pages/home.tsx          - Main page with drug input, results display
  App.tsx                 - Root app component with routing
  index.css               - Theme tokens and utility classes

server/
  routes.ts               - API endpoints (/api/check, /api/drugs, /api/health)
  storage.ts              - Drug database with 20 medications

shared/
  schema.ts               - TypeScript types and Zod schemas
```

## Key Features
- Tag-based medication input with autocomplete
- Quick-add buttons for common medications
- NVIDIA Nemotron-powered interaction analysis
- Risk banner (critical/high/moderate/low)
- Expandable interaction cards with severity classification
- Medical disclaimer

## Environment
- `NVIDIA_API_KEY` - Required secret for NVIDIA NIM API access
- Dark mode only (class="dark" on html element)
- Fonts: DM Sans, Playfair Display, JetBrains Mono

## Recent Changes
- 2026-02-12: Initial implementation of DrugSafe AI
