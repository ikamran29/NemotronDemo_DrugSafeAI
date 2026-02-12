"""
DrugSafe AI - Drug Interaction Checker powered by NVIDIA Nemotron
Built with NVIDIA NIM API for the GTC 2026 Golden Ticket Contest
"""

import os
import json
import re
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# ---------------------------------------------------------------------------
# NVIDIA NIM Configuration
# ---------------------------------------------------------------------------
NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "")
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
# Using Nemotron model via NIM - this is the key contest requirement
NEMOTRON_MODEL = "nvidia/llama-3.3-nemotron-super-49b-v1"

# ---------------------------------------------------------------------------
# Common drug database (curated subset for demo — real app would use full FDA/DrugBank)
# ---------------------------------------------------------------------------
DRUG_DATABASE = {
    "warfarin": {
        "class": "Anticoagulant",
        "mechanism": "Vitamin K antagonist; inhibits clotting factors II, VII, IX, X",
        "common_uses": "Blood clot prevention, atrial fibrillation, DVT, PE",
        "metabolism": "CYP2C9, CYP3A4, CYP1A2"
    },
    "aspirin": {
        "class": "NSAID / Antiplatelet",
        "mechanism": "Irreversibly inhibits COX-1 and COX-2; blocks thromboxane A2",
        "common_uses": "Pain relief, fever reduction, cardiovascular protection",
        "metabolism": "Hepatic hydrolysis, CYP2C9"
    },
    "omeprazole": {
        "class": "Proton Pump Inhibitor (PPI)",
        "mechanism": "Irreversibly inhibits H+/K+ ATPase in gastric parietal cells",
        "common_uses": "GERD, peptic ulcer disease, H. pylori eradication",
        "metabolism": "CYP2C19, CYP3A4"
    },
    "lisinopril": {
        "class": "ACE Inhibitor",
        "mechanism": "Inhibits angiotensin-converting enzyme, reducing angiotensin II",
        "common_uses": "Hypertension, heart failure, post-MI",
        "metabolism": "Not hepatically metabolized; renally excreted"
    },
    "metformin": {
        "class": "Biguanide",
        "mechanism": "Decreases hepatic glucose production, increases insulin sensitivity",
        "common_uses": "Type 2 diabetes mellitus",
        "metabolism": "Not metabolized; renally excreted unchanged"
    },
    "atorvastatin": {
        "class": "HMG-CoA Reductase Inhibitor (Statin)",
        "mechanism": "Inhibits HMG-CoA reductase, reducing cholesterol synthesis",
        "common_uses": "Hyperlipidemia, cardiovascular risk reduction",
        "metabolism": "CYP3A4"
    },
    "metoprolol": {
        "class": "Beta-1 Selective Blocker",
        "mechanism": "Blocks beta-1 adrenergic receptors in the heart",
        "common_uses": "Hypertension, angina, heart failure, post-MI",
        "metabolism": "CYP2D6"
    },
    "amlodipine": {
        "class": "Calcium Channel Blocker (Dihydropyridine)",
        "mechanism": "Blocks L-type calcium channels in vascular smooth muscle",
        "common_uses": "Hypertension, angina",
        "metabolism": "CYP3A4"
    },
    "sertraline": {
        "class": "SSRI (Selective Serotonin Reuptake Inhibitor)",
        "mechanism": "Inhibits serotonin reuptake in the synaptic cleft",
        "common_uses": "Depression, anxiety, OCD, PTSD, panic disorder",
        "metabolism": "CYP2B6, CYP2C19, CYP3A4, CYP2D6"
    },
    "gabapentin": {
        "class": "Anticonvulsant / Analgesic",
        "mechanism": "Binds alpha-2-delta subunit of voltage-gated calcium channels",
        "common_uses": "Neuropathic pain, epilepsy, restless leg syndrome",
        "metabolism": "Not metabolized; renally excreted unchanged"
    },
    "levothyroxine": {
        "class": "Thyroid Hormone",
        "mechanism": "Synthetic T4; converted to active T3 in peripheral tissues",
        "common_uses": "Hypothyroidism, thyroid cancer (TSH suppression)",
        "metabolism": "Deiodination in liver, kidney, and other tissues"
    },
    "ibuprofen": {
        "class": "NSAID",
        "mechanism": "Non-selective COX-1 and COX-2 inhibitor",
        "common_uses": "Pain, inflammation, fever",
        "metabolism": "CYP2C9, CYP2C19"
    },
    "amoxicillin": {
        "class": "Aminopenicillin (Beta-Lactam Antibiotic)",
        "mechanism": "Inhibits bacterial cell wall synthesis by binding PBPs",
        "common_uses": "Upper/lower respiratory infections, UTI, H. pylori",
        "metabolism": "Hepatic (partial); renally excreted"
    },
    "hydrochlorothiazide": {
        "class": "Thiazide Diuretic",
        "mechanism": "Inhibits Na+/Cl- cotransporter in distal convoluted tubule",
        "common_uses": "Hypertension, edema",
        "metabolism": "Not metabolized; renally excreted unchanged"
    },
    "prednisone": {
        "class": "Corticosteroid",
        "mechanism": "Converted to prednisolone; modulates gene transcription via glucocorticoid receptor",
        "common_uses": "Inflammatory conditions, autoimmune disorders, asthma exacerbations",
        "metabolism": "CYP3A4 (converted to prednisolone in liver)"
    },
    "clopidogrel": {
        "class": "Antiplatelet (P2Y12 Inhibitor)",
        "mechanism": "Irreversibly blocks P2Y12 ADP receptor on platelets",
        "common_uses": "ACS, recent MI/stroke, peripheral artery disease, stent placement",
        "metabolism": "CYP2C19, CYP3A4, CYP1A2"
    },
    "fluoxetine": {
        "class": "SSRI",
        "mechanism": "Inhibits serotonin reuptake; strong CYP2D6 inhibitor",
        "common_uses": "Depression, OCD, bulimia nervosa, panic disorder",
        "metabolism": "CYP2D6, CYP2C9"
    },
    "tramadol": {
        "class": "Opioid Analgesic (Atypical)",
        "mechanism": "Mu-opioid receptor agonist + serotonin/norepinephrine reuptake inhibitor",
        "common_uses": "Moderate to moderately severe pain",
        "metabolism": "CYP2D6, CYP3A4"
    },
    "ciprofloxacin": {
        "class": "Fluoroquinolone Antibiotic",
        "mechanism": "Inhibits bacterial DNA gyrase and topoisomerase IV",
        "common_uses": "UTI, respiratory infections, GI infections",
        "metabolism": "CYP1A2 inhibitor; partially hepatic, renally excreted"
    },
    "alprazolam": {
        "class": "Benzodiazepine",
        "mechanism": "Enhances GABA-A receptor activity",
        "common_uses": "Anxiety disorders, panic disorder",
        "metabolism": "CYP3A4"
    }
}


