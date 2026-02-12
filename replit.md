# DrugSafe AI - Drug Interaction Checker

## Overview
DrugSafe AI is an AI-powered drug interaction checker built with NVIDIA Nemotron via NIM API. Users input multiple medications and receive instant analysis of potential drug-drug interactions including severity classification, interaction mechanisms, clinical significance, and actionable recommendations.

## Architecture
- **Frontend**: Static HTML with vanilla JavaScript, dark-themed medical UI with NVIDIA green accents
- **Backend**: Express.js server with NVIDIA NIM API + openFDA API integration
- **AI Model**: NVIDIA Llama 3.3 Nemotron Super 49B via NIM API
- **Data Sources**: In-memory drug database (20 medications), openFDA Drug Labels, FDA FAERS Adverse Events
- **No Database**: Uses in-memory drug database (no PostgreSQL)

## Project Structure
```
client/
  index.html              - Self-contained static HTML with inline CSS and JavaScript

server/
  routes.ts               - API endpoints (/api/check, /api/drugs, /api/health) + openFDA integration
  storage.ts              - Drug database with 20 medications

shared/
  schema.ts               - TypeScript types and Zod schemas
```

## Key Features
- Tag-based medication input with autocomplete
- Quick-add buttons for common medications
- NVIDIA Nemotron-powered interaction analysis
- openFDA integration (drug labels + adverse event co-occurrence data)
- Risk banner (critical/high/moderate/low)
- Expandable interaction cards with severity classification
- Data sources tracking (Local DB, openFDA Drug Labels, FDA FAERS)
- Medical disclaimer

## Environment
- `NVIDIA_API_KEY` - Required secret for NVIDIA NIM API access
- Dark mode only (class="dark" on html element)
- Fonts: DM Sans, Playfair Display, JetBrains Mono

## Recent Changes
- 2026-02-12: Added openFDA API integration (drug labels + adverse event data)
- 2026-02-12: Replaced React frontend with static HTML/CSS/JS
- 2026-02-12: Initial implementation of DrugSafe AI
