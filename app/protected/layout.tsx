import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
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

        <div className="flex w-full flex-1 justify-center">
          <div className="flex w-full max-w-6xl flex-1 flex-col px-5 py-10">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
