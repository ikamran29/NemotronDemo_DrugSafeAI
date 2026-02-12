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
├── app.py                  ← Main backend (copy from app.py)
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

Create a Python Flask web app called "DrugSafe AI" - a drug interaction checker powered by NVIDIA Nemotron via NIM API.

**Requirements:**
- Python Flask backend with a single `app.py`
- Single-page HTML frontend in `templates/index.html` 
- No additional Python dependencies beyond Flask (uses urllib for API calls)
- Environment variable `NVIDIA_API_KEY` for the NVIDIA NIM API key

**Backend (app.py) must have:**
1. A drug database dictionary with 20 common medications, each containing: drug class, mechanism of action, CYP metabolism pathways, and common uses
2. A `/api/check` POST endpoint that:
   - Accepts `{"medications": ["Drug1", "Drug2", ...]}` 
   - Builds a structured prompt including drug metadata from the local database
   - Calls NVIDIA NIM API at `https://integrate.api.nvidia.com/v1/chat/completions`
   - Uses model `nvidia/llama-3.3-nemotron-super-49b-v1`
   - Sends Authorization header with Bearer token from NVIDIA_API_KEY env var
   - Asks Nemotron to analyze all pairwise drug interactions and return JSON with: drug pair, severity (major/moderate/minor), interaction type, mechanism, clinical significance, and recommendation
   - Returns parsed JSON to frontend
3. A `/api/drugs` GET endpoint returning the list of drugs in the database
4. A `/api/health` GET endpoint

**Frontend (templates/index.html) must have:**
- Dark theme medical UI with NVIDIA green (#76B900) accents
- Tag-based medication input (type name, press Enter to add as chip)
- Autocomplete dropdown from the drug database
- Quick-add buttons for common drugs
- Loading state while Nemotron processes
- Results display with:
  - Risk banner (critical/high/moderate/low) based on overall risk_score
  - Stats cards showing count of major/moderate/minor interactions
  - Expandable interaction cards sorted by severity, each showing mechanism, clinical significance, and recommendation
  - Color-coded severity (red=major, amber=moderate, blue=minor)
- Medical disclaimer
- "Powered by NVIDIA Nemotron via NIM" branding
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
4. Click on any Nemotron model (e.g., Llama 3.3 Nemotron Super 49B)
5. In the code example panel, click **"Get API Key"** → **"Generate Key"**
6. Copy the key — it starts with `nvapi-`
7. Paste it as your `NVIDIA_API_KEY` secret in Replit

You get free credits — no payment required for prototyping!

---

## Contest Submission Checklist

Before February 15, 2026:

- [ ] App is running on Replit with a public URL
- [ ] Code is pushed to a public GitHub repo
- [ ] Post on social media (X/Twitter or LinkedIn):
  - Tag **@bryancatanzaro** (Bryan Catanzaro, NVIDIA VP)
  - Include **#NVIDIAGTC**
  - Include your Replit demo link and GitHub repo link
  - Briefly describe what it does and that it uses NVIDIA Nemotron + NIM

**Example post:**
```
🛡️ Built DrugSafe AI — an AI-powered drug interaction checker using @NVIDIA Nemotron via NIM API.

Enter your medications → get instant analysis of interactions, severity, mechanisms & clinical recommendations.

Nemotron's reasoning capabilities make it perfect for multi-step clinical analysis.

🔗 Live demo: [your-replit-url]
📂 Open source: [your-github-url]

@bryancatanzaro #NVIDIAGTC
```
