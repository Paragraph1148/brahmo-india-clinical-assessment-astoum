// =================================================================
// BRAHMO Clinical AI — Calculators
// Pure functions, no DB dependencies. Easily unit-testable.
// =================================================================

/**
 * eGFR using CKD-EPI 2021 (race-free) equation.
 * Reference: Inker LA et al. NEJM 2021;385:1737-1749.
 *
 *   eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^-1.200 × 0.9938^age × (1.012 if female)
 *
 * where:
 *   κ = 0.7  if female, 0.9 if male
 *   α = -0.241 if female, -0.302 if male
 */
export function calculateEGFR(
  creatinine: number | undefined,
  age: number,
  sex: "M" | "F" | "Other"
): number | null {
  if (!creatinine || creatinine <= 0 || !age || age <= 0) return null;

  const isFemale = sex === "F";
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const sexFactor = isFemale ? 1.012 : 1.0;

  const scrRatio = creatinine / kappa;
  const minTerm = Math.pow(Math.min(scrRatio, 1), alpha);
  const maxTerm = Math.pow(Math.max(scrRatio, 1), -1.2);
  const ageFactor = Math.pow(0.9938, age);

  const eGFR = 142 * minTerm * maxTerm * ageFactor * sexFactor;
  return Math.round(eGFR);
}

/**
 * Map eGFR to CKD stage (KDIGO 2012).
 *   ≥90  → Normal (G1 if albuminuria, else preserved)
 *   60-89 → G2
 *   45-59 → G3a (mild-moderate)
 *   30-44 → G3b (moderate-severe)
 *   15-29 → G4 (severe)
 *   <15   → G5 (kidney failure)
 */
export function ckdStage(eGFR: number | null): string | null {
  if (eGFR === null) return null;
  if (eGFR >= 90) return "Normal (G1)";
  if (eGFR >= 60) return "G2";
  if (eGFR >= 45) return "CKD 3a";
  if (eGFR >= 30) return "CKD 3b";
  if (eGFR >= 15) return "CKD 4";
  return "CKD 5";
}

/**
 * eGFR bucket key matching the JSONB renal_dosing schema in `drugs` table.
 * Returns the key whose threshold the patient is at or above.
 *
 * The drug rows use varied threshold sets, so we return the most-specific
 * matching key by trying all common buckets in order.
 */
export function egfrBucket(eGFR: number | null): string[] {
  if (eGFR === null) return ["egfr_all"];
  const buckets: string[] = ["egfr_all"];
  if (eGFR >= 60) buckets.push("egfr_60_plus");
  if (eGFR >= 50) buckets.push("egfr_50_plus");
  if (eGFR >= 45) buckets.push("egfr_45_plus");
  if (eGFR >= 30) buckets.push("egfr_30_plus");
  if (eGFR >= 25) buckets.push("egfr_25_plus");
  if (eGFR >= 20) buckets.push("egfr_20_plus");
  if (eGFR >= 15) buckets.push("egfr_15_plus");
  if (eGFR >= 30 && eGFR < 60) buckets.push("egfr_30_60");
  if (eGFR >= 30 && eGFR < 45) buckets.push("egfr_30_45");
  if (eGFR >= 15 && eGFR < 50) buckets.push("egfr_15_50");
  if (eGFR >= 45 && eGFR < 60) buckets.push("egfr_45_60");
  if (eGFR < 60) buckets.push("egfr_below_60");
  if (eGFR < 50) buckets.push("egfr_below_50");
  if (eGFR < 45) buckets.push("egfr_below_45");
  if (eGFR < 30) buckets.push("egfr_below_30");
  if (eGFR < 25) buckets.push("egfr_below_25");
  if (eGFR < 20) buckets.push("egfr_below_20");
  if (eGFR < 15) buckets.push("egfr_below_15");
  return buckets;
}

/**
 * Find the renal dosing recommendation for a drug given the patient's eGFR.
 * Tries narrowest-range bucket first, falls back to "egfr_all".
 */
export function getRenalDoseInstruction(
  renal_dosing: Record<string, string>,
  eGFR: number | null
): string | null {
  if (!renal_dosing || Object.keys(renal_dosing).length === 0) return null;

  // Most-specific keys first
  const priorityOrder = [
    "egfr_below_15",
    "egfr_below_20",
    "egfr_below_25",
    "egfr_below_30",
    "egfr_below_45",
    "egfr_below_50",
    "egfr_below_60",
    "egfr_15_50",
    "egfr_30_45",
    "egfr_30_60",
    "egfr_45_60",
    "egfr_15_plus",
    "egfr_20_plus",
    "egfr_25_plus",
    "egfr_30_plus",
    "egfr_45_plus",
    "egfr_50_plus",
    "egfr_60_plus",
    "egfr_all",
  ];

  const buckets = egfrBucket(eGFR);

  // Find first priority-ordered key that is both in the bucket list and in the drug's dosing
  for (const key of priorityOrder) {
    if (buckets.includes(key) && key in renal_dosing) {
      return renal_dosing[key];
    }
  }

  // Final fallback
  return renal_dosing["egfr_all"] ?? null;
}

/**
 * CHA₂DS₂-VASc score for atrial fibrillation stroke risk.
 *
 *   C  Congestive HF / LV dysfunction         +1
 *   H  Hypertension                           +1
 *   A₂ Age ≥75                                +2
 *   D  Diabetes mellitus                      +1
 *   S₂ Prior Stroke / TIA / Thromboembolism   +2
 *   V  Vascular disease (MI, PAD, plaque)     +1
 *   A  Age 65-74                              +1
 *   Sc Sex category (female)                  +1
 *
 *   Score ≥2 men or ≥3 women → oral anticoagulation indicated.
 */
export interface ChadsVascInputs {
  hasHF: boolean;
  hasHTN: boolean;
  age: number;
  hasDiabetes: boolean;
  hasPriorStroke: boolean;
  hasVascularDisease: boolean;
  sex: "M" | "F" | "Other";
}

export function calculateChadsVasc(inputs: ChadsVascInputs): number {
  let score = 0;
  if (inputs.hasHF) score += 1;
  if (inputs.hasHTN) score += 1;
  if (inputs.age >= 75) score += 2;
  else if (inputs.age >= 65) score += 1;
  if (inputs.hasDiabetes) score += 1;
  if (inputs.hasPriorStroke) score += 2;
  if (inputs.hasVascularDisease) score += 1;
  if (inputs.sex === "F") score += 1;
  return score;
}

/**
 * Indicates whether anticoagulation is recommended given CHA₂DS₂-VASc.
 * Per IHRS/CSI 2018: ≥2 in men, ≥3 in women → OAC indicated.
 */
export function shouldAnticoagulate(score: number, sex: "M" | "F" | "Other"): boolean {
  if (sex === "F") return score >= 3;
  return score >= 2;
}

/**
 * BMI category per WHO Asian-Pacific cutoffs (relevant for Indian population).
 * Reference: WHO Expert Consultation. Lancet 2004;363:157-163.
 *
 *   <18.5  Underweight
 *   18.5-22.9  Normal
 *   23.0-24.9  Overweight (Asian)
 *   25.0-29.9  Obese I (Asian)
 *   ≥30.0  Obese II (Asian)
 */
export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 23.0) return "Normal";
  if (bmi < 25.0) return "Overweight (Asian)";
  if (bmi < 30.0) return "Obese I (Asian)";
  return "Obese II (Asian)";
}
