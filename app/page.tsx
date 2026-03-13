import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

async function HomeHeroActions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Button asChild size="lg">
        <Link href="/protected">
          Open Workspace
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      {!user ? (
        <Button asChild size="lg" variant="outline">
          <Link href="/auth/login">Sign In</Link>
        </Button>
      ) : null}
    </div>
  );
}

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

        <div className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-5 py-16">
          <section className="w-full rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-10">
            <div className="max-w-2xl space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                AI meeting insights, saved to your workspace.
              </h1>
              <p className="text-base leading-7 text-muted-foreground">
                Paste meeting notes, generate a structured summary, and revisit
                previous analyses in one clean flow.
              </p>
            </div>

            <Suspense
              fallback={
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg">
                    <Link href="/protected">
                      Open Workspace
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              }
            >
              <HomeHeroActions />
            </Suspense>
          </section>
        </div>
      </div>
    </main>
  );
}
