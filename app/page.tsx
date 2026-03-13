import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hasEnvVars } from "@/lib/utils";
import { ArrowRight, Brain, FolderClock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="flex min-h-screen flex-col items-center">
        <nav className="w-full border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 text-sm">
            <Link href="/" className="font-semibold tracking-tight">
              Meeting Insight Generator
            </Link>
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              {!hasEnvVars ? (
                <EnvVarWarning />
              ) : (
                <Suspense>
                  <AuthButton />
                </Suspense>
              )}
            </div>
          </div>
        </nav>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12 px-5 py-12 lg:flex-row lg:items-center">
          <section className="max-w-2xl space-y-6">
            <Badge variant="outline" className="w-fit">
              Clean vertical slice
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Demo-ready AI meeting insights with auth, persistence, and
                history.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                Authenticated users can paste notes, generate structured
                insights on the server, save every result to Supabase, and
                revisit prior analyses from one simple workspace.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/protected">
                  Open Workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </section>

          <section className="grid w-full gap-4 sm:grid-cols-3 lg:max-w-2xl">
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
              <Brain className="h-8 w-8 text-primary" />
              <h2 className="mt-5 text-lg font-semibold">Structured output</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The server requests strict JSON with summary, key points, action
                items, and sentiment.
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
              <FolderClock className="h-8 w-8 text-primary" />
              <h2 className="mt-5 text-lg font-semibold">Saved history</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Each analysis is stored in Supabase and tied to the logged-in
                user.
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h2 className="mt-5 text-lg font-semibold">Private by default</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Row-level security keeps users limited to their own meeting
                analyses.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