# ---------------------------------------------------------------------------
# openFDA Integration
# ---------------------------------------------------------------------------
def fetch_fda_drug_info(drug_name: str) -> dict:
    """
    Fetch drug label data from openFDA API.
    Returns drug interactions section and other relevant labeling info.
    No API key required for basic usage (limit: 240 requests/min without key).
    """
    import urllib.request
    import urllib.error
    import urllib.parse

    result = {
        "found": False,
        "brand_name": None,
        "generic_name": None,
        "drug_interactions": None,
        "warnings": None,
        "indications_and_usage": None,
        "mechanism_of_action": None
    }

    try:
        # Search by generic name first (most reliable), fallback to brand
        encoded = urllib.parse.quote(drug_name.lower())
        url = (
            f"https://api.fda.gov/drug/label.json"
            f"?search=openfda.generic_name:\"{encoded}\""
            f"&limit=1"
        )

        req = urllib.request.Request(url, method="GET")
        req.add_header("User-Agent", "DrugSafeAI/1.0")

        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))

            if data.get("results"):
                label = data["results"][0]
                result["found"] = True

                # Extract key fields (each is a list of strings in the API)
                openfda = label.get("openfda", {})
                result["brand_name"] = (openfda.get("brand_name") or [None])[0]
                result["generic_name"] = (openfda.get("generic_name") or [None])[0]

                # Drug interactions section from the label
                interactions = label.get("drug_interactions")
                if interactions:
                    # Truncate to keep prompt manageable
                    text = interactions[0][:1500]
                    result["drug_interactions"] = text

                # Warnings section
                warnings = label.get("warnings")
                if warnings:
                    result["warnings"] = warnings[0][:800]

                # Indications
                indications = label.get("indications_and_usage")
                if indications:
                    result["indications_and_usage"] = indications[0][:500]

                # Mechanism of action
                moa = label.get("mechanism_of_action")
                if moa:
                    result["mechanism_of_action"] = moa[0][:500]

    except (urllib.error.HTTPError, urllib.error.URLError):
        pass  # FDA API may not have data for every drug
    except Exception:
        pass

    return result


