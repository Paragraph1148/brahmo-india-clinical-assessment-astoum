# Surprise Patient Test Suite

Three patients NOT in your seed data — designed to stress-test the architecture's claim that it generalizes.

## How to test

Run your dev server (`npm run dev`), then either:

### Browser DevTools (fastest)

```javascript
// open http://localhost:3000, open DevTools console, paste:
const payload = /* paste contents of any patientN.json here */;
const r = await fetch('/api/claude', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(payload)
}).then(r => r.json());
console.log('=== SAFETY ENGINE ===');
console.log(r.safety_report.flags.map(f => `[${f.severity}] ${f.title}`).join('\n'));
console.log('=== GENERIC ===');
console.log(r.generic.response);
console.log('=== OPTION C ===');
console.log(r.optionC.response);
```

### curl + jq

```bash
curl -X POST http://localhost:3000/api/claude \
  -H "Content-Type: application/json" \
  -d @patient7-rhd-af-dm.json | jq '.optionC.response, .safety_report.flags'
```

---

## Patient 7 — RHD + AF + New T2DM

**Stress test**: Valvular AF (RHD-driven) where DOACs are CONTRAINDICATED — must use Warfarin only. Also lifelong penicillin prophylaxis interaction context. Plus new T2DM start.

### What MUST happen
- Safety engine: CHA₂DS₂-VASc fires (likely 3-4 — age, female, diabetes, vascular if you include MS)
- Option C: **Warfarin MUST be recommended, DOACs CONTRAINDICATED** (RHD/MS) — IHRS/CSI 2018
- Option C: INR target 2-3 (mechanical valve target is higher 2.5-3.5; native valve MS is 2-3)
- Option C: First-line Metformin for new T2DM (eGFR fine, no contraindications)
- Option C: Rate control for AF (HR 118 — needs beta-blocker, but use one safe in MS — Bisoprolol or Metoprolol)
- Option C: Continue penicillin prophylaxis (lifelong for RHD per Indian rheumatic fever guidelines)

### What it tests
- Does the safety engine know "rheumatic" → don't recommend DOAC?
- Does the prompt composer pull the "rheumatic_heart_disease" tag and surface valvular AF guidance?
- Does Llama distinguish valvular vs non-valvular AF?

**If it recommends Apixaban/Dabigatran, the system has FAILED for this case.**

---

## Patient 8 — Pregnant + T2DM

**Stress test**: Pregnancy is not deeply modeled in your DB. Tests graceful handling + critical "stop Glimepiride" call.

### What MUST happen
- Option C: **STOP Glimepiride** (teratogenic concerns, neonatal hypoglycemia)
- Option C: Continue Metformin (FIGO/RCOG considers safe; RSSDI 2022 supports continuation in pregnancy)
- Option C: Transition to insulin (NPH/Regular, or analogues like Detemir/Aspart which are pregnancy category B)
- Option C: Glycemic targets: FBS <95, 1h PP <140 (or 2h PP <120) — these are pregnancy-specific
- Option C: Refer to high-risk obstetrics + endocrinology
- Should NOT recommend SGLT2i, DPP4i, or GLP1RA (pregnancy contraindications)

### What it tests
- Does the system fail gracefully when "pregnancy" isn't in your condition_tags?
- Or does the LLM with rich context still produce correct answer?

**Possible result: the safety engine might miss pregnancy-specific drug avoidance — flag this as a "known limitation; we'd add pregnancy condition_tag in next iteration".** That's honest and acceptable for assessment.

---

## Patient 9 — STEMI + New Hyperglycemia + Uninsured

**Stress test**: 
1. Empty medication list (does the safety engine crash?)
2. Multi-emergency: STEMI + uncontrolled hyperglycemia simultaneously
3. Aspirin allergy (mild rash) — does the system know rash ≠ anaphylaxis?
4. Inferior STEMI specifically (different concerns than anterior — right ventricular involvement risk)

### What MUST happen
- Safety engine: empty meds → no interaction flags but no crashes either
- Option C: **Immediate dual antiplatelet** — Aspirin can be used (mild rash ≠ contraindication, but document and monitor) OR start with Clopidogrel/Ticagrelor alone if cautious
- Option C: **Streptokinase preferred** for cost (uninsured, ₹600/day wage) — ₹1920 vs Tenecteplase ₹29,870
- Option C: CSI 2017 inferior STEMI specifics — careful with nitrates (RV infarct risk), avoid aggressive preload reduction
- Option C: Insulin infusion for glucose >180 in ACS (RSSDI post-MI guidance — not oral agents during acute phase)
- Option C: HbA1c 9.8 confirms T2DM, but management starts AFTER acute MI stabilizes
- Option C: Apollo contacts — Dr. Venkat (Cath lab ext 4455), CCU ext 3322, Code STEMI

### What it tests
- Empty medications list — system handles gracefully?
- Multi-condition priority — does Option C correctly say "STEMI first, diabetes later"?
- Aspirin allergy nuance — rash vs anaphylaxis distinction?

---

## What to look for in outputs

### 🟢 GOOD signs
- Safety engine fires zero/sensible flags (not crashing on empty meds, correct flags fire)
- Option C cites RSSDI / CSI / IHRS specifically
- Specific Indian brands + ₹ prices
- Patient 7: explicit Warfarin recommendation + DOACs contraindicated
- Patient 8: explicit Glimepiride stop + Metformin continue + insulin transition
- Patient 9: STEMI first, diabetes second, Streptokinase cost call

### 🔴 BAD signs (means we need to fix something)
- Crash or error on any patient
- Patient 7: DOAC recommended (architecture failure)
- Patient 8: GLP-1 / SGLT2i suggested (pregnancy contraindication missed)
- Patient 9: Aspirin completely avoided due to "allergy" without nuance
- Llama hallucinating drug names not in your context

---

## How to report results back

For each patient, just paste:
1. The safety_report.flags (one-liners)
2. The Option C response
3. A sentence on whether it nailed the key challenge

We'll iterate on anything that's weak before the demo.
