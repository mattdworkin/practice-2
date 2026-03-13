import { NextResponse } from "next/server";

import {
  parseMeetingNotesInput,
  type MeetingAnalysis,
  type MeetingAnalysisInsert,
} from "@/lib/meeting-analysis";
import {
  InsightGenerationError,
  generateMeetingInsights,
} from "@/lib/meeting-insights";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "You must be signed in to analyze meeting notes." },
      { status: 401 },
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const { notes, error: validationError } = parseMeetingNotesInput(requestBody);

  if (validationError || !notes) {
    return NextResponse.json(
      { error: validationError ?? "Meeting notes are required." },
      { status: 400 },
    );
  }

  try {
    const insights = await generateMeetingInsights(notes);
    const payload: MeetingAnalysisInsert = {
      user_id: user.id,
      original_notes: notes,
      summary: insights.summary,
      key_points: insights.key_points,
      action_items: insights.action_items,
      sentiment: insights.sentiment,
    };

    const { data, error } = await supabase
      .from("meeting_analyses")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      const message =
        error?.code === "42P01"
          ? "The meeting_analyses table is missing. Run the SQL migration first."
          : "Insights were generated, but saving to Supabase failed.";

      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({
      analysis: data as MeetingAnalysis,
    });
  } catch (error) {
    if (error instanceof InsightGenerationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Unexpected server error while generating insights." },
      { status: 500 },
    );
  }
}
