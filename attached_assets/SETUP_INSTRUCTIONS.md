# 🚀 REPLIT SETUP INSTRUCTIONS FOR DRUGSAFE AI

## Step-by-Step Setup on Replit

### Step 1: Create a New Repl
1. Go to replit.com and click "Create Repl"
2. Choose **Python** as the template
3. Name it: `drugsafe-ai`

### Step 2: Create the Files
Create these files in your Repl with the exact contents from the project:

```
drugsafe-ai/
├── app.py                  ← Main backend + openFDA + NIM API (copy from app.py)
├── templates/
│   └── index.html          ← Frontend UI (copy from templates/index.html)
├── README.md               ← Project docs (copy from README.md)
├── LICENSE                  ← MIT License (copy from LICENSE)
├── .replit                  ← Already configured
└── replit.nix               ← Already configured
```

**IMPORTANT**: You need to create the `templates` folder first, then put `index.html` inside it.

### Step 3: Add Your NVIDIA API Key
1. In Replit, click the **Secrets** tab (🔒 lock icon in left sidebar)
2. Add a new secret:
   - **Key**: `NVIDIA_API_KEY`
   - **Value**: Your API key from build.nvidia.com (starts with `nvapi-`)
3. Click "Add Secret"

No API key needed for openFDA — it's free and open.

### Step 4: Install Flask
In the Replit Shell, run:
```
pip install flask
```

### Step 5: Run It!
Click the green **Run** button. The app will start on port 5000 and Replit will give you a live URL.

---

## Replit Agent Prompt (paste this if using Replit AI Agent)

If you want to use Replit's AI Agent to set this up automatically, paste this prompt:

---

Create a Python Flask web app called "DrugSafe AI" - a drug interaction checker powered by NVIDIA Nemotron via NIM API with live FDA data from openFDA.

**Requirements:**
- Python Flask backend with a single `app.py`
- Single-page HTML frontend in `templates/index.html` 
- No additional Python dependencies beyond Flask (uses urllib for API calls)
- Environment variable `NVIDIA_API_KEY` for the NVIDIA NIM API key
- No API key needed for openFDA (free, open access)

**Backend (app.py) must have:**
1. A drug database dictionary with 20 common medications, each containing: drug class, mechanism of action, CYP metabolism pathways, and common uses
2. An `fetch_fda_drug_info(drug_name)` function that:
   - Queries `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"DRUG"&limit=1`
   - Extracts: drug_interactions, warnings, mechanism_of_action, indications_and_usage, brand_name, generic_name
   - Returns a dict with the data (graceful fallback if not found)
3. A `fetch_fda_adverse_events(drug1, drug2)` function that:
   - Queries `https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:"DRUG1"+AND+patient.drug.openfda.generic_name:"DRUG2"&limit=1`
   - Returns the total count of co-reported adverse events from meta.results.total
4. A `/api/check` POST endpoint that:
   - Accepts `{"medications": ["Drug1", "Drug2", ...]}` 
   - Builds a structured prompt including: local drug DB metadata, FDA drug label data, FDA adverse event co-occurrence counts
   - Calls NVIDIA NIM API at `https://integrate.api.nvidia.com/v1/chat/completions`
   - Uses model `nvidia/llama-3.3-nemotron-super-49b-v1`
   - Asks Nemotron to analyze all pairwise drug interactions grounded in the provided data
   - Returns JSON with: interactions (drug pair, severity, type, mechanism, clinical significance, recommendation), summary, risk_score, data_sources
5. A `/api/drugs` GET endpoint returning the list of drugs in the database
6. A `/api/health` GET endpoint

**Frontend (templates/index.html) must have:**
- Dark theme medical UI with NVIDIA green (#76B900) accents
- Persistent medical disclaimer above input (visible before any interaction)
- Tag-based medication input (type name, press Enter to add as chip)
- Autocomplete dropdown from the drug database
- Quick-add buttons for common drugs
- Loading state while Nemotron processes
- Results display with:
  - Risk banner (critical/high/moderate/low) based on overall risk_score
  - Stats cards showing count of major/moderate/minor interactions
  - Expandable interaction cards sorted by severity, each showing mechanism, clinical significance, and recommendation
  - Color-coded severity (red=major, amber=moderate, blue=minor)
- Medical disclaimer in results showing model used and data sources
- "Powered by NVIDIA Nemotron via NIM" and openFDA branding
- Fully responsive, single-file HTML with embedded CSS and JS
- Uses Google Fonts: DM Sans, JetBrains Mono, Playfair Display

**NVIDIA NIM API call format:**
```python
import urllib.request
import json

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {NVIDIA_API_KEY}"
}

payload = json.dumps({
    "model": "nvidia/llama-3.3-nemotron-super-49b-v1",
    "messages": [
        {"role": "system", "content": "You are a clinical pharmacology expert..."},
        {"role": "user", "content": prompt}
    ],
    "temperature": 0.2,
    "max_tokens": 4096
})

req = urllib.request.Request(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    data=payload.encode("utf-8"),
    headers=headers,
    method="POST"
)
```

Add `NVIDIA_API_KEY` as a Replit Secret. The app should run on port 5000.

---

## Getting Your NVIDIA API Key

1. Go to https://build.nvidia.com
2. Create a free account (or sign in)
3. Search for "Nemotron" in the model catalog
4. Click on the Llama 3.3 Nemotron Super 49B model
5. In the code example panel, click **"Get API Key"** → **"Generate Key"**
6. Copy the key — it starts with `nvapi-`
7. Paste it as your `NVIDIA_API_KEY` secret in Replit

You get free credits — no payment required for prototyping!

---

## Testing the App

Run these test cases after setup:

| Test | Drugs | Expected |
|---|---|---|
| High-risk combo | Warfarin + Aspirin | Major severity — bleeding risk |
| Multi-drug | Warfarin + Aspirin + Omeprazole | Multiple interactions, mixed severity |
| Serotonin syndrome | Sertraline + Tramadol | Major — serotonin syndrome risk |
| CYP enzyme conflict | Fluoxetine + Metoprolol | CYP2D6 inhibition, elevated metoprolol |
| Low risk | Metformin + Gabapentin | Low risk / no significant interactions |
| Unknown drug | Warfarin + Acetaminophen | Should still work via FDA data + model knowledge |
| Polypharmacy | Metformin + Lisinopril + Atorvastatin + Metoprolol | Typical cardio patient, mostly minor/moderate |

---

## Contest Submission Checklist

Before **February 15, 2026**:

- [ ] App is running on Replit with a public URL
- [ ] Code is pushed to a public GitHub repo
- [ ] Post on social media (X/Twitter or LinkedIn):
  - Tag **@bryancatanzaro** (Bryan Catanzaro, NVIDIA VP)
  - Include **#NVIDIAGTC**
  - Include your Replit demo link and GitHub repo link
  - Briefly describe what it does and that it uses NVIDIA Nemotron + NIM

**Example post:**
```
🛡️ Built DrugSafe AI — an AI-powered drug interaction checker using
@NVIDIA Nemotron via NIM API + live FDA data from openFDA.

Enter medications → get instant analysis of interactions, severity,
mechanisms & clinical recommendations — grounded in real FDA label
data and adverse event reports.

🔗 Live demo: [your-replit-url]
📂 Open source: [your-github-url]

@bryancatanzaro #NVIDIAGTC
```
