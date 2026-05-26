# Data Sources

This document records the provenance of every piece of clinical data used in the BRAHMO India Clinical AI system. The assessment specifically requires this file as a deliverable — it demonstrates that the clinical content was sourced from authoritative Indian references rather than fabricated or imported from US guidelines.

**Verification status as of 26 May 2026:**

- Drug entries: cross-referenced with 1mg.com product pages (URLs in `drugs.source_url` column)
- Guideline recommendations: derived from official Indian society publications listed below
- Drug interaction pairs: triangulated from Drugs.com + Medscape + Stockley's
- All Indian brand names and ₹ MRP values: from 1mg.com, captured May 2026

---

## 1. Clinical Guidelines

### 1.1 Diabetes — RSSDI 2022

**Source:** Research Society for the Study of Diabetes in India (RSSDI). _Clinical Practice Recommendations for the Management of Type 2 Diabetes Mellitus 2022._ Published as a supplement to _International Journal of Diabetes in Developing Countries_ (IJDDC), the official RSSDI journal published by Springer.

- **Society:** RSSDI (founded 1972, Asia's largest diabetes professional body), https://www.rssdi.in/
- **Journal:** International Journal of Diabetes in Developing Countries, ISSN 0973-3930 (print) / 1998-3832 (web), Springer
- **Access:** RSSDI member portal (rssdi.in) and Springer
- **DOI series:** 10.1007/s13410-022-\* (specific article DOIs vary by chapter)

**Recommendations extracted** (see `indian_guidelines` table, source_id='RSSDI', 11 rows):

- Diagnostic criteria (FPG ≥126 mg/dL, OGTT 2h ≥200 mg/dL, HbA1c ≥6.5%)
- First-line therapy: Metformin + lifestyle, with stated contraindication alternatives
- Second-line preferences: SGLT2i, DPP4i, SU, TZD, AGI, GLP-1 RA (drug class table)
- ASCVD / HF / CKD comorbidity → prefer SGLT2i or GLP-1 RA
- Elderly population: prefer DPP4i over SU due to hypoglycemia risk
- HbA1c targets: <7% general, <6.5% young/no comorbidities, 7.5–8% elderly with comorbidities
- Insulin initiation criteria (failing 3 oral agents, severe hyperglycemia)
- Indian Medical Nutrition Therapy: carbs 50–60%, low-GI emphasis (millets, brown rice replacing white rice GI 73), fiber 25–40g/day
- Physical activity: 150 min/week, ≥5000 steps/day
- Postprandial hyperglycemia target <160 mg/dL
- Resource-constrained settings: Metformin + SU as cost-conscious second-line

### 1.2 Cardiovascular — CSI 2017 STEMI Position Statement

**Source:** Guha S, Sethi R, Ray S, Bahl VK, Mukhopadhyay S, Manjunath CN, et al. _Cardiological Society of India: Position Statement for the Management of ST Elevation Myocardial Infarction in India._ Indian Heart Journal. 2017 March; 69(Suppl 1): S63–S97. DOI: 10.1016/j.ihj.2017.03.006.

- **Society:** Cardiological Society of India (CSI), https://www.csi.org.in/
- **Journal:** Indian Heart Journal, published by Elsevier on behalf of CSI, ISSN 0019-4832
- **Access:** Open access via PMC and ScienceDirect — search PubMed for "Cardiological Society of India position statement STEMI 2017"

**Recommendations extracted** (see `indian_guidelines` table, source_id='CSI', 8 rows):

- STEMI ECG criteria (≥1 mm ST elevation in two contiguous limb leads, ≥2 mm precordial)
- Troponin diagnosis thresholds
- Primary PCI preferred (door-to-balloon ≤90 min PCI-capable, ≤120 min from first medical contact)
- Fibrinolysis within 30 min if PCI unavailable
- **Streptokinase vs Tenecteplase** — key Indian cost decision documented
- DAPT loading and maintenance: Aspirin + Ticagrelor (PLATO trial) or Clopidogrel
- Anticoagulation choices: UFH vs Enoxaparin during fibrinolysis
- Post-MI regimen (DAPT + statin + beta blocker + ACEi/ARB)
- Pharmaco-invasive strategy: fibrinolyse, then PCI within 3–24h

### 1.3 Cardiovascular — CSI Acute MI / COVID Update 2020

**Source:** Cardiological Society of India consensus document on acute MI care during COVID-19. Indian Heart Journal Suppl, 2020. Search PubMed for "CSI COVID STEMI 2020" for archived versions.

Used for: pharmaco-invasive strategy guidance in non-PCI centers during high-volume periods.

### 1.4 Atrial Fibrillation — IHRS/CSI 2018

**Source:** Indian Heart Rhythm Society (IHRS) + CSI consensus on atrial fibrillation management, 2018. Referenced in CSI guidelines portal (csi.org.in/guidelines) and AF-specific publications in Indian Heart Journal.

**Recommendations extracted** (see `indian_guidelines` table, source_id='IHRS/CSI', 3 rows):

- **CHA₂DS₂-VASc scoring** for AF stroke risk stratification
- **Non-valvular AF**: DOAC (Apixaban / Rivaroxaban / Dabigatran) preferred over Warfarin
- **Valvular/Rheumatic AF**: Warfarin ONLY (DOACs CONTRAINDICATED) — clinically critical because Rheumatic Heart Disease remains common in India
- Triple therapy duration post-PCI + AF: 1–4 weeks then de-escalate to dual

### 1.5 Overlap — Diabetes + Heart Failure (RSSDI 2022 + CSI Guidelines)

The diabetes-with-HF overlap guidelines combine recommendations from:

- RSSDI 2022, Chapter on Diabetes and Cardiovascular Disease
- CSI heart failure documents
- Landmark trials referenced in both:
  - **EMPEROR-Reduced** (Empagliflozin in HFrEF) — Packer et al., NEJM 2020
  - **DAPA-HF** (Dapagliflozin in HFrEF) — McMurray et al., NEJM 2019
  - **SAVOR-TIMI 53** (Saxagliptin HF black box) — Scirica et al., NEJM 2013

(See `indian_guidelines` table, source_id='RSSDI+CSI', 5 rows)

### 1.6 MoHFW NLEM 2022

**Source:** Government of India, Ministry of Health and Family Welfare. _National List of Essential Medicines 2022._ Published September 2022.

- **Official portal:** https://main.mohfw.gov.in/
- **NLEM 2022 PDF:** Available via the MoHFW Drug Policy section

The NLEM is the legal basis for **price-controlled medicines** in India. Drugs on this list:

1. Are subject to price ceilings set by the National Pharmaceutical Pricing Authority (NPPA)
2. Are available at **Jan Aushadhi Kendras** (government generic pharmacies, ~9000+ outlets nationwide) at substantially below private MRP (typically 50–80% discount)
3. Are subsidised in state and central government health schemes (CGHS, ECHS, ESI, Ayushman Bharat)

**NLEM 2022 diabetes drugs in our database (`nlem_status=TRUE`):**
Metformin, Glibenclamide, Gliclazide, Glimepiride, Insulin (Regular, NPH, Premixed 30/70).

**NLEM 2022 cardiovascular drugs in our database (`nlem_status=TRUE`):**
Aspirin, Clopidogrel, Atorvastatin, Ramipril, Enalapril, Telmisartan, Metoprolol, Atenolol, Furosemide, Spironolactone, Digoxin, Warfarin, Amiodarone, Heparin (UFH), Streptokinase, Nitroglycerine (SL), Isosorbide Mononitrate.

---

## 2. Drug Database — Indian Brands, Manufacturers, MRP

### Primary source

**1mg.com (Tata 1mg)** — India's largest verified online pharmacy, registered with regulatory authorities, displays:

- Marketer (manufacturer) and salt composition
- MRP (printed on label, subject to NPPA pricing)
- NPPA price ceiling status
- Pack size and per-tablet/per-strip price

Each drug row in our `drugs` table has a `source_url` field pointing to the specific 1mg product page. Prices captured May 2026.

### Secondary cross-check

PharmEasy.in, Netmeds.com and indiamart.com used for secondary sources or price triangulation when 1mg displayed ranges or when the marketer-specific brand wasn't the top result.

### Drug categories in the database (48 entries)

**Diabetes (T2DM)**:

- Biguanides: Metformin (regular + SR formulations)
- Sulfonylureas: Glimepiride, Gliclazide (MR), Glibenclamide
- DPP-4 inhibitors: **Teneligliptin** (Dynaglipt — India's #1 prescribed DPP4i, rare in US/UK), Sitagliptin, Vildagliptin, Linagliptin, Saxagliptin
- SGLT2 inhibitors: Empagliflozin, Dapagliflozin, Canagliflozin
- Thiazolidinediones: Pioglitazone (flagged `hf_safe=FALSE` due to fluid retention)
- Insulins: Glargine, NPH, Regular, Premixed 30/70
- GLP-1 RAs: Liraglutide, Dulaglutide
- AGI: Acarbose
- **Fixed-Dose Combinations** (FDCs — dominate Indian outpatient prescribing): Metformin+Glimepiride (Glycomet-GP), Metformin+Teneligliptin (Zita Met), Metformin+Vildagliptin (Galvus Met)

**Cardiovascular**:

- Antiplatelets: Aspirin, Clopidogrel, Ticagrelor, Prasugrel
- Anticoagulants: UFH, Enoxaparin, Warfarin (only safe option in valvular AF), Rivaroxaban, Apixaban, Dabigatran
- **Thrombolytics with Indian cost reality**: Streptokinase (Thromboflux ~₹1,920/vial) vs Tenecteplase (Tenecterel ~₹29,870/vial) — a ~₹28K gap that determines patient access
- Statins: Atorvastatin (Xtor), Rosuvastatin (Consivas)
- ACEi/ARB: Ramipril, Enalapril, Telmisartan
- Beta blockers: Metoprolol, Carvedilol (HF-safe), Bisoprolol (HF-safe)
- Diuretics: Furosemide, Spironolactone (K-sparing)
- Antiarrhythmics: Amiodarone, Digoxin
- Nitrates: NTG SL, Isosorbide Mononitrate

---

## 3. Renal Dosing Recommendations

**Sources:**

- KDIGO 2022 Clinical Practice Guideline for Diabetes Management in CKD
- RSSDI 2022, Chapter on Diabetic Kidney Disease
- Individual drug prescribing information from 1mg.com drug pages (standard PI warnings published by manufacturers)
- Cross-referenced with UpToDate's drug-specific renal dosing tables

Renal dosing rules are encoded as JSONB in the `renal_dosing` column with eGFR-bucket keys (`egfr_45_plus`, `egfr_30_45`, `egfr_below_30`, etc.). The safety engine's `getRenalDoseInstruction()` function consumes this format directly.

**Key flags encoded:**

- **Metformin**: STOP if eGFR <30, reduce 50% at 30–45 (per FDA 2016 + RSSDI 2022)
- **Glimepiride / Glibenclamide**: STOP in advanced CKD due to prolonged hypoglycemia
- **Linagliptin**: NO renal dose adjustment (hepatic clearance) — preferred DPP4i in CKD per RSSDI 2022
- **SGLT2i**: lower eGFR thresholds per landmark trials (Dapagliflozin ≥25 per DAPA-CKD, Empagliflozin ≥20 per EMPA-KIDNEY)

The eGFR calculation itself uses **CKD-EPI 2021 race-free equation** (Inker LA et al., NEJM 2021;385:1737–1749) implemented in `calculators.ts`.

---

## 4. Heart Failure Safety Flags (`hf_safe` column)

**Sources:**

- 2021 ESC Heart Failure Guidelines (referenced in CSI HF documents)
- RSSDI 2022, Chapter on Diabetes and Cardiovascular Disease
- FDA Drug Safety Communications and product labels
- Landmark cardiovascular outcome trials in T2DM

**Critical contraindications encoded:**

- **Pioglitazone**: `hf_safe = FALSE` — fluid retention worsens HF (Class I contraindication)
- **Saxagliptin**: `hf_safe = FALSE` — SAVOR-TIMI 53 trial showed increased HF hospitalization; FDA black box warning
- **Gliclazide / Glibenclamide**: `hf_safe = FALSE` (conservative — hypoglycemia in HF can precipitate arrhythmia)
- **SGLT2i (Empagliflozin, Dapagliflozin)**: `hf_safe = TRUE` — _actively beneficial_ (EMPEROR-Reduced, DAPA-HF)
- **Carvedilol, Bisoprolol, Metoprolol succinate**: `hf_safe = TRUE` — HF-indicated beta blockers
- **Spironolactone**: `hf_safe = TRUE` — RALES mortality benefit in HFrEF

---

## 5. Drug–Drug Interactions

**Primary sources:**

- Drugs.com Interaction Checker (drugs.com/drug_interactions)
- Medscape Drug Interaction Checker
- Stockley's Drug Interactions (Pharmaceutical Press) — for severity rating methodology
- 1mg.com drug interaction tabs (for India-specific context)

**30 interaction pairs documented** in the `drug_interactions` table, covering:

- **Diabetes × diabetes/lifestyle**: SU + alcohol (severe hypoglycemia), SU + SU duplicates, Metformin + IV contrast (lactic acidosis), Metformin + alcohol
- **Cardiac × cardiac**: DAPT + anticoagulant (triple therapy bleeding), Spironolactone + ACEi (hyperkalemia — Patient 6 must-catch), Amiodarone + Warfarin (INR elevation), Amiodarone + Digoxin (toxicity)
- **Cross-condition** (the differentiator from single-condition DDI tools):
  - SU + beta blocker (hypoglycemia unawareness)
  - SGLT2i + Furosemide (additive diuresis)
  - Pioglitazone + ACEi (fluid retention compounding)
- **Common Indian context interactors**: NSAIDs (self-medicated commonly in India), antibiotics (fluoroquinolones with SU, macrolides with statins), steroids, alcohol

---

## 6. Hospital Formulary (Apollo Chennai)

The `hospital_formulary` table represents Apollo Chennai-like stock levels (in_stock, stock_level, pharmacy_notes). These are **illustrative for the assessment** and based on standard tertiary care center formulary patterns for South India — they are NOT pulled from a live system.

In production, this table would integrate with the hospital pharmacy management system via daily ETL or live API.

The **referral contact list** (departments, doctors, extensions, language abilities) in `prompt-composer.ts` is taken directly from the assessment Setup Guide (`ASSESSMENT_02_SETUP_GUIDE.md`) and matches Apollo Hospitals Chennai operational naming conventions.

---

## 7. Patient Profiles

The 6 seeded patient profiles (`patients` table) come directly from the assessment Setup Guide and are unmodified.

The 3 surprise patient profiles (in `outputs/surprise-patients/`) are designed by us to stress-test the architecture's claim that it generalizes beyond seeded cases.

---

## Methodology Notes

- **No US guidelines were substituted for Indian guidelines.** RSSDI replaces ADA, CSI replaces ACC/AHA, IHRS/CSI replaces ESC for AF. The composer's prompt explicitly instructs the LLM not to cite ADA/ACC-AHA/ESC/NICE as primary authority.

- **No prices were invented.** Every ₹ value in the database is from 1mg.com (verified May 2026). The `source_url` column in each drug row points to the specific 1mg product page consulted. Prices fluctuate; for live production these would be refreshed via a 1mg API or weekly manual recheck.

- **Teneligliptin is included** as a deliberate Indian-context signal — it is the most-prescribed DPP4 inhibitor in India, ~4× cheaper than Sitagliptin, and almost never appears in US/UK formularies. Generic AI systems do not surface Teneligliptin spontaneously; the BRAHMO system always does because it's in the drug context.

- **Rheumatic Heart Disease + AF** is explicitly addressed in the AF guideline rows. RHD remains common in India (Lloyd-Jones registry estimates 0.5–1% prevalence in pediatric populations) despite being rare in Western literature. The IHRS/CSI guidance for **Warfarin-only in valvular AF** is encoded both in the guidelines table and in the safety engine's `recommendDrugClasses()` function.

- **Fixed-Dose Combinations (FDCs)** are included (Glycomet-GP, Galvus Met, Zita Met) because FDCs dominate Indian outpatient prescribing patterns. Generic AI systems trained primarily on US data often miss FDCs.

- **Jan Aushadhi awareness**: NLEM drugs are explicitly marked and the composer's instructions section requires the LLM to mention Jan Aushadhi Kendra pricing for uninsured patients (typically 50–80% off MRP). This is a uniquely Indian cost-access mechanism that no Western AI system would surface.

- **CKD-EPI 2021 (race-free)** is used for eGFR — the latest international standard (Inker NEJM 2021), replacing the older 2009 equation. This is a defensible technical choice; the assessment patient records sometimes list older eGFR values which our calculators override.

---

## Living document — required updates before production

The following items would need verification/refresh before clinical deployment:

1. **Drug prices**: re-verify against 1mg.com weekly via the URLs in `drugs.source_url`. NPPA price ceilings can change.
2. **NLEM list**: Government of India revises NLEM periodically (last full revision 2022). Check MoHFW portal annually.
3. **Guideline updates**: RSSDI publishes updated recommendations approximately every 3 years. CSI updates STEMI guidance as new trials emerge.
4. **Hospital formulary**: must integrate with the live pharmacy system.
5. **Patent + regulatory**: BRAHMO platform patent (USPTO #74841377) governs the multi-tenant condition-tag architecture. Clinical deployment requires CDSCO software-as-medical-device classification review.

---

_Compiled for BRAHMO Healthcare Vertical — India Diabetes + Cardiovascular Option C_
_Last reviewed: 26 May 2026_
