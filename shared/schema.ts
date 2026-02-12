import { z } from "zod";

export const drugInfoSchema = z.object({
  class: z.string(),
  mechanism: z.string(),
  common_uses: z.string(),
  metabolism: z.string(),
});

export type DrugInfo = z.infer<typeof drugInfoSchema>;

export const interactionSchema = z.object({
  drug1: z.string(),
  drug2: z.string(),
  severity: z.enum(["major", "moderate", "minor"]),
  interaction_type: z.string(),
  mechanism: z.string(),
  clinical_significance: z.string(),
  recommendation: z.string(),
});

export type Interaction = z.infer<typeof interactionSchema>;

export const checkRequestSchema = z.object({
  medications: z.array(z.string()).min(2).max(8),
});

export type CheckRequest = z.infer<typeof checkRequestSchema>;

export const checkResponseSchema = z.object({
  interactions: z.array(interactionSchema),
  summary: z.string(),
  risk_score: z.enum(["low", "moderate", "high", "critical"]),
  drug_details: z.record(z.string(), drugInfoSchema).optional(),
  model_used: z.string().optional(),
  powered_by: z.string().optional(),
});

export type CheckResponse = z.infer<typeof checkResponseSchema>;

export const drugListResponseSchema = z.object({
  drugs: z.array(z.string()),
});

export type DrugListResponse = z.infer<typeof drugListResponseSchema>;
