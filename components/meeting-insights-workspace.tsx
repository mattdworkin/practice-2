"use client";

import { startTransition, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Sparkles } from "lucide-react";

import {
  MAX_MEETING_NOTES_LENGTH,
  type MeetingAnalysis,
} from "@/lib/meeting-analysis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AnalyzeMeetingApiResponse =
  | {
      analysis: MeetingAnalysis;
    }
  | {
      error: string;
    };

interface MeetingInsightsWorkspaceProps {
  initialAnalyses: MeetingAnalysis[];
  historyError: string | null;
  isLlmConfigured: boolean;
  userEmail: string | null;
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function sentimentStyles(sentiment: MeetingAnalysis["sentiment"]) {
  switch (sentiment) {
    case "positive":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300";
    case "negative":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300";
  }
}

export function MeetingInsightsWorkspace({
  initialAnalyses,
  historyError,
  isLlmConfigured,
  userEmail,
}: MeetingInsightsWorkspaceProps) {
  const [analyses, setAnalyses] = useState(initialAnalyses);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(
    initialAnalyses[0]?.id ?? null,
  );
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAnalysis =
    analyses.find((analysis) => analysis.id === selectedAnalysisId) ??
    analyses[0] ??
    null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedNotes = notes.trim();

    if (!trimmedNotes) {
      setSubmitError("Paste meeting notes before generating insights.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/analyze-meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: trimmedNotes,
        }),
      });

      const payload =
        ((await response.json().catch(() => null)) as AnalyzeMeetingApiResponse | null) ??
        null;

      if (!response.ok || !payload || !("analysis" in payload)) {
        setSubmitError(
          payload && "error" in payload
            ? payload.error
            : "Unable to generate insights right now.",
        );
        return;
      }

      startTransition(() => {
        setAnalyses((currentAnalyses) => [
          payload.analysis,
          ...currentAnalyses.filter(
            (analysis) => analysis.id !== payload.analysis.id,
          ),
        ]);
        setSelectedAnalysisId(payload.analysis.id);
        setNotes("");
      });
    } catch {
      setSubmitError("Unexpected network error while generating insights.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-slate-50 shadow-xl shadow-slate-950/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge className="w-fit border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-900/70">
              AI Meeting Insight Generator
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Turn raw meeting notes into a summary, key points, and clear next
              steps.
            </h1>
            <p className="text-sm leading-6 text-slate-300 sm:text-base">
              Paste a transcript or rough notes, generate structured insights,
              and keep every analysis tied to your account for quick follow-up.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
            <span className="font-medium text-slate-50">Signed in</span>
            <span className="truncate text-slate-300">
              {userEmail ?? "Authenticated user"}
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
        <div className="flex flex-col gap-8">
          <Card className="border-border/70">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>Generate insights</CardTitle>
              </div>
              <CardDescription>
                Use a single polished flow: paste notes, generate insights, and
                save the result automatically.
              </CardDescription>
              {!isLlmConfigured ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    `OPENAI_API_KEY` is not configured yet. The rest of the app
                    is ready, but generation is disabled until that env var is
                    set.
                  </span>
                </div>
              ) : null}
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <label
                      className="font-medium text-foreground"
                      htmlFor="meeting-notes"
                    >
                      Meeting notes or transcript
                    </label>
                    <span className="text-muted-foreground">
                      {notes.length.toLocaleString()}/
                      {MAX_MEETING_NOTES_LENGTH.toLocaleString()}
                    </span>
                  </div>
                  <textarea
                    id="meeting-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Paste meeting notes here. Include decisions, blockers, owners, and next steps if available."
                    className="min-h-64 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm leading-6 shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    maxLength={MAX_MEETING_NOTES_LENGTH}
                  />
                </div>

                {submitError ? (
                  <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                ) : null}

                {isSubmitting ? (
                  <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 animate-pulse" />
                    <span>Generating insights and saving the analysis...</span>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Notes are analyzed server-side and saved to your private
                    history.
                  </p>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !notes.trim() || !isLlmConfigured}
                  >
                    {isSubmitting ? "Generating..." : "Generate Insights"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Analysis details
              </CardTitle>
              <CardDescription>
                Review the latest output or reopen any previous analysis from
                the history panel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedAnalysis ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Saved analysis
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCreatedAt(selectedAnalysis.created_at)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("capitalize", sentimentStyles(selectedAnalysis.sentiment))}
                    >
                      {selectedAnalysis.sentiment}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Summary
                    </h2>
                    <p className="text-sm leading-6 text-foreground">
                      {selectedAnalysis.summary}
                    </p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Key points
                      </h2>
                      <ul className="space-y-2 text-sm leading-6 text-foreground">
                        {selectedAnalysis.key_points.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="rounded-xl border border-border/70 bg-background px-4 py-3"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Action items
                      </h2>
                      <ul className="space-y-2 text-sm leading-6 text-foreground">
                        {selectedAnalysis.action_items.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="rounded-xl border border-border/70 bg-background px-4 py-3"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Original notes
                    </h2>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <pre className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                        {selectedAnalysis.original_notes}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
                  No analyses yet. Paste meeting notes above to generate your
                  first saved insight set.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit border-border/70">
          <CardHeader className="space-y-2">
            <CardTitle>History</CardTitle>
            <CardDescription>
              Your saved analyses appear here in reverse chronological order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {historyError}
              </div>
            ) : null}

            {analyses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing saved yet.
              </div>
            ) : (
              analyses.map((analysis) => {
                const isSelected = analysis.id === selectedAnalysis?.id;

                return (
                  <button
                    key={analysis.id}
                    type="button"
                    className={cn(
                      "w-full rounded-2xl border px-4 py-4 text-left transition",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/70 bg-background hover:border-primary/40 hover:bg-muted/30",
                    )}
                    onClick={() => setSelectedAnalysisId(analysis.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          {truncate(analysis.summary, 96)}
                        </p>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {truncate(analysis.original_notes, 110)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 capitalize",
                          sentimentStyles(analysis.sentiment),
                        )}
                      >
                        {analysis.sentiment}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {formatCreatedAt(analysis.created_at)}
                    </p>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
