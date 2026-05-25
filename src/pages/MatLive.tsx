import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import {
  type TimerSnapshot,
  getMatchConfig,
  computeElapsed,
  computeBreakElapsed,
  fmtTime,
} from '../lib/matchTimer';

const API_URL = import.meta.env.VITE_API_URL || 'https://lutte.up.railway.app';

function useIsMobile() {
  const [v, setV] = useState(() => window.innerWidth < 700);
  useEffect(() => {
    const fn = () => setV(window.innerWidth < 700);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return v;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function MatLive() {
  const { matId, id: tournamentSlug, matSlug } = useParams<{
    matId?: string; id?: string; matSlug?: string;
  }>();
  const [data, setData]     = useState<any>(null);
  const isMobile            = useIsMobile();

  const [scoreRed,  setScoreRed]  = useState<number | null>(null);
  const [scoreBlue, setScoreBlue] = useState<number | null>(null);
  const prevMatchIdRef            = useRef<string | null>(null);

  // Timer snapshot — only updated by WS timer_update events (from RefView)
  const [timerSnap, setTimerSnap] = useState<TimerSnapshot | null>(null);
  const [, forceRender]           = useState(0);

  const apiPath = tournamentSlug && matSlug
    ? `/api/live/${tournamentSlug}/${matSlug}`
    : UUID_RE.test(matId ?? '')
      ? `/api/mats/${matId}/live`
      : `/api/live/${matId}`;

  const fetchData = useCallback(() => {
    api.get(apiPath).then(r => setData(r.data)).catch(() => {});
  }, [apiPath]);

  // Fallback polling (5 s)
  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, [fetchData]);

  // Reset scores + timer when the on-mat match changes
  useEffect(() => {
    const cid = data?.current?.id ?? null;
    if (cid !== prevMatchIdRef.current) {
      prevMatchIdRef.current = cid;
      setScoreRed(null);
      setScoreBlue(null);
      // Initialise timer from last DB value (may be null for a fresh match)
      setTimerSnap(data?.current?.timer_state ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.current?.id]);

  // Re-render every 500 ms while timer is live so countdown stays fresh
  useEffect(() => {
    if (!timerSnap) return;
    if (timerSnap.phase !== 'running' && timerSnap.phase !== 'break') return;
    const iv = setInterval(() => forceRender(n => n + 1), 500);
    return () => clearInterval(iv);
  }, [timerSnap?.phase]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!data?.tournament_id) return;
    const wsUrl = API_URL.replace(/^http/, 'ws');
    let ws: WebSocket;
    let alive = true;

    const connect = () => {
      ws = new WebSocket(`${wsUrl}?tournament=${data.tournament_id}`);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);

          if (msg.type === 'score_update') {
            setData((prev: any) => {
              if (!prev?.current || prev.current.id !== msg.match_id) return prev;
              return { ...prev, current: { ...prev.current, score_red: msg.score_red, score_blue: msg.score_blue } };
            });
            setScoreRed(msg.score_red);
            setScoreBlue(msg.score_blue);
          }

          if (msg.type === 'timer_update') {
            setData((prev: any) => {
              if (!prev?.current || prev.current.id !== msg.match_id) return prev;
              setTimerSnap(msg.timer_state as TimerSnapshot);
              return prev;
            });
          }

          if (['match_finished', 'match_assigned', 'match_unassigned', 'match_promoted', 'queue_confirmed', 'queue_reordered'].includes(msg.type)) {
            fetchData();
          }
        } catch {}
      };
      ws.onclose = () => { if (alive) setTimeout(connect, 3000); };
      ws.onerror  = () => ws.close();
    };
    connect();
    return () => { alive = false; ws?.close(); };
  }, [data?.tournament_id, fetchData]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const current = data?.current;
  const next    = data?.next ?? [];

  const displayRed  = scoreRed  !== null ? scoreRed  : (current?.score_red  ?? 0);
  const displayBlue = scoreBlue !== null ? scoreBlue : (current?.score_blue ?? 0);

  const timerConfig     = getMatchConfig(current?.age_category);
  const timerElapsed    = timerSnap ? computeElapsed(timerSnap) : 0;
  const timerRemaining  = timerSnap
    ? Math.max(0, timerConfig.periodDuration - timerElapsed)
    : timerConfig.periodDuration; // show full duration when idle / no snap

  const breakElapsedNow = timerSnap ? computeBreakElapsed(timerSnap) : 0;
  const breakRemaining  = timerSnap ? Math.max(0, timerConfig.breakDuration - breakElapsedNow) : 0;

  const phase         = timerSnap?.phase ?? 'idle';
  const timerIsBreak  = phase === 'break';
  const timerIsRunning = phase === 'running';
  const timerIsPaused  = phase === 'paused';
  const timerIsUrgent  = timerIsRunning && timerRemaining < 30 && timerRemaining > 0;

  // Colour of the big countdown
  const timerColor = timerIsBreak
    ? '#f59e0b'
    : timerIsUrgent
      ? '#ef4444'
      : (phase === 'idle' || !timerSnap)
        ? '#374151'        // gray when not started
        : timerIsPaused
          ? '#9ca3af'      // dim when paused
          : '#ffffff';

  // What to display in the big clock
  const timerDisplay = timerIsBreak
    ? fmtTime(breakRemaining)
    : fmtTime(timerRemaining);

  // Sub-label under the clock
  const timerLabel: string | null = timerIsBreak
    ? `MI-TEMPS · P2 dans ${fmtTime(breakRemaining)}`
    : timerIsRunning && timerConfig.periods > 1
      ? `P${timerSnap!.period} / ${timerConfig.periods}`
      : timerIsPaused
        ? 'PAUSE'
        : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  const hdrPad = isMobile ? '10px 14px' : '12px 28px';

  return (
    <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>

      {/* ════════════════════════════════════════════
          HEADER  —  3-column grid
          Left: mat name + age cat
          Center: big clock
          Right: LIVE + weight + style
      ════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: hdrPad,
        background: '#000',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        gap: 12,
        minHeight: isMobile ? 88 : 160,
      }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 4 : 8 }}>
          <div style={{ fontSize: isMobile ? 10 : 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            {data?.mat_name || 'Tapis'}
          </div>
          {current && (
            <div style={{ fontSize: isMobile ? 20 : 36, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
              {current.age_category}
            </div>
          )}
        </div>

        {/* Center — big clock */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            fontSize: isMobile ? '3.6rem' : '8rem',
            fontWeight: 900,
            fontFamily: 'monospace',
            color: timerColor,
            letterSpacing: isMobile ? '-2px' : '-6px',
            lineHeight: 1,
            transition: 'color 0.3s',
          }}>
            {timerDisplay}
          </div>
          {timerLabel && (
            <div style={{
              fontSize: isMobile ? 10 : 13,
              fontWeight: 700,
              color: timerIsBreak ? '#f59e0b' : timerIsPaused ? '#9ca3af' : '#4b5563',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            }}>
              {timerLabel}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: isMobile ? 4 : 8 }}>
          {/* LIVE badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: current ? '#ef4444' : '#374151',
              boxShadow: current ? '0 0 8px rgba(239,68,68,0.8)' : 'none',
              transition: 'all 0.3s',
            }} />
            <span style={{ fontSize: isMobile ? 9 : 11, fontWeight: 800, color: current ? '#ef4444' : '#374151', letterSpacing: '0.18em' }}>LIVE</span>
          </div>
          {current && (
            <>
              <div style={{ fontSize: isMobile ? 18 : 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                -{current.weight_category}kg
              </div>
              <div style={{ fontSize: isMobile ? 9 : 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {current.style}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          MAIN SCORE AREA  —  Red | Blue
      ════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 0 }}>

        {/* ══ ROUGE ══ */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(150deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)',
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ height: isMobile ? 3 : 5, background: '#ef4444', flexShrink: 0 }} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? '14px 18px' : '28px 44px' }}>
            {/* Athlete info */}
            <div>
              <div style={{ fontSize: isMobile ? 9 : 11, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>
                Rouge
              </div>
              {current?.red_name
                ? (() => {
                    const parts = current.red_name.split(' ');
                    const firstName = parts[0];
                    const lastName  = parts.slice(1).join(' ');
                    return (
                      <>
                        <div style={{ fontSize: isMobile ? 28 : 56, fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: 1, letterSpacing: '-1px' }}>
                          {firstName}
                        </div>
                        {lastName && (
                          <div style={{ fontSize: isMobile ? 18 : 34, fontWeight: 700, color: '#fff', textTransform: 'uppercase', lineHeight: 1.1, letterSpacing: '-0.5px', marginTop: 2 }}>
                            {lastName}
                          </div>
                        )}
                      </>
                    );
                  })()
                : <div style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, color: 'rgba(255,255,255,0.25)' }}>—</div>
              }
              {current?.red_club && (
                <div style={{ fontSize: isMobile ? 12 : 18, color: 'rgba(255,255,255,0.55)', marginTop: 6, fontWeight: 400 }}>
                  {current.red_club}
                </div>
              )}
            </div>

            {/* Score */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                fontSize: isMobile ? '5rem' : '10rem',
                fontWeight: 900, lineHeight: 1,
                color: '#fff',
                fontVariantNumeric: 'tabular-nums',
                textShadow: '0 4px 40px rgba(0,0,0,0.5)',
              }}>
                {displayRed}
              </div>
            </div>
          </div>
        </div>

        {/* ══ BLEU ══ */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(150deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ height: isMobile ? 3 : 5, background: '#3b82f6', flexShrink: 0 }} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? '14px 18px' : '28px 44px', alignItems: isMobile ? 'flex-start' : 'flex-end' }}>
            {/* Athlete info */}
            <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
              <div style={{ fontSize: isMobile ? 9 : 11, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>
                Bleu
              </div>
              {current?.blue_name
                ? (() => {
                    const parts = current.blue_name.split(' ');
                    const firstName = parts[0];
                    const lastName  = parts.slice(1).join(' ');
                    return (
                      <>
                        <div style={{ fontSize: isMobile ? 28 : 56, fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: 1, letterSpacing: '-1px' }}>
                          {firstName}
                        </div>
                        {lastName && (
                          <div style={{ fontSize: isMobile ? 18 : 34, fontWeight: 700, color: '#fff', textTransform: 'uppercase', lineHeight: 1.1, letterSpacing: '-0.5px', marginTop: 2 }}>
                            {lastName}
                          </div>
                        )}
                      </>
                    );
                  })()
                : <div style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, color: 'rgba(255,255,255,0.25)' }}>—</div>
              }
              {current?.blue_club && (
                <div style={{ fontSize: isMobile ? 12 : 18, color: 'rgba(255,255,255,0.55)', marginTop: 6, fontWeight: 400 }}>
                  {current.blue_club}
                </div>
              )}
            </div>

            {/* Score */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <div style={{
                fontSize: isMobile ? '5rem' : '10rem',
                fontWeight: 900, lineHeight: 1,
                color: '#fff',
                fontVariantNumeric: 'tabular-nums',
                textShadow: '0 4px 40px rgba(0,0,0,0.5)',
              }}>
                {displayBlue}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          NEXT MATCH footer
      ════════════════════════════════════════════ */}
      {next.length > 0 && (
        <div style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          {/* Featured next match */}
          <div style={{ padding: isMobile ? '9px 14px' : '11px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Prochain ›
            </div>
            <span style={{ fontSize: isMobile ? 14 : 18, fontWeight: 800, color: '#fca5a5' }}>{next[0].red_name || '?'}</span>
            <span style={{ fontSize: isMobile ? 11 : 13, color: '#374151', fontWeight: 700 }}>vs</span>
            <span style={{ fontSize: isMobile ? 14 : 18, fontWeight: 800, color: '#93c5fd' }}>{next[0].blue_name || '?'}</span>
            {!isMobile && (
              <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                {next[0].age_category} · -{next[0].weight_category} kg · <span style={{ textTransform: 'capitalize' }}>{next[0].style}</span>
              </span>
            )}
          </div>
          {/* Queue */}
          {next.length > 1 && (
            <div style={{ display: 'flex', gap: 8, padding: isMobile ? '0 14px 9px' : '0 28px 10px', overflowX: 'auto' }}>
              {next.slice(1).map((m: any, i: number) => (
                <div key={m.id} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '5px 10px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#374151' }}>#{i + 2}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5' }}>{m.red_name || '?'}</span>
                  <span style={{ fontSize: 9, color: '#374151' }}>vs</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd' }}>{m.blue_name || '?'}</span>
                  {!isMobile && (
                    <span style={{ fontSize: 9, color: '#4b5563', borderLeft: '1px solid rgba(255,255,255,0.07)', paddingLeft: 8 }}>
                      {m.age_category} · -{m.weight_category}kg
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          EMPTY STATE (no current match)
      ════════════════════════════════════════════ */}
      {!current && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 5 }}>
          <div style={{ fontSize: isMobile ? 56 : 80, fontWeight: 900, color: '#1f2937', lineHeight: 1 }}>—</div>
          <div style={{ fontSize: 12, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 12 }}>En attente d'un combat</div>
        </div>
      )}
    </div>
  );
}
