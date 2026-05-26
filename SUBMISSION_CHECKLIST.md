# Submission Checklist — BRAHMO India Clinical AI

**Deadline**: 27 May 2026 (extendable to 31 May)
**Submission target**: Astroum AI evaluation panel

Use this as a final pre-submission sweep. Don't trust memory.

---

## 1. Code & artifact deliverables

- [ ] **Final repo zip** built from latest `home/claude/repo/brahmo-india-clinical/`
- [ ] `package.json` has `groq-sdk` not `@anthropic-ai/sdk`
- [ ] `.env.local.example` has `GROQ_API_KEY` not `ANTHROPIC_API_KEY`
- [ ] `supabase/schema.sql` contains the `GRANT EXECUTE ON FUNCTION` lines for anon role
- [ ] `supabase/seed.sql` has 48 drugs, 30 interactions, 29 guidelines, 6 patients
- [ ] Warfarin (id=29) has tags `["cardiovascular", "atrial_fibrillation", "rheumatic_heart_disease"]`
- [ ] DOACs (id=30, 31, 32) have tags including `"atrial_fibrillation"` + notes mentioning valvular AF contraindication
- [ ] `src/lib/prompt-composer.ts` includes mitral stenosis in rheumatic regex
- [ ] `src/lib/safety-engine.ts` has the null-id substance interaction handling fix
- [ ] All UI works — patient picker, side-by-side, prompt inspector toggle

## 2. Required deliverables (per assessment)

- [ ] `docs/data_sources.md` — provenance of every clinical data point ✅
- [ ] `docs/architecture.md` — scalability explanation ✅
- [ ] Working application (zip + setup README) ✅
- [ ] 6 patient profiles handled correctly ✅
- [ ] At least 3 surprise patients tested ✅
- [ ] Demo materials / script ✅ (`outputs/demo-script.md`)

## 3. Pre-demo system test (30 min before live demo)

Run through all 6 patients in the UI:

- [ ] **Patient 1**: Sulfonamide allergy → safety engine flags SU; Option C recommends DPP4i not SU
- [ ] **Patient 2**: CKD 3b → safety engine STOPs Glimepiride; Option C recommends Linagliptin
- [ ] **Patient 3**: Auto-driver → Option C explicitly blocks SU for occupational reasons; mentions Jan Aushadhi
- [ ] **Patient 4**: STEMI → Option C cites CSI 2017, names Streptokinase ₹1920 vs Tenecteplase ₹29870
- [ ] **Patient 5**: Post-MI + AF → safety engine fires CHA₂DS₂-VASc; Option C mentions triple therapy + DOAC choice
- [ ] **Patient 6**: T2DM + HF + CKD → ALL critical flags fire (Glimepiride STOP, hyperkalemia risk, SGLT2i recommendation)

Then test 1–2 surprise patients via DevTools:
- [ ] **Patient 7** (RHD+AF): Option C explicitly recommends Warfarin (Warf, Cipla, ₹78.7) and says DOACs contraindicated
- [ ] **Patient 9** (cold STEMI): Empty meds list doesn't crash; Streptokinase cost call

If ANY of these fail → fix before demoing.

## 4. Demo environment prep

- [ ] Laptop charged + plugged in
- [ ] WiFi tested (Groq API requires network)
- [ ] http://localhost:3000 loaded
- [ ] DevTools open in second tab (for surprise patient via API)
- [ ] Patient 7 JSON copied to clipboard
- [ ] `seed.sql` open in editor tab
- [ ] `schema.sql` open in editor tab
- [ ] `safety-engine.ts` open in editor tab
- [ ] Slack/email/notifications muted
- [ ] Screen brightness up
- [ ] Browser zoom up to 110-125% if presenting on big screen

## 5. Demo script run-through

- [ ] Read `outputs/demo-script.md` end-to-end at least ONCE today
- [ ] Practice the opening hook (90 seconds) — say it out loud
- [ ] Practice the architecture pivot (Part 2) — the "respiratory tomorrow" line is your money quote
- [ ] Practice the closing pitch (90 seconds)
- [ ] Review Q&A section — anticipate questions

## 6. Files to submit

Pick the format the evaluator requested (email attachment / Google Drive / GitHub link):

- [ ] `brahmo-india-clinical.zip` (full repo, no node_modules)
- [ ] `docs/data_sources.md` (also included in zip; might want as separate attachment)
- [ ] `docs/architecture.md` (same)
- [ ] `outputs/demo-script.md` (might want separately if asked)
- [ ] A 1-page cover note (optional) — see template below

## 7. Cover note template (optional)

```
Subject: BRAHMO India Clinical AI — Option C Submission

Hi [Evaluator name],

Attached is my BRAHMO India Clinical AI submission for the Diabetes +
Cardiovascular Option C assessment.

What's included:
- Full Next.js + Supabase + Groq Llama application (zip)
- 5-table unified schema with 48 drugs (Indian brands, ₹ MRP, NLEM),
  30 drug-drug interactions, 29 RSSDI/CSI/IHRS/MoHFW guidelines
- 8-checker deterministic safety engine (CKD-EPI 2021, CHA₂DS₂-VASc,
  HF contraindications, hyperkalemia, hypoglycemia, drug interactions,
  allergies, drug recommendations)
- India-specific prompt composer with side-by-side cost comparisons
  and Jan Aushadhi awareness
- Side-by-side UI: Generic Llama vs Option C
- 6 seeded patients + 3 surprise patient JSONs (RHD+AF, pregnancy,
  cold STEMI) — all tested
- data_sources.md (required deliverable), architecture.md
- demo-script.md for the 22-minute walkthrough

Architecture commitment: adding a third condition (respiratory,
oncology, pediatrics) is a data-only operation. Zero schema changes,
zero code changes. The unified `condition_tags` JSONB column is the
mechanism.

Setup instructions in README.md. Demo runs end-to-end in ~5 minutes
from npm install.

Available to demo Mon-Fri at your convenience.

Best,
Rishabh
[contact info]
```

## 8. Final spot-checks before clicking send

- [ ] Email/attachment is actually attached
- [ ] Zip opens cleanly when downloaded fresh
- [ ] No `.env.local` accidentally included (check `.gitignore`)
- [ ] No `node_modules/` accidentally included
- [ ] No API keys in any committed file
- [ ] README.md is the polished version not the old one
- [ ] Cover note has no typos

## 9. Post-submission

- [ ] Save copy of submission email / artifacts locally
- [ ] Note time of submission
- [ ] Block calendar for likely demo windows (1-3 days after submission)
- [ ] Get sleep — sharp demo > great prep

---

## Quick troubleshooting

| Problem | Fix |
|---|---|
| "Missing Supabase env vars" | `.env.local` not present or wrong key names — copy from `.env.local.example` |
| "ANTHROPIC_API_KEY" error | You're on old code — make sure you pulled the Groq route.ts |
| Supabase RPC permission denied on `drugs_for_condition` | Re-run schema.sql with the GRANT EXECUTE lines |
| Llama responses cut off | `MAX_TOKENS` too low in `src/app/api/claude/route.ts` (should be 2200) |
| 401 on Groq | Verify API key at https://console.groq.com/keys — generate a new one if needed |
| Patient 7 doesn't show Warfarin brand | Re-run the seed.sql update for drug id=29 condition_tags |
| Generic Llama too brief | `route.ts` `MAX_TOKENS` applies to both calls; check the value |

---

Good luck. You've built something substantial. Trust the system; trust the script; trust the architecture story.
