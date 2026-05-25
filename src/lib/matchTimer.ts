// ─── Types ──────────────────────────────────────────────────────────────────

export type TimerPhase = 'idle' | 'running' | 'paused' | 'break' | 'finished';

export interface MatchTimerConfig {
  periods: number;
  periodDuration: number; // seconds
  breakDuration: number;  // seconds (0 if single-period)
}

/**
 * Timer snapshot stored in DB + broadcast via WebSocket.
 * All timestamps are Unix ms (Date.now()).
 */
export interface TimerSnapshot {
  phase: TimerPhase;
  period: number;             // 1 or 2
  periodStartMs: number | null; // timestamp when the current running phase began
  elapsed: number;             // seconds accumulated before periodStartMs
  breakStartMs: number | null; // timestamp when break began
  breakElapsed: number;        // seconds accumulated in break before breakStartMs
}

// ─── Age-category configs ────────────────────────────────────────────────────

export const MATCH_CONFIGS: Record<string, MatchTimerConfig> = {
  'U9':      { periods: 1, periodDuration: 120, breakDuration: 0 },
  'U11':     { periods: 1, periodDuration: 120, breakDuration: 0 },
  'U13':     { periods: 1, periodDuration: 180, breakDuration: 0 },
  'U15':     { periods: 2, periodDuration: 120, breakDuration: 30 },
  'U17':     { periods: 2, periodDuration: 120, breakDuration: 30 },
  'U20':     { periods: 2, periodDuration: 180, breakDuration: 30 },
  'U23':     { periods: 2, periodDuration: 180, breakDuration: 30 },
  'Senior':  { periods: 2, periodDuration: 180, breakDuration: 30 },
  'Vétéran': { periods: 2, periodDuration: 180, breakDuration: 30 },
};

export const DEFAULT_CONFIG: MatchTimerConfig = { periods: 2, periodDuration: 180, breakDuration: 30 };

export const TIMER_INIT: TimerSnapshot = {
  phase: 'idle',
  period: 1,
  periodStartMs: null,
  elapsed: 0,
  breakStartMs: null,
  breakElapsed: 0,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getMatchConfig(ageCategory?: string | null): MatchTimerConfig {
  if (!ageCategory) return DEFAULT_CONFIG;
  return MATCH_CONFIGS[ageCategory] ?? DEFAULT_CONFIG;
}

/** Live elapsed seconds in the current period (accounting for running clock). */
export function computeElapsed(snap: TimerSnapshot): number {
  if (snap.phase === 'running' && snap.periodStartMs !== null) {
    return snap.elapsed + (Date.now() - snap.periodStartMs) / 1000;
  }
  return snap.elapsed;
}

/** Live elapsed seconds in the break (accounting for running break clock). */
export function computeBreakElapsed(snap: TimerSnapshot): number {
  if (snap.phase === 'break' && snap.breakStartMs !== null) {
    return snap.breakElapsed + (Date.now() - snap.breakStartMs) / 1000;
  }
  return snap.breakElapsed;
}

/** Format seconds as MM:SS (always non-negative). */
export function fmtTime(s: number): string {
  const sec = Math.max(0, Math.round(s));
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

/**
 * Play N short beeps using the Web Audio API.
 * Gracefully no-ops if AudioContext is unavailable.
 */
export function playBeeps(
  count: number,
  freq = 880,
  durationSec = 0.15,
  gapSec = 0.1,
): void {
  try {
    const AudioCtx =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx() as AudioContext;
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t0 = ctx.currentTime + i * (durationSec + gapSec);
      gain.gain.setValueAtTime(0.7, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationSec);
      osc.start(t0);
      osc.stop(t0 + durationSec + 0.01);
    }
    setTimeout(() => ctx.close(), (count * (durationSec + gapSec) + 1) * 1000);
  } catch {
    /* ignore — audio not available */
  }
}
