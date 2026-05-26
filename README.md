# BRAHMO Clinical AI — India

> Indian-context clinical decision support for **Type 2 Diabetes** and **Cardiovascular Disease**. Built for Apollo Chennai. Cites RSSDI + CSI (not ADA/ACC-AHA), uses Indian drug brands with ₹ MRP, includes NLEM pricing and Jan Aushadhi awareness, and surfaces hospital-specific referrals.

**Patent**: BRAHMO platform, USPTO #74841377 (multi-tenant condition-tag clinical decision architecture).

---

## What this system does

Generic AI gives American answers to Indian doctors. This system fixes that.

| Generic AI says | Option C says |
|---|---|
| "Consider DPP4 inhibitor" | "Teneligliptin (Dynaglipt, Mankind Pharma, ₹84.8/strip of 10, non-NLEM)" |
| "Affordable" | "₹160/mo retail → ₹40/mo at Jan Aushadhi Kendra (75% savings)" |
| "Per ADA guidelines" | "Per RSSDI 2022" |
| "Consult a dietitian" | "Refer to Ms. Priya Raman, Dietitian ext 3350 (South Indian diet specialist)" |
| "Apixaban for AF" *(dangerous in valvular AF)* | "Warfarin only — DOACs CONTRAINDICATED in rheumatic mitral stenosis" |
| "Streptokinase or Tenecteplase" | "Streptokinase ₹1,920 vs Tenecteplase ₹29,870 — ₹28K gap, NLEM availability" |

---

## Architecture — one schema, zero code per condition

The system commits to a structural rule: **adding a third condition (respiratory, oncology, pediatrics) requires DATA changes, not code changes.**

```
src/
├── app/
│   ├── page.tsx                      ← Patient picker + side-by-side comparison UI
│   ├── layout.tsx, globals.css
│   └── api/
│       ├── safety-check/route.ts     ← Runs deterministic safety engine
│       ├── compose-prompt/route.ts   ← Inspects composed prompt without LLM call
│       └── claude/route.ts           ← Calls Groq Llama 70B for generic + Option C
├── lib/
│   ├── types.ts                      ← Patient, Drug, SafetyFlag, SafetyReport, etc.
│   ├── supabase.ts                   ← DB client
│   ├── calculators.ts                ← eGFR (CKD-EPI 2021), CHA₂DS₂-VASc, BMI
│   ├── safety-engine.ts              ← 8 independent safety checkers
│   └── prompt-composer.ts            ← Builds India-specific prompt from DB
└── components/

supabase/
├── schema.sql                        ← 5 tables, RLS policies, helper SQL functions
└── seed.sql                          ← 48 drugs, 30 interactions, 29 guidelines, 6 patients

docs/
├── data_sources.md                   ← Provenance of every clinical data point
└── architecture.md                   ← Scalability proof / tag-based polymorphism

outputs/                              ← Demo materials
├── demo-script.md                    ← 22-min walkthrough script with Q&A
├── patient-questions.md              ← Suggested clinical questions per patient
└── surprise-patients/                ← Untested patient JSONs that the system handles
```

---

## Quickstart (local dev)