def fetch_fda_adverse_events(drug1: str, drug2: str) -> int:
    """
    Query openFDA adverse events where two drugs were co-reported.
    Returns the count of adverse event reports involving both drugs.
    """
    import urllib.request
    import urllib.error
    import urllib.parse

    try:
        d1 = urllib.parse.quote(drug1.lower())
        d2 = urllib.parse.quote(drug2.lower())
        url = (
            f"https://api.fda.gov/drug/event.json"
            f"?search=patient.drug.openfda.generic_name:\"{d1}\""
            f"+AND+patient.drug.openfda.generic_name:\"{d2}\""
            f"&limit=1"
        )

        req = urllib.request.Request(url, method="GET")
        req.add_header("User-Agent", "DrugSafeAI/1.0")

        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
            # The meta.results.total field has the count
            return data.get("meta", {}).get("results", {}).get("total", 0)

    except Exception:
        return 0


def build_nemotron_prompt(medications: list[str]) -> str:
    """
    Build a structured prompt for Nemotron to analyze drug interactions.
    Includes drug metadata from local DB AND live FDA label data.
    """
    # Look up drug info from our database
    drug_info_parts = []
    recognized = []
    unrecognized = []

    for med in medications:
        key = med.strip().lower()
        if key in DRUG_DATABASE:
            info = DRUG_DATABASE[key]
            recognized.append(key)
            drug_info_parts.append(
                f"- **{med.strip().title()}**: Class: {info['class']} | "
                f"Mechanism: {info['mechanism']} | "
                f"Metabolism: {info['metabolism']} | "
                f"Uses: {info['common_uses']}"
            )
        else:
            unrecognized.append(med.strip())

    drug_context = "\n".join(drug_info_parts) if drug_info_parts else "No drug details available in local database."

    if unrecognized:
        drug_context += f"\n\nNote: The following medications were not found in the local database but should still be analyzed using your medical knowledge: {', '.join(unrecognized)}"

    # --- Fetch FDA label data for each drug ---
    fda_sections = []
    for med in medications:
        fda = fetch_fda_drug_info(med.strip())
        if fda["found"]:
            parts = [f"- **{med.strip().title()}** (FDA Label)"]
            if fda["generic_name"]:
                parts.append(f"  Generic: {fda['generic_name']}")
            if fda["drug_interactions"]:
                parts.append(f"  FDA Drug Interactions: {fda['drug_interactions']}")
            if fda["mechanism_of_action"]:
                parts.append(f"  FDA Mechanism: {fda['mechanism_of_action']}")
            if fda["warnings"]:
                parts.append(f"  FDA Warnings (excerpt): {fda['warnings'][:400]}")
            fda_sections.append("\n".join(parts))

    fda_context = ""
    if fda_sections:
        fda_context = "\n\n## FDA Drug Label Data (from openFDA)\n" + "\n\n".join(fda_sections)

    # --- Fetch FDA adverse event co-occurrence counts ---
    ae_parts = []
    med_list = [m.strip() for m in medications]
    for i in range(len(med_list)):
        for j in range(i + 1, len(med_list)):
            count = fetch_fda_adverse_events(med_list[i], med_list[j])
            if count > 0:
                ae_parts.append(f"- {med_list[i].title()} + {med_list[j].title()}: {count:,} adverse event reports in FDA FAERS database")

    ae_context = ""
    if ae_parts:
        ae_context = "\n\n## FDA Adverse Event Co-occurrence Data\n" + "\n".join(ae_parts)
        ae_context += "\n(Higher counts may indicate a signal but also reflect common co-prescribing. Use clinical judgment.)"

    prompt = f"""You are a clinical pharmacology AI assistant powered by NVIDIA Nemotron. Analyze potential drug-drug interactions for the following medications.

## Medications & Known Properties
{drug_context}
{fda_context}
{ae_context}

## Task
Analyze ALL pairwise drug interactions between these medications. Use BOTH the local drug database properties AND the FDA label data provided above to ground your analysis. For each interaction found, provide:

1. **Drug Pair**: The two drugs involved
2. **Severity**: Exactly one of: "major", "moderate", or "minor"
3. **Interaction Type**: e.g., Pharmacokinetic, Pharmacodynamic, or both
4. **Mechanism**: How the interaction occurs (enzyme inhibition/induction, additive effects, etc.)
5. **Clinical Significance**: What could happen to the patient
6. **Recommendation**: What a clinician should consider

If no interaction exists between a pair, skip it.

## IMPORTANT: Response Format
You MUST respond with ONLY valid JSON in this exact format, with no other text before or after:
{{
  "interactions": [
    {{
      "drug1": "Drug Name 1",
      "drug2": "Drug Name 2",
      "severity": "major|moderate|minor",
      "interaction_type": "Pharmacokinetic|Pharmacodynamic|Both",
      "mechanism": "Description of mechanism",
      "clinical_significance": "What could happen",
      "recommendation": "What to do about it"
    }}
  ],
  "summary": "Brief overall assessment of this medication combination",
  "risk_score": "low|moderate|high|critical"
}}

Respond with ONLY the JSON object. No markdown, no code fences, no explanation outside the JSON."""

    return prompt


