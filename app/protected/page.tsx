import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { MeetingInsightsWorkspace } from "@/components/meeting-insights-workspace";
import { type MeetingAnalysis } from "@/lib/meeting-analysis";
import { isInsightsGenerationConfigured } from "@/lib/meeting-insights";
import { createClient } from "@/lib/supabase/server";

async function ProtectedPageContent() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("meeting_analyses")
    .select("*")
    .order("created_at", { ascending: false });

  const historyError = error
    ? error.code === "42P01"
      ? "Run the meeting_analyses SQL migration to enable saved history."
      : "Previous analyses could not be loaded right now."
    : null;
  const initialAnalyses = (data ?? []) as MeetingAnalysis[];

  return (
    <MeetingInsightsWorkspace
      initialAnalyses={initialAnalyses}
      historyError={historyError}
      isLlmConfigured={isInsightsGenerationConfigured()}
      userEmail={user.email ?? null}
    />
  );
}

export default function ProtectedPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">
          Loading your workspace...
        </div>
      }
    >
      <ProtectedPageContent />
    </Suspense>
  );
}
