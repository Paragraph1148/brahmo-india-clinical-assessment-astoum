# Architecture

## Design principle: tag-based polymorphism

The assessment's critical architecture rule:

> ONE set of tables serves BOTH conditions. Adding a 3rd condition should require ONLY new data rows, ZERO code changes.

This system meets that rule via **tag-based polymorphism**:

- Every drug row carries a `condition_tags` JSONB array: `["diabetes"]`, `["cardiovascular"]`, or `["diabetes", "cardiovascular", "heart_failure"]`.
- Every guideline row carries the same `condition_tags` array.
- The safety engine and prompt composer **never hard-code conditions**. They query by tag.

When adding respiratory medicine:

- Insert drug rows tagged `["respiratory", "asthma"]`
- Insert guideline rows tagged `["respiratory"]` from Indian Chest Society
- `drugs_for_condition('respiratory')` works immediately
- The safety engine still checks renal dosing, interactions, etc., because those are condition-agnostic

## Data flow

```
        Patient (from DB)
              │
              ▼
   ┌─────────────────────┐
   │  Safety Engine      │
   │  (TypeScript)       │
   │                     │
   │  - eGFR/CKD stage   │
   │  - HF flags         │
   │  - Renal dosing     │
   │  - Hypoglycemia     │
   │  - Hyperkalemia     │
   │  - DDI check        │
   │  - Allergies        │
   │  - CHA2DS2-VASc     │
   │  - Recommendations  │
   └──────────┬──────────┘
              ▼
       SafetyReport
              │
              ▼
   ┌─────────────────────┐
   │ Prompt Composer     │   pulls:
   │                     │   - guidelines by condition_tag
   │                     │   - drugs by condition_tag + formulary stock
   │                     │   - safety flags (already computed)
   │                     │   - patient cost context (insurance, NLEM, income)
   └──────────┬──────────┘
              ▼
        Structured Prompt
              │
              ▼
   ┌─────────────────────┐
   │ Claude API          │
   └──────────┬──────────┘
              ▼
   ┌─────────────────────┐
   │ UI                  │
   │ - Patient picker    │
   │ - Generic vs Option C
   │ - Safety alerts     │
   │ - Active sources    │
   └─────────────────────┘
```

## Table schema rationale

### `drugs` table — unified

- `drug_class` is a string, not an enum. New classes (e.g. "Bronchodilator") don't require ALTER TABLE.
- `renal_dosing` is JSONB with eGFR-bucket keys (`egfr_45_plus`, `egfr_below_30`, etc.). The calculator returns matching bucket keys for any eGFR.
- `condition_tags` is JSONB array. A single drug (e.g. Empagliflozin) can be tagged for diabetes, cardiovascular, AND heart_failure — and appear in queries for any of them.
- `hf_safe`, `hypoglycemia_risk`, `weight_effect` are top-level columns (not JSONB) because they're used in every safety check — JSONB would slow down indexing.

### `drug_interactions` table — unified

- One severity scale (`minor` / `moderate` / `severe` / `contraindicated`) covers all conditions.
- `drug_a_name` / `drug_b_name` columns allow interactions with substances not in the drugs table (e.g. "Alcohol", "NSAIDs", "IV contrast dye") — important for real-world coverage.

### `indian_guidelines` table — unified

- `source_id` is a string ("RSSDI", "CSI", "IHRS/CSI", "MoHFW_STG", "RSSDI+CSI"). New societies (Indian Chest Society for respiratory) add naturally.
- `condition_tags` enables overlap queries: `WHERE condition_tags ?& ARRAY['diabetes', 'heart_failure']` returns RSSDI+CSI overlap recommendations directly.

### `hospital_formulary` table

- Decoupled from drugs by `drug_id` FK. Different hospitals can have different formulary tables pointing at the same drug master. Apollo Chennai stock is the default; Apollo Hyderabad would just be different rows.

## The safety engine as composable checks

Each safety check is an independent pure function:

```typescript
checkRenalDosing(meds, allDrugs, eGFR) → SafetyFlag[]
checkHFContraindications(patient, meds, allDrugs) → SafetyFlag[]
checkHypoglycemiaRisk(patient, meds, allDrugs, eGFR) → SafetyFlag[]
checkHyperkalemiaRisk(patient, meds, allDrugs, eGFR) → SafetyFlag[]
checkInteractions(meds) → SafetyFlag[]
checkAllergies(patient, meds, allDrugs) → SafetyFlag[]
recommendDrugClasses(patient, eGFR) → SafetyFlag[]
```

The main entry point composes them via `Array.push(...)`. Adding a new check (e.g. QT prolongation for respiratory drugs that interact with amiodarone) is a one-line addition.

## Why CKD-EPI 2021

The system recomputes eGFR from creatinine instead of trusting the eGFR field on the patient record. The CKD-EPI 2021 race-free equation (Inker NEJM 2021) replaced the older 2009 version and removed race-based correction factors that were ethically questionable. This is a defensible demo talking point: the system uses the latest international standard.

## Why CHA₂DS₂-VASc is sex-aware

The thresholds for anticoagulation in AF differ: ≥2 for men, ≥3 for women. This isn't widely implemented in clinical tools that simply check "score ≥2 = anticoagulate", which over-treats women whose score-of-1-as-female isn't actually risk-driving. `shouldAnticoagulate(score, sex)` encodes this correctly.

## Why Asian-Pacific BMI cutoffs

Indian populations develop metabolic complications at lower BMIs than European populations. WHO Asian-Pacific cutoffs (overweight at 23, obesity at 25) are clinically relevant in India. The `bmiCategory()` function uses these, not the standard WHO global cutoffs.

## Scaling considerations

- Adding new conditions: data only.
- Adding new hospitals: insert new rows into `hospital_formulary` keyed on a `hospital_id` (currently single-tenant; trivial to make multi-tenant by adding the FK).
- Adding new guideline societies: just a new `source_id` string value. No enum changes.
- Adding new patient cohorts (e.g. pediatric, pregnant): the safety engine reads `patient.age`, `patient.sex`, `patient.conditions` — extensions live there, not in the schema.
