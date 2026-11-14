import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import logo from "@/assets/unimi-logo.png";
import { ConsentBanner } from "@/components/ConsentBanner";
import { DataErrorScreen } from "@/components/DataErrorScreen";
import { LanguageToggle } from "@/components/LanguageToggle";
import { PasscodeGate } from "@/components/PasscodeGate";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataState, type DataState } from "@/data/context";
import { useT } from "@/i18n/context";
import { analytics, ANALYTICS_ENABLED } from "@/lib/analytics";

const FILE_ERROR = {
  "not-found": "notFound",
  "invalid-file": "invalidFile",
} as const;
const DATA_ERROR = {
  "invalid-json": "invalidJson",
  validation: "validation",
} as const;

function Body({
  state,
  unlock,
  children,
}: {
  state: DataState;
  unlock: (p: string) => void;
  children: ReactNode;
}) {
  const t = useT();
  switch (state.status) {
    case "loading-file":
      return <Loading />;
    case "unlocking":
      return state.silent ? (
        <Loading />
      ) : (
        <PasscodeGate busy onUnlock={unlock} />
      );
    case "locked":
      return (
        <PasscodeGate
          busy={false}
          error={state.error && t.gate.wrongPasscode}
          onUnlock={unlock}
        />
      );
    case "file-error":
      return (
        <DataErrorScreen
          title={t.errors.fileTitle}
          message={t.errors[FILE_ERROR[state.reason]]}
        />
      );
    case "data-error":
      return (
        <DataErrorScreen
          title={t.errors.dataTitle}
          message={t.errors[DATA_ERROR[state.reason]]}
          issues={state.issues}
        />
      );
    case "ready":
      return children;
  }
}

function Loading() {
  const t = useT();
  return (
    <div className="space-y-3 py-6" aria-busy="true" aria-label={t.loading}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, unlock, lock } = useDataState();
  const t = useT();
  // The privacy notice must be readable without the passphrase (ANALYTICS_SPEC §5.3).
  const { pathname } = useLocation();
  const open = ANALYTICS_ENABLED && pathname === "/privacy";
  return (
    <div className="flex min-h-svh flex-col" data-app-state={state.status}>
      {/* Brand band: title and navigation only, never review lights (BRANDING.md §5.3). */}
      <header className="border-b bg-brand text-brand-foreground">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          {/* UniMi's web rule: the mark on the left of the header, linked to www.unimi.it. */}
          <a
            href="https://www.unimi.it"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 outline-brand-foreground"
          >
            <img
              src={logo}
              alt={t.nav.university}
              width={899}
              height={300}
              className="h-14 w-auto"
            />
          </a>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <Link
              to="/"
              className="text-brand-foreground/85 outline-brand-foreground hover:text-brand-foreground"
            >
              {t.nav.home}
            </Link>
            <Link
              to="/methodology"
              className="text-brand-foreground/85 outline-brand-foreground hover:text-brand-foreground"
            >
              {t.nav.methodology}
            </Link>
            {state.status === "ready" && (
              <Button
                variant="outline"
                size="sm"
                className="text-foreground"
                onClick={() => {
                  analytics.locked();
                  lock();
                }}
              >
                {t.nav.lock}
              </Button>
            )}
            <LanguageToggle />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {open ? (
          children
        ) : (
          <Body state={state} unlock={(p) => void unlock(p)}>
            {children}
          </Body>
        )}
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-4 text-xs text-muted-foreground">
          <p>{t.disclaimer}</p>
          {ANALYTICS_ENABLED && (
            <Link
              to="/privacy"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              {t.nav.privacy}
            </Link>
          )}
        </div>
      </footer>
      <ConsentBanner />
    </div>
  );
}
