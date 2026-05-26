// =================================================================
// POST /api/compose-prompt
// Body: { patient_id: number, question: string }
//   - Optional: { patient: Patient, ... } to skip DB lookup
//
// Returns: { optionC, generic, meta, safety_report }
//
// This endpoint composes the prompts WITHOUT calling Claude.
// Useful for inspecting the prompts in the UI before sending.
// =================================================================
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { runSafetyChecks } from "@/lib/safety-engine";
import { composePrompt } from "@/lib/prompt-composer";
import type { Patient } from "@/lib/types";

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
        { status: 400 }
      );
    }

    const question = (body.question || "").toString().trim();
    if (!question) {
      return NextResponse.json(
        { error: "Provide a clinical `question`" },
        { status: 400 }
      );
    }

    const safetyReport = await runSafetyChecks(patient);
    const prompts = await composePrompt(patient, safetyReport, question);

    return NextResponse.json({
      ...prompts,
      safety_report: safetyReport,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Compose-prompt error" },
      { status: 500 }
    );
  }
}
