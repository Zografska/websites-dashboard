// Active-time clock (ANALYTICS_SPEC §7). Time counts only while the tab is visible and the
// visitor interacted in the last 60 s. Every 15 s of active time produces one heartbeat.

export const HEARTBEAT_MS = 15_000
export const IDLE_MS = 60_000
export const TICK_MS = 1_000

// These only refresh the "last active" timestamp, at most once per second.
const THROTTLED = ['pointermove', 'scroll'] as const
const IMMEDIATE = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

type Options = {
  /** Called with the active milliseconds since the previous heartbeat (at most HEARTBEAT_MS). */
  onHeartbeat: (activeMs: number) => void
  now?: () => number
}

export class ActiveClock {
  /** Active milliseconds since `start()`. */
  total = 0
  private pending = 0
  private lastTick = 0
  private lastActivity = 0
  private timer: ReturnType<typeof setInterval> | null = null
  private readonly now: () => number
  private readonly onHeartbeat: (activeMs: number) => void

  constructor({ onHeartbeat, now = Date.now }: Options) {
    this.onHeartbeat = onHeartbeat
    this.now = now
  }

  get running(): boolean {
    return this.timer !== null
  }

  /** Starting counts as an interaction: the visitor just unlocked or accepted. */
  start() {
    if (this.timer !== null) return
    this.total = 0
    this.pending = 0
    this.lastTick = this.lastActivity = this.now()
    for (const e of IMMEDIATE) window.addEventListener(e, this.onActivity, { capture: true, passive: true })
    for (const e of THROTTLED) window.addEventListener(e, this.onThrottled, { capture: true, passive: true })
    this.timer = setInterval(this.tick, TICK_MS)
  }

  /** Stops the timer and listeners. Call `flush()` first to keep the partial count. */
  stop() {
    if (this.timer === null) return
    clearInterval(this.timer)
    this.timer = null
    for (const e of IMMEDIATE) window.removeEventListener(e, this.onActivity, { capture: true })
    for (const e of THROTTLED) window.removeEventListener(e, this.onThrottled, { capture: true })
  }

  /** Sends what has accumulated since the last heartbeat, if anything. */
  flush() {
    if (this.pending <= 0) return
    const ms = Math.round(this.pending)
    this.pending = 0
    this.onHeartbeat(ms)
  }

  private readonly onActivity = () => {
    this.lastActivity = this.now()
  }

  private readonly onThrottled = () => {
    const t = this.now()
    if (t - this.lastActivity >= TICK_MS) this.lastActivity = t
  }

  private readonly tick = () => {
    const t = this.now()
    // A late tick (sleep, throttled background timer) never counts as more than two ticks.
    const elapsed = Math.min(Math.max(t - this.lastTick, 0), 2 * TICK_MS)
    this.lastTick = t
    const active = document.visibilityState === 'visible' && t - this.lastActivity <= IDLE_MS
    if (!active) return
    this.total += elapsed
    this.pending += elapsed
    if (this.pending >= HEARTBEAT_MS) {
      this.pending -= HEARTBEAT_MS
      this.onHeartbeat(HEARTBEAT_MS)
    }
  }
}
