import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { checkRequestSchema } from "@shared/schema";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NEMOTRON_MODEL = "nvidia/llama-3.3-nemotron-super-49b-v1";

function buildNemotronPrompt(medications: string[]): string {
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

  return `You are a clinical pharmacology AI assistant powered by NVIDIA Nemotron. Analyze potential drug-drug interactions for the following medications.

## Medications & Known Properties
${drugContext}

## Task
Analyze ALL pairwise drug interactions between these medications. For each interaction found, provide:

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
      const prompt = buildNemotronPrompt(medications);
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
