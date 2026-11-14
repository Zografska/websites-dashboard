/// <reference types="vite/client" />

declare module '*.md?raw' {
  const content: string
  export default content
}

interface ImportMetaEnv {
  /** PostHog project key. Set only in the deploy job (ANALYTICS_SPEC A10). */
  readonly VITE_POSTHOG_KEY?: string
}

/** Short git SHA of the build. */
declare const __APP_VERSION__: string
