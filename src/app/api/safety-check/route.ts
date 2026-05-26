// =================================================================
// POST /api/safety-check
// Body: { patient: Patient }   OR   { patient_id: number }
// Returns: SafetyReport
// =================================================================
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { runSafetyChecks } from "@/lib/safety-engine";
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

    const report = await runSafetyChecks(patient);
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Safety engine error" },
      { status: 500 }
    );
  }
}
