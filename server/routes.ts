import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { checkRequestSchema } from "@shared/schema";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NEMOTRON_MODEL = "nvidia/llama-3.3-nemotron-super-49b-v1";

interface FdaDrugInfo {
  found: boolean;
  brand_name: string | null;
  generic_name: string | null;
  drug_interactions: string | null;
  warnings: string | null;
  indications_and_usage: string | null;
  mechanism_of_action: string | null;
}

async function fetchFdaDrugInfo(drugName: string): Promise<FdaDrugInfo> {
  const result: FdaDrugInfo = {
    found: false,
    brand_name: null,
    generic_name: null,
    drug_interactions: null,
    warnings: null,
    indications_and_usage: null,
    mechanism_of_action: null,
  };

  try {
    const encoded = encodeURIComponent(drugName.toLowerCase());
    const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encoded}"&limit=1`;

    const response = await fetch(url, {
      headers: { "User-Agent": "DrugSafeAI/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return result;

    const data = await response.json();
    if (!data.results || data.results.length === 0) return result;

    const label = data.results[0];
    result.found = true;

    const openfda = label.openfda || {};
    result.brand_name = (openfda.brand_name || [null])[0];
    result.generic_name = (openfda.generic_name || [null])[0];

    if (label.drug_interactions) {
      result.drug_interactions = label.drug_interactions[0].slice(0, 1500);
    }
    if (label.warnings) {
      result.warnings = label.warnings[0].slice(0, 800);
    }
    if (label.indications_and_usage) {
      result.indications_and_usage = label.indications_and_usage[0].slice(0, 500);
    }
    if (label.mechanism_of_action) {
      result.mechanism_of_action = label.mechanism_of_action[0].slice(0, 500);
    }
  } catch {
  }

  return result;
}

async function fetchFdaAdverseEvents(drug1: string, drug2: string): Promise<number> {
  try {
    const d1 = encodeURIComponent(drug1.toLowerCase());
    const d2 = encodeURIComponent(drug2.toLowerCase());
    const url = `https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:"${d1}"+AND+patient.drug.openfda.generic_name:"${d2}"&limit=1`;

    const response = await fetch(url, {
      headers: { "User-Agent": "DrugSafeAI/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return 0;

    const data = await response.json();
    return data?.meta?.results?.total || 0;
  } catch {
    return 0;
  }
}

async function buildNemotronPrompt(medications: string[]): Promise<{ prompt: string; sourcesUsed: string[] }> {
  const db = storage.getDrugDatabase();
  const drugInfoParts: string[] = [];
  const unrecognized: string[] = [];

  for (const med of medications) {
    const key = med.trim().toLowerCase();
    const info = db[key];
    if (info) {
      drugInfoParts.push(
        `- **${med.trim()}**: Class: ${info.class} | Mechanism: ${info.mechanism} | Metabolism: ${info.metabolism} | Uses: ${info.common_uses}`
      );
    } else {
      unrecognized.push(med.trim());
    }
  }

  let drugContext = drugInfoParts.length
    ? drugInfoParts.join("\n")
    : "No drug details available in local database.";

  if (unrecognized.length) {
    drugContext += `\n\nNote: The following medications were not found in the local database but should still be analyzed using your medical knowledge: ${unrecognized.join(", ")}`;
  }

  const sourcesUsed: string[] = ["Local Drug Database"];

  const fdaResults = await Promise.all(
    medications.map((med) => fetchFdaDrugInfo(med.trim()))
  );

  const fdaSections: string[] = [];
  let fdaFoundAny = false;
  for (let i = 0; i < medications.length; i++) {
    const fda = fdaResults[i];
    if (fda.found) {
      fdaFoundAny = true;
      const parts: string[] = [`- **${medications[i].trim()}** (FDA Label)`];
      if (fda.generic_name) parts.push(`  Generic: ${fda.generic_name}`);
      if (fda.drug_interactions) parts.push(`  FDA Drug Interactions: ${fda.drug_interactions}`);
      if (fda.mechanism_of_action) parts.push(`  FDA Mechanism: ${fda.mechanism_of_action}`);
      if (fda.warnings) parts.push(`  FDA Warnings (excerpt): ${fda.warnings.slice(0, 400)}`);
      fdaSections.push(parts.join("\n"));
    }
  }

  let fdaContext = "";
  if (fdaSections.length) {
    fdaContext = "\n\n## FDA Drug Label Data (from openFDA)\n" + fdaSections.join("\n\n");
  }

  const medList = medications.map((m) => m.trim());
  const aePromises: Promise<{ i: number; j: number; count: number }>[] = [];
  for (let i = 0; i < medList.length; i++) {
    for (let j = i + 1; j < medList.length; j++) {
      aePromises.push(
        fetchFdaAdverseEvents(medList[i], medList[j]).then((count) => ({ i, j, count }))
      );
    }
  }
  const aeResults = await Promise.all(aePromises);

  const aeParts: string[] = [];
  let aeFoundAny = false;
  for (const { i, j, count } of aeResults) {
    if (count > 0) {
      aeFoundAny = true;
      aeParts.push(
        `- ${medList[i]} + ${medList[j]}: ${count.toLocaleString()} adverse event reports in FDA FAERS database`
      );
    }
  }

  let aeContext = "";
  if (aeParts.length) {
    aeContext = "\n\n## FDA Adverse Event Co-occurrence Data\n" + aeParts.join("\n");
    aeContext += "\n(Higher counts may indicate a signal but also reflect common co-prescribing. Use clinical judgment.)";
  }

  if (fdaFoundAny) sourcesUsed.push("openFDA Drug Labels");
  if (aeFoundAny) sourcesUsed.push("FDA FAERS Adverse Events");

  const prompt = `You are a clinical pharmacology AI assistant powered by NVIDIA Nemotron. Analyze potential drug-drug interactions for the following medications.

## Medications & Known Properties
${drugContext}
${fdaContext}
${aeContext}

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
{
  "interactions": [
    {
      "drug1": "Drug Name 1",
      "drug2": "Drug Name 2",
      "severity": "major|moderate|minor",
      "interaction_type": "Pharmacokinetic|Pharmacodynamic|Both",
      "mechanism": "Description of mechanism",
      "clinical_significance": "What could happen",
      "recommendation": "What to do about it"
    }
  ],
  "summary": "Brief overall assessment of this medication combination",
  "risk_score": "low|moderate|high|critical"
}

Respond with ONLY the JSON object. No markdown, no code fences, no explanation outside the JSON.`;

  return { prompt, sourcesUsed };
}

async function callNemotron(prompt: string): Promise<any> {
  if (!NVIDIA_API_KEY) {
    return {
      error:
        "NVIDIA_API_KEY not configured. Please add your API key from build.nvidia.com as a Secret.",
    };
  }

  const payload = {
    model: NEMOTRON_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a clinical pharmacology expert. You analyze drug interactions with precision and return structured JSON responses. Always respond with valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    max_tokens: 4096,
    top_p: 0.9,
  };

  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { error: `NVIDIA NIM API error (${response.status}): ${errorBody}` };
    }

    const result = await response.json();
    let content: string = result.choices[0].message.content;

    content = content.trim();
    if (content.startsWith("```")) {
      content = content.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(content);
    return parsed;
  } catch (e: any) {
    if (e instanceof SyntaxError) {
      return { error: "Model response was not valid JSON. Please try again." };
    }
    return { error: `Request failed: ${e.message}` };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/check", async (req, res) => {
    try {
      const parsed = checkRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Please enter between 2 and 8 medications to check interactions.",
        });
      }

      const { medications } = parsed.data;
      const { prompt, sourcesUsed } = await buildNemotronPrompt(medications);
      const result = await callNemotron(prompt);

      if (result.error) {
        return res.status(500).json(result);
      }

      const db = storage.getDrugDatabase();
      const drugDetails: Record<string, any> = {};
      for (const med of medications) {
        const key = med.trim().toLowerCase();
        if (db[key]) {
          drugDetails[med.trim()] = db[key];
        }
      }

      result.drug_details = drugDetails;
      result.model_used = NEMOTRON_MODEL;
      result.powered_by = "NVIDIA NIM + Nemotron";
      result.data_sources = sourcesUsed;

      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/drugs", (_req, res) => {
    return res.json({ drugs: storage.getDrugList() });
  });

  app.get("/api/health", (_req, res) => {
    return res.json({
      status: "ok",
      model: NEMOTRON_MODEL,
      api_configured: Boolean(NVIDIA_API_KEY),
      nvidia_endpoint: NVIDIA_BASE_URL,
    });
  });

  return httpServer;
}
