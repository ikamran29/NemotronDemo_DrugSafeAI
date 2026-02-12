import type { DrugInfo } from "@shared/schema";

export interface IStorage {
  getDrugDatabase(): Record<string, DrugInfo>;
  getDrugList(): string[];
}

const DRUG_DATABASE: Record<string, DrugInfo> = {
  warfarin: {
    class: "Anticoagulant",
    mechanism: "Vitamin K antagonist; inhibits clotting factors II, VII, IX, X",
    common_uses: "Blood clot prevention, atrial fibrillation, DVT, PE",
    metabolism: "CYP2C9, CYP3A4, CYP1A2",
  },
  aspirin: {
    class: "NSAID / Antiplatelet",
    mechanism: "Irreversibly inhibits COX-1 and COX-2; blocks thromboxane A2",
    common_uses: "Pain relief, fever reduction, cardiovascular protection",
    metabolism: "Hepatic hydrolysis, CYP2C9",
  },
  omeprazole: {
    class: "Proton Pump Inhibitor (PPI)",
    mechanism: "Irreversibly inhibits H+/K+ ATPase in gastric parietal cells",
    common_uses: "GERD, peptic ulcer disease, H. pylori eradication",
    metabolism: "CYP2C19, CYP3A4",
  },
  lisinopril: {
    class: "ACE Inhibitor",
    mechanism: "Inhibits angiotensin-converting enzyme, reducing angiotensin II",
    common_uses: "Hypertension, heart failure, post-MI",
    metabolism: "Not hepatically metabolized; renally excreted",
  },
  metformin: {
    class: "Biguanide",
    mechanism: "Decreases hepatic glucose production, increases insulin sensitivity",
    common_uses: "Type 2 diabetes mellitus",
    metabolism: "Not metabolized; renally excreted unchanged",
  },
  atorvastatin: {
    class: "HMG-CoA Reductase Inhibitor (Statin)",
    mechanism: "Inhibits HMG-CoA reductase, reducing cholesterol synthesis",
    common_uses: "Hyperlipidemia, cardiovascular risk reduction",
    metabolism: "CYP3A4",
  },
  metoprolol: {
    class: "Beta-1 Selective Blocker",
    mechanism: "Blocks beta-1 adrenergic receptors in the heart",
    common_uses: "Hypertension, angina, heart failure, post-MI",
    metabolism: "CYP2D6",
  },
  amlodipine: {
    class: "Calcium Channel Blocker (Dihydropyridine)",
    mechanism: "Blocks L-type calcium channels in vascular smooth muscle",
    common_uses: "Hypertension, angina",
    metabolism: "CYP3A4",
  },
  sertraline: {
    class: "SSRI (Selective Serotonin Reuptake Inhibitor)",
    mechanism: "Inhibits serotonin reuptake in the synaptic cleft",
    common_uses: "Depression, anxiety, OCD, PTSD, panic disorder",
    metabolism: "CYP2B6, CYP2C19, CYP3A4, CYP2D6",
  },
  gabapentin: {
    class: "Anticonvulsant / Analgesic",
    mechanism: "Binds alpha-2-delta subunit of voltage-gated calcium channels",
    common_uses: "Neuropathic pain, epilepsy, restless leg syndrome",
    metabolism: "Not metabolized; renally excreted unchanged",
  },
  levothyroxine: {
    class: "Thyroid Hormone",
    mechanism: "Synthetic T4; converted to active T3 in peripheral tissues",
    common_uses: "Hypothyroidism, thyroid cancer (TSH suppression)",
    metabolism: "Deiodination in liver, kidney, and other tissues",
  },
  ibuprofen: {
    class: "NSAID",
    mechanism: "Non-selective COX-1 and COX-2 inhibitor",
    common_uses: "Pain, inflammation, fever",
    metabolism: "CYP2C9, CYP2C19",
  },
  amoxicillin: {
    class: "Aminopenicillin (Beta-Lactam Antibiotic)",
    mechanism: "Inhibits bacterial cell wall synthesis by binding PBPs",
    common_uses: "Upper/lower respiratory infections, UTI, H. pylori",
    metabolism: "Hepatic (partial); renally excreted",
  },
  hydrochlorothiazide: {
    class: "Thiazide Diuretic",
    mechanism: "Inhibits Na+/Cl- cotransporter in distal convoluted tubule",
    common_uses: "Hypertension, edema",
    metabolism: "Not metabolized; renally excreted unchanged",
  },
  prednisone: {
    class: "Corticosteroid",
    mechanism: "Converted to prednisolone; modulates gene transcription via glucocorticoid receptor",
    common_uses: "Inflammatory conditions, autoimmune disorders, asthma exacerbations",
    metabolism: "CYP3A4 (converted to prednisolone in liver)",
  },
  clopidogrel: {
    class: "Antiplatelet (P2Y12 Inhibitor)",
    mechanism: "Irreversibly blocks P2Y12 ADP receptor on platelets",
    common_uses: "ACS, recent MI/stroke, peripheral artery disease, stent placement",
    metabolism: "CYP2C19, CYP3A4, CYP1A2",
  },
  fluoxetine: {
    class: "SSRI",
    mechanism: "Inhibits serotonin reuptake; strong CYP2D6 inhibitor",
    common_uses: "Depression, OCD, bulimia nervosa, panic disorder",
    metabolism: "CYP2D6, CYP2C9",
  },
  tramadol: {
    class: "Opioid Analgesic (Atypical)",
    mechanism: "Mu-opioid receptor agonist + serotonin/norepinephrine reuptake inhibitor",
    common_uses: "Moderate to moderately severe pain",
    metabolism: "CYP2D6, CYP3A4",
  },
  ciprofloxacin: {
    class: "Fluoroquinolone Antibiotic",
    mechanism: "Inhibits bacterial DNA gyrase and topoisomerase IV",
    common_uses: "UTI, respiratory infections, GI infections",
    metabolism: "CYP1A2 inhibitor; partially hepatic, renally excreted",
  },
  alprazolam: {
    class: "Benzodiazepine",
    mechanism: "Enhances GABA-A receptor activity",
    common_uses: "Anxiety disorders, panic disorder",
    metabolism: "CYP3A4",
  },
};

export class MemStorage implements IStorage {
  getDrugDatabase(): Record<string, DrugInfo> {
    return DRUG_DATABASE;
  }

  getDrugList(): string[] {
    return Object.keys(DRUG_DATABASE)
      .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
      .sort();
  }
}

export const storage = new MemStorage();
