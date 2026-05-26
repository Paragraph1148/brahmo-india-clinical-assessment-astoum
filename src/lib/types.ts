// =================================================================
// BRAHMO Clinical AI — Shared Types
// =================================================================

// ---------- Patient ----------
export interface Medication {
  drug: string;           // generic name e.g. "Metformin"
  dose: string;           // human-readable e.g. "500mg BD"
  drug_id?: number;       // resolved DB id, populated by safety engine
}

export interface Labs {
  HbA1c?: number;
  FBS?: number;           // fasting blood sugar (mg/dL)
  Cr?: number;            // serum creatinine (mg/dL)
  eGFR?: number;          // pre-computed; safety engine recomputes if Cr present
  K?: number;             // serum potassium (mEq/L)
  Na?: number;
  Troponin?: number;
  BNP?: number;
  TC?: number;            // total cholesterol
  LDL?: number;
  HDL?: number;
  TG?: number;
  ALT?: number;
  UrineACR?: number;      // urine albumin/creatinine ratio
  Glucose?: number;
  ECG?: string;
  [key: string]: number | string | undefined;
}

export interface Vitals {
  BP?: string;            // "134/86"
  HR?: number | string;
  SpO2?: number;
  RR?: number;
}

export interface Insurance {
  provider?: string;
  notes?: string;
}

export interface Patient {
  id: number;
  patient_label: string;
  age: number;
  sex: "M" | "F" | "Other";
  bmi: number;
  conditions: string[];
  medications: Medication[];
  allergies: string[];
  labs: Labs;
  vitals: Vitals;
  insurance: Insurance;
  income_context: string;
}

// ---------- Drug (from DB) ----------
export interface Drug {
  id: number;
  generic_name: string;
  generic_name_normalized: string;
  drug_class: string;
  drug_subclass: string | null;
  indian_brand_name: string;
  manufacturer: string;
  mrp_price: string;
  nlem_status: boolean;
  renal_dosing: Record<string, string>;
  hf_safe: boolean;
  weight_effect: "gain" | "neutral" | "loss" | "—";
  hypoglycemia_risk: "low" | "moderate" | "high" | "—";
  condition_tags: string[];
  source_url: string | null;
  notes: string | null;
}

export interface DrugInteraction {
  id: number;
  drug_a_id: number | null;
  drug_a_name: string | null;
  drug_b_id: number | null;
  drug_b_name: string | null;
  severity: "minor" | "moderate" | "severe" | "contraindicated";
  mechanism: string;
  clinical_effect: string;
  management: string;
}

export interface Guideline {
  id: number;
  source_id: string;
  year: number;
  condition: string;
  section: string;
  recommendation: string;
  evidence_level: "A" | "B" | "C" | "D" | "—" | null;
  condition_tags: string[];
}

// ---------- Safety Engine output ----------
export type FlagSeverity = "info" | "caution" | "warning" | "critical";

export interface SafetyFlag {
  category:
    | "renal"
    | "hepatic"
    | "heart_failure"
    | "hypoglycemia"
    | "interaction"
    | "hyperkalemia"
    | "contraindication"
    | "allergy"
    | "cost"
    | "elderly"
    | "recommendation";
  severity: FlagSeverity;
  title: string;
  detail: string;
  drugs_involved?: string[];      // generic names
  guideline_source?: string;      // "RSSDI 2022" etc.
  action?: string;                // "STOP", "REDUCE DOSE", "MONITOR"
}

export interface ComputedValues {
  eGFR: number | null;
  eGFR_stage: string | null;      // "Normal", "CKD 1", "CKD 3a"... "CKD 5"
  chads_vasc: number | null;
  bmi_category: string | null;
}

export interface SafetyReport {
  patient_id: number;
  computed: ComputedValues;
  flags: SafetyFlag[];
  // Drugs the engine recommends adding/considering given profile
  recommended_drug_classes: string[];
  // Drugs the engine recommends stopping/avoiding
  drugs_to_avoid: { drug: string; reason: string }[];
}