### Prerequisites
- Node.js 18+ (tested on 20)
- A free Supabase project (https://supabase.com — sign up with Google)
- A free Groq API key (https://console.groq.com — generous free tier on Llama 70B)

### 1. Install dependencies
```bash
npm install
```

### 2. Create Supabase project
1. Sign up at https://supabase.com
2. New project: `brahmo-india-clinical`, region **Mumbai (ap-south-1)** for low latency
3. Wait ~2 min for provisioning
4. **Settings → API**: copy `Project URL` and `anon public` key

### 3. Set environment variables
```bash
cp .env.local.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
#   GROQ_API_KEY=gsk_...
```

### 4. Load the database
In Supabase **SQL Editor** → New query:
1. Paste contents of `supabase/schema.sql` → Run
2. New query → paste `supabase/seed.sql` → Run

Verify:
```sql
SELECT COUNT(*) FROM drugs;              -- 48
SELECT COUNT(*) FROM indian_guidelines;  -- 29
SELECT COUNT(*) FROM drug_interactions;  -- 30
SELECT COUNT(*) FROM patients;           -- 6
SELECT * FROM drugs_for_condition('diabetes') LIMIT 5;
```

### 5. Run the dev server
```bash
npm run dev
```

Open http://localhost:3000 — 6 patients in the sidebar. Click any one to run the safety engine; ask a clinical question to see Generic vs Option C side-by-side.

---

## What's built (Phase status)

| Phase | Status | Deliverable |
|-------|:-:|---|
| 1. Data research | ✅ | 48 drugs, 30 interactions, 29 guidelines from RSSDI/CSI/IHRS/MoHFW |
| 2. Database | ✅ | 5 Supabase tables, RLS, helper SQL functions |
| 3. Safety engine | ✅ | 8 deterministic checkers + CKD-EPI 2021 + CHA₂DS₂-VASc |
| 4. Prompt composer | ✅ | India-specific instructions with side-by-side cost comparisons |
| 5. UI | ✅ | Patient picker, suggested questions, Generic vs Option C, prompt inspector |
| 6. Testing | ✅ | All 6 seeded patients + 3 surprise patients (RHD+AF, pregnancy, STEMI-cold) |

---

## The scalability proof

> *"If you asked me to add Respiratory Medicine tomorrow:*
>
> 1. *Research Indian Chest Society guidelines (1–2 hrs)*
> 2. *Source inhaler brands + ₹ from 1mg.com (1–2 hrs)*
> 3. *`INSERT` drug rows with `condition_tags = ['respiratory', 'asthma']`*
> 4. *`INSERT` guideline rows with the same tags*
> 5. *`INSERT` interaction pairs for inhaler × cardiac drugs*
>
> ***Zero schema changes. Zero code changes.** The safety engine reads `condition_tags` and `renal_dosing` JSONB dynamically. `drugs_for_condition('respiratory')` works immediately."*

See `docs/architecture.md` for the technical details.

---

## Demo patients (preloaded in seed.sql)

| # | Profile | Key teaching point |
|---|---|---|
| 1 | 48M T2DM, sulfa allergy, ₹5K insurance cap | Second-line drug under cost + allergy constraints |
| 2 | 62F T2DM + CKD 3b | Auto-stop Glimepiride, switch to insulin/Linagliptin |
| 3 | 34M auto-driver, no insurance | NLEM cheapest options, occupational hypoglycemia hazard |
| 4 | 52M STEMI, penicillin anaphylaxis | CSI 2017 time-stamped protocol, Streptokinase vs Tenecteplase |
| 5 | 66M post-MI + new AF | Triple therapy duration, DOAC choice, CHA₂DS₂-VASc |
| 6 | 58F T2DM + HF + CKD, K+ 5.1 | **Money demo** — multi-guideline merge, multiple safety flags, SGLT2i first-line |

Plus 3 stress-test surprise patients in `outputs/surprise-patients/`:

| # | Profile | What it tests |
|---|---|---|
| 7 | 45F RHD + AF + new T2DM | Valvular AF — DOACs CONTRAINDICATED, Warfarin only |
| 8 | 28F pregnant + T2DM | Pregnancy-specific drug avoidance (next-iteration scope) |
| 9 | 60M STEMI + new hyperglycemia | Empty meds list, multi-emergency, Aspirin allergy nuance |

---

## Technology choices

- **Next.js 14** (App Router) + **TypeScript** — type safety on Patient/Drug/SafetyReport
- **Supabase** (Postgres) — JSONB for condition_tags / renal_dosing / labs; RLS policies
- **Groq Llama 3.3 70B** — free-tier large LLM for the assessment; production would use Claude Sonnet
- **Tailwind CSS** — utility styling
- **Pure TypeScript safety engine** — no LLM call needed for safety; deterministic output

---

## Costs & latency

- **Per consult**: free on Groq tier. Production on Claude Sonnet ~$0.02 including parallel generic baseline call.
- **Safety engine**: <100ms
- **Prompt composer**: ~200ms (2 SQL calls)
- **LLM call**: 8–15s on Llama 70B, 4–8s on Claude
- **End-to-end consult**: ~15s on Llama, ~10s on Claude

---

## Data provenance

All clinical data was researched from authoritative Indian sources. See `docs/data_sources.md` for full citations including:

- RSSDI 2022 Clinical Practice Recommendations (Springer / IJDDC)
- CSI 2017 STEMI Position Statement (Indian Heart Journal Suppl 1)
- IHRS/CSI 2018 AF guidance
- MoHFW NLEM 2022 (Government of India)
- Drug brands + ₹ MRP from 1mg.com (Tata 1mg) — verified May 2026

---

## Production roadmap

1. **Weeks 1–4**: Apollo Chennai internal pilot — endocrine + cardiac + nephro departments
2. **Weeks 5–8**: EHR integration (Apollo Health Connect or HL7 FHIR)
3. **Weeks 9–12**: Add third condition vertical (Respiratory Medicine — Indian Chest Society guidelines)
4. **Months 4–6**: CDSCO Software-as-Medical-Device classification review
5. **Months 6–12**: Multi-hospital rollout (Apollo network)

---

## Limitations (honest)

- **Pregnancy not deeply modeled** — Patient 8 testing shows the LLM handles most pregnancy diabetes via general knowledge, but our safety engine doesn't catch teratogenicity deterministically. Fix: add `pregnancy` condition_tag, no schema change required.
- **No live drug price refresh** — Prices baked into seed.sql. Production needs 1mg API integration for weekly refresh.
- **Hospital formulary is illustrative** — stock levels are placeholder; production needs live pharmacy system integration.
- **Llama 70B is the demo LLM** — not the production choice. Claude Sonnet performs better on multi-constraint clinical reasoning. Route swap is one line.
- **No drug master mapping** — currently uses fuzzy name matching. Production needs RxNorm-India equivalent for reliable EHR integration.

---

## License

Patent pending — USPTO #74841377 (BRAHMO platform). Code for Astroum AI assessment use only.
# brahmo-india-clinical-assessment
# brahmo-india-clinical-assessment-astoum
