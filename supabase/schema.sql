-- ============================================================
-- BRAHMO Clinical AI - Schema
-- ONE set of tables serves ALL conditions (diabetes, cardio, future)
-- Adding a new condition = data rows only, ZERO schema changes
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- TABLE 1: drugs
-- All medications (diabetes + cardiac + future conditions) in ONE table
-- ============================================================
CREATE TABLE drugs (
  id                        SERIAL PRIMARY KEY,
  generic_name              TEXT NOT NULL,
  generic_name_normalized   TEXT NOT NULL,
  drug_class                TEXT NOT NULL,
  drug_subclass             TEXT,
  indian_brand_name         TEXT NOT NULL,
  manufacturer              TEXT NOT NULL,
  mrp_price                 TEXT NOT NULL,           -- e.g. "₹84.8/strip of 10 (20mg)"
  nlem_status               BOOLEAN NOT NULL DEFAULT FALSE,
  renal_dosing              JSONB NOT NULL DEFAULT '{}'::jsonb,
  hf_safe                   BOOLEAN NOT NULL DEFAULT TRUE,
  weight_effect             TEXT CHECK (weight_effect IN ('gain', 'neutral', 'loss', '—')),
  hypoglycemia_risk         TEXT CHECK (hypoglycemia_risk IN ('low', 'moderate', 'high', '—')),
  condition_tags            JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_url                TEXT,
  notes                     TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast filtering by condition + class
CREATE INDEX idx_drugs_condition_tags   ON drugs USING GIN (condition_tags);
CREATE INDEX idx_drugs_class            ON drugs (drug_class);
CREATE INDEX idx_drugs_normalized       ON drugs (generic_name_normalized);
CREATE INDEX idx_drugs_nlem             ON drugs (nlem_status);
CREATE INDEX idx_drugs_hf_safe          ON drugs (hf_safe);


-- ============================================================
-- TABLE 2: drug_interactions
-- All interactions - including cross-condition (diabetes drug + cardiac drug)
-- ============================================================
CREATE TABLE drug_interactions (
  id                 SERIAL PRIMARY KEY,
  drug_a_id          INTEGER REFERENCES drugs(id) ON DELETE CASCADE,
  drug_a_name        TEXT,                            -- denormalized for non-DB interactors (e.g. "Alcohol")
  drug_b_id          INTEGER REFERENCES drugs(id) ON DELETE CASCADE,
  drug_b_name        TEXT,                            -- denormalized for non-DB interactors (e.g. "NSAIDs")
  severity           TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe', 'contraindicated')),
  mechanism          TEXT NOT NULL,
  clinical_effect    TEXT NOT NULL,
  management         TEXT NOT NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_drug_a    ON drug_interactions (drug_a_id);
CREATE INDEX idx_interactions_drug_b    ON drug_interactions (drug_b_id);
CREATE INDEX idx_interactions_severity  ON drug_interactions (severity);


-- ============================================================
-- TABLE 3: indian_guidelines
-- All guidelines (RSSDI, CSI, IHRS, MoHFW) in ONE table
-- ============================================================
CREATE TABLE indian_guidelines (
  id                 SERIAL PRIMARY KEY,
  source_id          TEXT NOT NULL,                   -- 'RSSDI', 'CSI', 'IHRS', 'MoHFW_STG', 'RSSDI+CSI'
  year               INTEGER NOT NULL,
  condition          TEXT NOT NULL,
  section            TEXT NOT NULL,
  recommendation     TEXT NOT NULL,
  evidence_level     TEXT CHECK (evidence_level IN ('A', 'B', 'C', 'D', '—')),
  condition_tags     JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guidelines_tags        ON indian_guidelines USING GIN (condition_tags);
CREATE INDEX idx_guidelines_source      ON indian_guidelines (source_id);
CREATE INDEX idx_guidelines_condition   ON indian_guidelines (condition);


-- ============================================================
-- TABLE 4: hospital_formulary
-- Drug availability at Apollo Chennai (or any hospital - swap rows)
-- ============================================================
CREATE TABLE hospital_formulary (
  id             SERIAL PRIMARY KEY,
  drug_id        INTEGER NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  in_stock       BOOLEAN NOT NULL DEFAULT TRUE,
  stock_level    TEXT CHECK (stock_level IN ('high', 'moderate', 'low', '—')),
  pharmacy_notes TEXT,
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (drug_id)
);

CREATE INDEX idx_formulary_drug_id      ON hospital_formulary (drug_id);
CREATE INDEX idx_formulary_in_stock     ON hospital_formulary (in_stock);


-- ============================================================
-- TABLE 5: patients (optional convenience - your 6 demo patients)
-- Not required by the spec but useful for the UI
-- ============================================================
CREATE TABLE patients (
  id                 SERIAL PRIMARY KEY,
  patient_label      TEXT NOT NULL,                   -- "Failing Metformin", "Acute STEMI" etc.
  age                INTEGER NOT NULL,
  sex                TEXT CHECK (sex IN ('M', 'F', 'Other')),
  bmi                NUMERIC(4,1),
  conditions         JSONB NOT NULL DEFAULT '[]'::jsonb,
  medications        JSONB NOT NULL DEFAULT '[]'::jsonb,
  allergies          JSONB NOT NULL DEFAULT '[]'::jsonb,
  labs               JSONB NOT NULL DEFAULT '{}'::jsonb,
  vitals             JSONB NOT NULL DEFAULT '{}'::jsonb,
  insurance          JSONB NOT NULL DEFAULT '{}'::jsonb,
  income_context     TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- ROW LEVEL SECURITY (RLS) — required by Supabase
-- Public read for clinical reference data (drugs, guidelines, interactions, formulary, patients)
-- ============================================================
ALTER TABLE drugs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE indian_guidelines  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_formulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read drugs"              ON drugs              FOR SELECT USING (true);
CREATE POLICY "Public read interactions"       ON drug_interactions  FOR SELECT USING (true);
CREATE POLICY "Public read guidelines"         ON indian_guidelines  FOR SELECT USING (true);
CREATE POLICY "Public read formulary"          ON hospital_formulary FOR SELECT USING (true);
CREATE POLICY "Public read patients"           ON patients           FOR SELECT USING (true);


-- ============================================================
-- HELPER VIEWS — pre-joined for the prompt composer
-- ============================================================

-- Drugs with formulary status joined in
CREATE VIEW v_drugs_with_formulary AS
SELECT
  d.*,
  COALESCE(f.in_stock, false)    AS in_stock,
  f.stock_level,
  f.pharmacy_notes
FROM drugs d
LEFT JOIN hospital_formulary f ON f.drug_id = d.id;

-- Guidelines filtered by condition tag (call: SELECT * FROM v_guidelines_by_tag WHERE tag = 'diabetes')
CREATE OR REPLACE FUNCTION guidelines_for_condition(p_tag TEXT)
RETURNS SETOF indian_guidelines AS $$
  SELECT * FROM indian_guidelines
  WHERE condition_tags ? p_tag
  ORDER BY year DESC, source_id, id;
$$ LANGUAGE SQL STABLE;

-- Drugs filtered by condition tag
CREATE OR REPLACE FUNCTION drugs_for_condition(p_tag TEXT)
RETURNS SETOF drugs AS $$
  SELECT * FROM drugs
  WHERE condition_tags ? p_tag
  ORDER BY drug_class, generic_name;
$$ LANGUAGE SQL STABLE;


-- Allow anon + authenticated roles to call helper functions via RPC
GRANT EXECUTE ON FUNCTION guidelines_for_condition(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION drugs_for_condition(TEXT)      TO anon, authenticated;
