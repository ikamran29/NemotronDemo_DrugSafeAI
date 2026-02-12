[README.md](https://github.com/user-attachments/files/25249286/README.md)
# 🛡️ DrugSafe AI — Drug Interaction Checker

**AI-powered drug interaction analysis built with NVIDIA Nemotron via NIM API + openFDA**

[![NVIDIA Nemotron](https://img.shields.io/badge/Powered%20by-NVIDIA%20Nemotron-76B900?style=for-the-badge&logo=nvidia)](https://developer.nvidia.com/nemotron)
[![NIM API](https://img.shields.io/badge/NVIDIA-NIM%20API-76B900?style=for-the-badge)](https://build.nvidia.com)
[![openFDA](https://img.shields.io/badge/Data-openFDA-0070C0?style=for-the-badge)](https://open.fda.gov)
[![GTC 2026](https://img.shields.io/badge/GTC%202026-Golden%20Ticket-gold?style=for-the-badge)](https://developer.nvidia.com/gtc-golden-ticket-contest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## What It Does

DrugSafe AI lets users input multiple medications and instantly receive an AI-powered analysis of potential drug-drug interactions, including:

- **Severity classification** (Major / Moderate / Minor)
- **Interaction mechanisms** (enzyme inhibition, additive effects, etc.)
- **Clinical significance** (what could happen to the patient)
- **Actionable recommendations** for clinicians
- **FDA adverse event data** showing real-world co-reported event counts

The app uses **NVIDIA Nemotron** as the reasoning engine via **NVIDIA NIM API**, grounded by three data sources: a curated drug database, **FDA-approved drug labels** (via openFDA), and **FDA Adverse Event Reporting System (FAERS)** data.

## Why Nemotron

Drug interaction analysis requires **multi-step clinical reasoning** — not just database lookup. Nemotron excels here because:

1. **Structured reasoning**: Analyzes pairwise interactions across CYP enzyme pathways, pharmacodynamic effects, and clinical context
2. **Instruction following**: Returns precisely formatted JSON for programmatic UI rendering
3. **Grounded analysis**: Reasons over real FDA label data and adverse event signals — not just training knowledge
4. **Domain knowledge**: Understands pharmacology, drug metabolism, and clinical significance
5. **Open model**: Fully transparent weights and training data — critical for healthcare AI trust

## Architecture

```
┌─────────────────────────────────────────────┐
│                  User Browser                │
│         Enter medications → See results      │
└──────────────────────┬──────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────┐
│              Flask Backend (Python)           │
│                                              │
│  1. Validate medication input                │
│  2. Look up drug metadata from local DB      │
│     (class, mechanism, CYP metabolism)        │
│  3. Query openFDA Drug Label API             │
│     → drug_interactions, warnings, MOA       │
│  4. Query openFDA FAERS Adverse Events       │
│     → co-occurrence counts per drug pair     │
│  5. Build grounded prompt with ALL data      │
│  6. Call NVIDIA NIM API (Nemotron)           │
│  7. Parse structured JSON response           │
│  8. Return enriched results to frontend      │
└────────┬───────────────────┬────────────────┘
         │                   │
    ┌────▼────┐    ┌────────▼─────────────┐
    │ openFDA │    │ NVIDIA NIM API        │
    │  (Free) │    │ integrate.api.nvidia  │
    │         │    │                       │
    │ • Drug  │    │ Model: Nemotron       │
    │   Labels│    │   Super 49B           │
    │ • FAERS │    │                       │
    │   Events│    │ • Reasons through     │
    └─────────┘    │   drug combinations   │
                   │ • Classifies severity │
                   │ • Generates clinical  │
                   │   recommendations     │
                   └───────────────────────┘
```

## Data Sources

| Source | What It Provides | API |
|---|---|---|
| **Local Drug DB** | Drug class, mechanism of action, CYP metabolism pathways for 20 common drugs | Built-in |
| **openFDA Drug Labels** | Official FDA-approved package insert data: drug interaction warnings, mechanism of action, clinical warnings | `api.fda.gov/drug/label.json` |
| **openFDA FAERS** | Real-world adverse event co-occurrence counts (how often two drugs are reported together in adverse events) | `api.fda.gov/drug/event.json` |
| **NVIDIA Nemotron** | AI reasoning over all the above data to produce structured interaction analysis | `integrate.api.nvidia.com/v1` |

All FDA data is fetched in real-time — no stale data. The openFDA API is free and requires no API key.

## Quick Start

### Option 1: Run on Replit (Recommended)
1. Fork this project on Replit
2. Add your NVIDIA API key as a Secret: `NVIDIA_API_KEY` = your key from [build.nvidia.com](https://build.nvidia.com)
3. Click **Run** — that's it!

### Option 2: Run Locally
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/drugsafe-ai.git
cd drugsafe-ai

# Install dependencies
pip install flask

# Set your NVIDIA NIM API key
export NVIDIA_API_KEY="nvapi-your-key-here"

# Run the app
python app.py
```

Then open `http://localhost:5000` in your browser.

## Getting Your NVIDIA API Key (Free)

1. Go to [build.nvidia.com](https://build.nvidia.com)
2. Create a free account
3. Navigate to any Nemotron model
4. Click "Get API Key" → "Generate Key"
5. Copy the key (starts with `nvapi-`)
6. Add it as your `NVIDIA_API_KEY` environment variable

## NVIDIA Technology Used

| Technology | Role |
|---|---|
| **NVIDIA Nemotron** (Llama 3.3 Nemotron Super 49B) | Core reasoning engine for drug interaction analysis |
| **NVIDIA NIM API** | Hosted inference endpoint — no GPU required |
| **OpenAI-compatible API** | Standard interface via `integrate.api.nvidia.com` |

## How the Prompt Works

Each query builds a rich, grounded prompt for Nemotron that includes:

1. **Local database metadata** — drug class, mechanism, CYP enzyme pathways
2. **FDA drug label data** — official interaction warnings, mechanism of action, clinical warnings pulled live from openFDA
3. **FDA adverse event counts** — real-world signal data showing how often two drugs appear together in FAERS reports
4. **Structured output instructions** — forces Nemotron to return parseable JSON with severity, mechanism, clinical significance, and recommendations

This grounding approach means Nemotron reasons over real pharmacological and regulatory data rather than relying solely on its training knowledge.

## Drug Database

The local database includes 20 commonly prescribed medications with metadata: Warfarin, Aspirin, Omeprazole, Lisinopril, Metformin, Atorvastatin, Metoprolol, Amlodipine, Sertraline, Gabapentin, Levothyroxine, Ibuprofen, Amoxicillin, Hydrochlorothiazide, Prednisone, Clopidogrel, Fluoxetine, Tramadol, Ciprofloxacin, and Alprazolam.

**Any drug can be analyzed** — drugs not in the local database are still looked up via the openFDA API and analyzed using Nemotron's training knowledge.

## Project Structure

```
drugsafe-ai/
├── app.py                 # Flask backend + NIM API + openFDA integration
├── templates/
│   └── index.html         # Frontend UI (single-file, no build step)
├── README.md              # This file
├── SETUP_INSTRUCTIONS.md  # Replit setup guide + contest submission checklist
├── LICENSE                # MIT License
├── .replit                # Replit configuration
└── replit.nix             # Nix dependencies for Replit
```

## Medical Disclaimer

⚠️ **DrugSafe AI is an educational tool and demonstration of NVIDIA Nemotron's capabilities. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a licensed pharmacist or physician before making any medication decisions. AI-generated analysis may contain inaccuracies. FDA data is provided for informational purposes only.**

## Contest Entry

This project is submitted for the [GTC 2026 Golden Ticket Developer Contest](https://developer.nvidia.com/gtc-golden-ticket-contest).

**#NVIDIAGTC** — Built with NVIDIA Nemotron models and NVIDIA NIM.

## License

MIT License — see [LICENSE](LICENSE) for details.
