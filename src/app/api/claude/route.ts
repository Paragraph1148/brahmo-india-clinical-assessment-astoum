// =================================================================
// POST /api/claude
// Body: { patient_id: number, question: string }
//
// Returns: {
//   optionC:  { prompt, response, meta },
//   generic:  { prompt, response },
//   safety_report
// }
//
// Calls the LLM TWICE in parallel:
//   1. Generic baseline (no India context) — proves the contrast
//   2. Option C with full India-injected context
//
// Currently wired to Groq's free-tier Llama. The route path is kept as
// `/api/claude` so the rest of the app doesn't need to change. To swap
// back to Anthropic, replace the Groq client with the Anthropic SDK.
// =================================================================
import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { supabase } from "@/lib/supabase";
import { runSafetyChecks } from "@/lib/safety-engine";
import { composePrompt } from "@/lib/prompt-composer";
import type { Patient } from "@/lib/types";

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

// Llama 4 Scout 17B - Groq's free-tier large model, good for clinical text.
// Alternates: 'llama-3.3-70b-versatile' (slower, higher quality),
//             'llama-3.1-8b-instant' (fastest, lower quality).
const MODEL = "llama-3.3-70b-versatile";
const MAX_TOKENS = 2200; // increased so the structured response has room for cost comparisons + sections

async function callLLM(prompt: string): Promise<string> {
  if (!groq) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to .env.local (get one free at https://console.groq.com/keys) and restart the dev server.",
    );
  }

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3, // lower temp for clinical content
    max_tokens: MAX_TOKENS,
    top_p: 1,
    stream: false,
  });

  return completion.choices[0]?.message?.content || "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let patient: Patient | null = null;

    if (body.patient) {
      patient = body.patient as Patient;
    } else if (typeof body.patient_id === "number") {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", body.patient_id)
        .single();
      if (error) throw error;
      patient = data as Patient;
    }

    if (!patient) {
      return NextResponse.json(
        { error: "Provide `patient` object or `patient_id`" },
        { status: 400 },
      );
    }

    const question = (body.question || "").toString().trim();
    if (!question) {
      return NextResponse.json(
        { error: "Provide a clinical `question`" },
        { status: 400 },
      );
    }

    // 1. Run safety engine
    const safetyReport = await runSafetyChecks(patient);

    // 2. Compose both prompts
    const prompts = await composePrompt(patient, safetyReport, question);

    // 3. Call LLM in parallel for both
    const [genericResp, optionCResp] = await Promise.all([
      callLLM(prompts.generic),
      callLLM(prompts.optionC),
    ]);

    return NextResponse.json({
      optionC: {
        prompt: prompts.optionC,
        response: optionCResp,
        meta: prompts.meta,
      },
      generic: {
        prompt: prompts.generic,
        response: genericResp,
      },
      safety_report: safetyReport,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "LLM API error" },
      { status: 500 },
    );
  }
}
