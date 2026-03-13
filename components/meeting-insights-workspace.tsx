"use client";

import { startTransition, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  Sparkles,
} from "lucide-react";

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

const SAMPLE_MEETING_NOTES = `Product sync with Maya, Jordan, and Priya.

- We agreed to ship the meeting insight generator demo on Friday.
- Jordan finished Supabase auth and confirmed sign-in/sign-out is stable.
- Priya asked for a cleaner loading state and more polished empty states before the interview.
- We decided to keep the current architecture and avoid adding new dependencies.
- Action: Maya will tighten the prompt and error handling today.
- Action: Priya will polish the history list and result layout by Thursday afternoon.
- Risk: We still need to verify the Vercel env vars before the final demo.

Overall tone was positive and focused, with some urgency around final QA.`;

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatHistoryTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function getValidationMessage(notes: string) {
  if (!notes.trim()) {
    return "Add meeting notes to continue.";
  }

  if (notes.length > MAX_MEETING_NOTES_LENGTH) {
    return `Keep meeting notes under ${MAX_MEETING_NOTES_LENGTH.toLocaleString()} characters.`;
  }

  return null;
}

function getErrorMessage(error: string | null) {
  if (!error) {
    return null;
  }

  if (
    error.includes("OPENAI_API_KEY") ||
    error.includes("not configured on the server")
  ) {
    return "AI generation is not configured right now.";
  }

  if (error.includes("table is missing")) {
    return "History storage is not ready yet.";
  }

  if (
    error.includes("invalid JSON") ||
    error.includes("expected schema") ||
    error.includes("no structured output")
  ) {
    return "The model returned an incomplete result. Please try again.";
  }

  if (error.includes("network")) {
    return "Network issue. Please try again.";
  }

  return "We couldn’t generate insights right now. Please try again.";
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
  const validationMessage = getValidationMessage(notes);
  const displayError = getErrorMessage(submitError);

  const selectedAnalysis =
    analyses.find((analysis) => analysis.id === selectedAnalysisId) ??
    analyses[0] ??
    null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedNotes = notes.trim();
    const nextValidationMessage = getValidationMessage(notes);

    if (nextValidationMessage) {
      setSubmitError(nextValidationMessage);
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
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Turn meeting notes into a clear summary and action plan.
          </h1>
          <p className="text-sm leading-6 text-slate-300 sm:text-base">
            Paste a transcript or rough notes, generate structured insights,
            and keep every analysis in one place.
          </p>
          {userEmail ? (
            <p className="text-sm text-slate-400">{userEmail}</p>
          ) : null}
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
                Paste notes, generate a polished analysis, and save it to your
                private history automatically.
              </CardDescription>
              {!isLlmConfigured ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    AI generation is unavailable until `OPENAI_API_KEY` is set.
                  </span>
                </div>
              ) : null}
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-3">
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
                    onChange={(event) => {
                      setNotes(event.target.value);
                      if (submitError) {
                        setSubmitError(null);
                      }
                    }}
                    placeholder="Paste a transcript, summary notes, or bullet-point recap. Include decisions, blockers, owners, and deadlines if you have them."
                    className="min-h-72 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm leading-6 shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    maxLength={MAX_MEETING_NOTES_LENGTH}
                    aria-invalid={Boolean(displayError)}
                  />
                  <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      Tip: raw notes are fine. The app will summarize, extract
                      key points, and capture follow-up actions.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNotes(SAMPLE_MEETING_NOTES);
                          setSubmitError(null);
                        }}
                        disabled={isSubmitting}
                      >
                        Use sample notes
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNotes("");
                          setSubmitError(null);
                        }}
                        disabled={isSubmitting || notes.length === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>

                {displayError ? (
                  <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{displayError}</span>
                  </div>
                ) : validationMessage && !isSubmitting ? (
                  <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    {validationMessage}
                  </div>
                ) : isSubmitting ? (
                  <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 animate-pulse" />
                    <span>Generating insights and saving to history...</span>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Analysis runs server-side and is saved to your account.
                  </p>
                  <Button
                    type="submit"
                    disabled={
                      isSubmitting || Boolean(validationMessage) || !isLlmConfigured
                    }
                    aria-busy={isSubmitting}
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
                Insight details
              </CardTitle>
              <CardDescription>
                Review the latest result or open any saved analysis from the
                history panel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedAnalysis ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Saved Analysis
                      </p>
                      <p className="text-sm font-medium text-foreground">
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

                  <section className="space-y-2 rounded-2xl border border-border/70 bg-background p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Summary
                    </h2>
                    <p className="text-sm leading-6 text-foreground">
                      {selectedAnalysis.summary}
                    </p>
                  </section>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <section className="space-y-3 rounded-2xl border border-border/70 bg-background p-5">
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
                    </section>

                    <section className="space-y-3 rounded-2xl border border-border/70 bg-background p-5">
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
                    </section>
                  </div>

                  <section className="space-y-3 rounded-2xl border border-border/70 bg-background p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Original notes
                    </h2>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <pre className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                        {selectedAnalysis.original_notes}
                      </pre>
                    </div>
                  </section>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                  <FileText className="mx-auto h-9 w-9 text-muted-foreground" />
                  <h2 className="mt-4 text-sm font-medium text-foreground">
                    Your next analysis will appear here
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Paste meeting notes and generate insights to populate this
                    view.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit border-border/70">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              History
            </CardTitle>
            <CardDescription>
              Saved analyses appear here in reverse chronological order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {historyError}
              </div>
            ) : null}

            {analyses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
                <History className="mx-auto h-8 w-8 text-muted-foreground" />
                <h2 className="mt-4 text-sm font-medium text-foreground">
                  No saved analyses yet
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Generate your first meeting insight to start building history.
                </p>
              </div>
            ) : (
              analyses.map((analysis) => {
                const isSelected = analysis.id === selectedAnalysis?.id;

                return (
                  <button
                    key={analysis.id}
                    type="button"
                    className={cn(
                      "w-full rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/70 bg-background hover:border-primary/40 hover:bg-muted/30",
                    )}
                    onClick={() => setSelectedAnalysisId(analysis.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          <span>{formatHistoryDate(analysis.created_at)}</span>
                          <span className="text-border">•</span>
                          <span>{formatHistoryTime(analysis.created_at)}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {truncate(analysis.summary, 88)}
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {truncate(analysis.original_notes.replace(/\s+/g, " "), 120)}
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