def call_nemotron(prompt: str) -> dict:
    """
    Call NVIDIA NIM API with Nemotron model.
    Uses the OpenAI-compatible endpoint at integrate.api.nvidia.com
    """
    import urllib.request
    import urllib.error

    if not NVIDIA_API_KEY:
        return {
            "error": "NVIDIA_API_KEY not configured. Please add your API key from build.nvidia.com as a Replit Secret."
        }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {NVIDIA_API_KEY}"
    }

    payload = json.dumps({
        "model": NEMOTRON_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are a clinical pharmacology expert. You analyze drug interactions with precision and return structured JSON responses. Always respond with valid JSON only."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.2,
        "max_tokens": 4096,
        "top_p": 0.9
    })

    req = urllib.request.Request(
        f"{NVIDIA_BASE_URL}/chat/completions",
        data=payload.encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
            content = result["choices"][0]["message"]["content"]

            # Clean up response - remove markdown fences if present
            content = content.strip()
            if content.startswith("```"):
                content = re.sub(r"^```(?:json)?\s*", "", content)
                content = re.sub(r"\s*```$", "", content)

            parsed = json.loads(content)
            return parsed

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else ""
        return {"error": f"NVIDIA NIM API error ({e.code}): {error_body}"}
    except json.JSONDecodeError:
        # If Nemotron didn't return valid JSON, return raw text
        return {"error": "Model response was not valid JSON. Raw response: " + content[:500]}
    except Exception as e:
        return {"error": f"Request failed: {str(e)}"}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/check", methods=["POST"])
def check_interactions():
    data = request.get_json()
    medications = data.get("medications", [])

    if len(medications) < 2:
        return jsonify({"error": "Please enter at least 2 medications to check interactions."}), 400

    if len(medications) > 8:
        return jsonify({"error": "Please limit to 8 medications at a time."}), 400

    # Build prompt with drug context
    prompt = build_nemotron_prompt(medications)

    # Call Nemotron via NIM
    result = call_nemotron(prompt)

    if "error" in result:
        return jsonify(result), 500

    # Enrich with drug database info
    drug_details = {}
    for med in medications:
        key = med.strip().lower()
        if key in DRUG_DATABASE:
            drug_details[med.strip().title()] = DRUG_DATABASE[key]

    result["drug_details"] = drug_details
    result["model_used"] = NEMOTRON_MODEL
    result["powered_by"] = "NVIDIA NIM + Nemotron"
    result["data_sources"] = ["Local Drug Database", "openFDA Drug Labels", "FDA FAERS Adverse Events"]

    return jsonify(result)


@app.route("/api/drugs", methods=["GET"])
def list_drugs():
    """Return list of drugs in our database for autocomplete."""
    return jsonify({
        "drugs": sorted([d.title() for d in DRUG_DATABASE.keys()]),
        "note": "You can also type any drug name — the app will query FDA data even for drugs not in this list."
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": NEMOTRON_MODEL,
        "api_configured": bool(NVIDIA_API_KEY),
        "nvidia_endpoint": NVIDIA_BASE_URL
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)