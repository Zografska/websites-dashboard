/// <reference types="vite/client" />

declare module '*.md?raw' {
  const content: string
  export default content
}

interface ImportMetaEnv {
  /** PostHog project key. Set only in the deploy job (ANALYTICS_SPEC A10). */
  readonly VITE_POSTHOG_KEY?: string
  /** `1` puts tracking in test mode: any data file, every event flagged `is_test`. Never set in the deploy job. */
  readonly VITE_ANALYTICS_TEST?: string
  /** `1` switches to per-firm access: one encrypted file per firm, opened with that firm's own passphrase. */
  readonly VITE_PER_FIRM?: string
}

/** Short git SHA of the build. */
declare const __APP_VERSION__: string
