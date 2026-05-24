import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Zap, Trophy, RefreshCw, Medal, ChevronRight, Trash2, AlertTriangle } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import { useAuth } from '../store/auth';
import api from '../lib/api';
import toast from 'react-hot-toast';

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  waiting:  { color: '#4b5563', bg: 'rgba(75,85,99,0.08)',    border: 'rgba(75,85,99,0.15)'    },
  ready:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'   },
  on_mat:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)'  },
  finished: { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'   },
  blocked:  { color: '#374151', bg: 'rgba(55,65,81,0.06)',    border: 'rgba(55,65,81,0.12)'    },
};

const FORMAT_LABEL: Record<string, string> = {
  nordic:            'Nordique',
  pools_finals:      'Poules + Finales',
  bracket_repechage: 'Tableau + Repêchage',
};

const STYLE_LABELS: Record<string, string> = {
  libre:    'Lutte libre',
  greco:    'Gréco-romaine',
  feminine: 'Lutte féminine',
};

// ─── Bracket tree layout constants ──────────────────────────────────────────
const BK = {
  cardH:  112,   // estimated card height with name + club + button
  cardW:  250,   // card width (192 × 1.3)
  unitH:  132,   // vertical slot height per match in round 0 (cardH + 20px gap)
  lineW:  50,    // width of SVG connector zone between columns
  labelH: 30,    // column label height
} as const;

/** Vertical offset (px) from top of bracket area for match at (col, idx) */
function bMatchTop(colIdx: number, idx: number): number {
  const slots = Math.pow(2, colIdx);
  return (idx * slots + (slots - 1) / 2) * BK.unitH;
}

function MatchCard({ match }: { match: any }) {
  const s = STATUS_STYLE[match.status] || STATUS_STYLE.waiting;
  const isFinished = match.status === 'finished';
  const isBye = !!match.is_bye;
  const winnerIsRed = match.winner_color === 'red'
    || (!match.winner_color && match.winner_id != null && match.winner_id === match.red_athlete_id);

  const redName  = match.red_name  || (match.red_athlete_id  == null && isBye ? 'BYE' : '?');
  const blueName = match.blue_name || (match.blue_athlete_id == null && isBye ? 'BYE' : '?');
  const redIsBye  = redName  === 'BYE';
  const blueIsBye = blueName === 'BYE';

  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '9px 11px', fontSize: 12 }}>
      {/* Red row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: redIsBye ? 'var(--dim)' : '#ef4444', flexShrink: 0, marginTop: 4 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
            color: redIsBye ? 'var(--dim)' : (isFinished && winnerIsRed ? 'var(--fg)' : '#f87171'),
            fontWeight: isFinished && winnerIsRed ? 700 : 500 }}>
            {redName}
          </div>
          {!redIsBye && match.red_club && (
            <div style={{ fontSize: 10, color: 'var(--fg3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
              {match.red_club}
            </div>
          )}
        </div>
        {isFinished && !isBye && (
          <span style={{ fontFamily: 'monospace', color: 'var(--fg)', fontWeight: 700, flexShrink: 0, fontSize: 12 }}>
            {match.score_red ?? ''}
          </span>
        )}
      </div>
      {/* Blue row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: blueIsBye ? 'var(--dim)' : '#3b82f6', flexShrink: 0, marginTop: 4 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
            color: blueIsBye ? 'var(--dim)' : (isFinished && !winnerIsRed ? 'var(--fg)' : '#60a5fa'),
            fontWeight: isFinished && !winnerIsRed ? 700 : 500 }}>
            {blueName}
          </div>
          {!blueIsBye && match.blue_club && (
            <div style={{ fontSize: 10, color: 'var(--fg3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
              {match.blue_club}
            </div>
          )}
        </div>
        {isFinished && !isBye && (
          <span style={{ fontFamily: 'monospace', color: 'var(--fg)', fontWeight: 700, flexShrink: 0, fontSize: 12 }}>
            {match.score_blue ?? ''}
          </span>
        )}
      </div>
      {/* Status */}
      {match.status === 'on_mat' && (
        <div style={{ marginTop: 6, fontSize: 10, color: '#fbbf24', fontWeight: 600 }}>● En cours</div>
      )}
      {isFinished && !isBye && match.win_type && (
        <div style={{ marginTop: 3, fontSize: 10, color: 'var(--fg3)', textTransform: 'capitalize' }}>{match.win_type}</div>
      )}
      {/* BYE badge */}
      {isBye && (
        <div style={{ marginTop: 7, fontSize: 10, color: '#34d399', fontWeight: 700, textAlign: 'center' }}>
          ✓ Avance automatiquement
        </div>
      )}
      {/* Arbitrer / Vainqueur */}
      {match.id && !isBye && (
        isFinished ? (
          <div style={{
            display: 'block', marginTop: 7, textAlign: 'center', fontSize: 10, fontWeight: 700,
            borderRadius: 6, padding: '3px 6px',
            background: winnerIsRed ? '#ef4444' : '#3b82f6',
            color: '#000',
            border: 'none',
          }}>
            Vainqueur {winnerIsRed ? 'ROUGE' : 'BLEU'}
          </div>
        ) : (
          <Link
            to={`/ref/${match.id}`}
            target="_blank"
            style={{ display: 'block', marginTop: 7, textAlign: 'center', fontSize: 10, background: '#fbbf24', color: '#000', borderRadius: 6, padding: '3px 6px', textDecoration: 'none', fontWeight: 700, border: 'none' }}
          >
            Arbitrer →
          </Link>
        )
      )}
    </div>
  );
}

function NordicView({ matches, pools }: { matches: any[]; pools: any[] }) {
  if (pools.length === 0) return <div style={{ color: 'var(--fg3)', fontSize: 13 }}>Aucune poule générée</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {pools.map((pool: any) => {
        const poolMatches = matches.filter((m: any) => m.pool_id === pool.id);
        return (
          <div key={pool.id} style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--b2)', fontSize: 12, fontWeight: 700, color: 'var(--fg2)' }}>{pool.name}</div>
            <div style={{ padding: '8px 0' }}>
              {poolMatches.map((m: any, i: number) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: i > 0 ? '1px solid var(--b1)' : 'none' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#f87171' }}>{m.red_name || '?'}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, color: m.status === 'finished' ? 'var(--fg)' : 'var(--dim)', fontSize: 14 }}>
                    {m.status === 'finished' ? `${m.score_red} – ${m.score_blue}` : 'vs'}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#60a5fa', textAlign: 'right' }}>{m.blue_name || '?'}</span>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                  {m.id && (
                    <Link to={`/ref/${m.id}`} target="_blank" style={{ color: 'var(--fg3)', display: 'flex', textDecoration: 'none' }}>
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              ))}
              {poolMatches.length === 0 && (
                <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--dim)' }}>Tableau non généré</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Repechage bracket view ─────────────────────────────────────────────────
// Renders repechage rounds with the same SVG-connector visual as the main bracket.
//
// Round structure (UWW rules):
//   RA  : first-round losers paired   → P(2k-1) vs P(2k)
//   C1+ : losing finalist crossed     → Loser A(k) vs Winner RA(M-k+1)
//   Last column → 2 winners ≡ 3rd place ex-aequo, no small final
//
// Connector logic per column transition:
//   nextN === curN  →  1:1 straight lines (crossing rounds)
//   nextN  <  curN  →  elbow connectors   (binary merge rounds)
//   isLast          →  horizontal stub to bronze box
function RepechageView({ matches }: { matches: any[] }) {
  const repRounds = (() => {
    const map: Record<number, any[]> = {};
    for (const m of matches) {
      if (m.bracket !== 'repechage' && m.bracket !== 'bronze') continue;
      const r = m.round ?? 0;
      if (!map[r]) map[r] = [];
      map[r].push(m);
    }
    for (const r of Object.values(map)) {
      r.sort((a: any, b: any) => (a.index_in_round ?? 0) - (b.index_in_round ?? 0));
    }
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b)) as [string, any[]][];
  })();

  if (repRounds.length === 0) {
    return (
      <div style={{ color: 'var(--fg3)', fontSize: 13 }}>
        Tableau de repêchage non encore généré
      </div>
    );
  }

  const maxCount = Math.max(...repRounds.map(([, r]) => (r as any[]).length));
  const totalH   = maxCount * BK.unitH;
  const numCols  = repRounds.length;
  const colW     = BK.cardW + BK.lineW;

  // Extra visual gap between the RA round and the first crossing round (C1).
  // These two sections are NOT directly connected — winners of RA feed into C1
  // via a mirror-crossing formula, so we show a deliberate visual break.
  const RA_EXTRA_GAP = 80;
  const colLeft = (ci: number) => ci * colW + (ci >= 1 ? RA_EXTRA_GAP : 0);

  const totalW  = numCols * colW + 144 + RA_EXTRA_GAP;
  const connClr = 'var(--b4)';
  const midX    = BK.lineW / 2;

  // Uniform slot distribution across totalH
  const slotCy  = (n: number, i: number) => { const h = totalH / n; return i * h + h / 2; };
  const slotTop = (n: number, i: number) => slotCy(n, i) - BK.cardH / 2;

  const lastMatches = (repRounds[numCols - 1]?.[1] ?? []) as any[];

  // Column label per index
  const repLabel = (colIdx: number) => {
    if (colIdx === 0)           return 'Repêchage RA';
    if (colIdx === numCols - 1) return 'Dernier tour';
    return `Tour C${colIdx}`;
  };

  // x-center of the separator zone (in the gap between RA and C1)
  const separatorX = BK.cardW + BK.lineW + RA_EXTRA_GAP / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Info banner ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 14px',
        background: 'rgba(249,115,22,0.07)',
        border: '1px solid rgba(249,115,22,0.2)',
        borderRadius: 9, fontSize: 12, color: 'var(--fg3)',
      }}>
        <Medal size={12} color="#f97316" />
        <span>
          Les <strong style={{ color: 'var(--fg2)' }}>2 vainqueurs finaux</strong> obtiennent la&nbsp;
          <strong style={{ color: '#f97316' }}>3e place ex-aequo</strong> — sans petite finale.
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ position: 'relative', width: totalW, height: BK.labelH + totalH + 20 }}>

          {/* ── Column labels ── */}
          {repRounds.map(([rk], colIdx) => (
            <div key={`rl-${rk}`} style={{
              position: 'absolute', top: 0,
              left: colLeft(colIdx), width: BK.cardW, height: BK.labelH,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
              color: colIdx === numCols - 1 ? '#f97316' : 'var(--fg3)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              {repLabel(colIdx)}
            </div>
          ))}

          {/* ── "3e place" header above bronze boxes ── */}
          <div style={{
            position: 'absolute', top: 0, left: colLeft(numCols), width: 128, height: BK.labelH,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#f97316',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            3e place
          </div>

          {/* ── Match cards ── */}
          {repRounds.map(([, rMatches], colIdx) =>
            (rMatches as any[]).map((m, idx) => (
              <div key={m.id} style={{
                position: 'absolute',
                top: BK.labelH + slotTop((rMatches as any[]).length, idx),
                left: colLeft(colIdx),
                width: BK.cardW,
              }}>
                <MatchCard match={m} />
              </div>
            ))
          )}

          {/* ── Separator between RA and C1 ── */}
          {numCols > 1 && (
            <>
              {/* Dashed vertical line */}
              <div style={{
                position: 'absolute',
                top: BK.labelH,
                left: separatorX,
                width: 0,
                height: totalH,
                borderLeft: '2px dashed rgba(156,163,175,0.22)',
                pointerEvents: 'none',
              }} />
            </>
          )}

          {/* ── SVG connector lines ── */}
          {repRounds.map(([rk, rMatches], colIdx) => {
            // No connector between RA (col 0) and C1 (col 1):
            // winners cross via mirror formula — shown by the separator above.
            if (colIdx === 0) return null;

            const isLast = colIdx === numCols - 1;
            const curN   = (rMatches as any[]).length;
            const nextN  = !isLast
              ? ((repRounds[colIdx + 1]?.[1] ?? []) as any[]).length
              : 0;

            return (
              <svg key={`rs-${rk}`} style={{
                position: 'absolute',
                top: BK.labelH,
                left: colLeft(colIdx) + BK.cardW,
                width: BK.lineW,
                height: totalH,
                overflow: 'visible',
                pointerEvents: 'none',
              }}>
                {(rMatches as any[]).map((m, idx) => {
                  const cy = slotCy(curN, idx);

                  // Last column → stub toward bronze box
                  if (isLast) {
                    return (
                      <line key={m.id}
                        x1={0} y1={cy} x2={BK.lineW} y2={cy}
                        stroke={connClr} strokeWidth={1.5} />
                    );
                  }

                  // 1:1 crossing round → straight horizontal
                  if (nextN === curN) {
                    return (
                      <line key={m.id}
                        x1={0} y1={cy} x2={BK.lineW} y2={cy}
                        stroke={connClr} strokeWidth={1.5} />
                    );
                  }

                  // Binary merge: pairs (0,1)→0, (2,3)→1, …
                  if (nextN < curN) {
                    if (idx % 2 === 0) {
                      const sibY = idx + 1 < curN ? slotCy(curN, idx + 1) : cy;
                      const ny   = slotCy(nextN, Math.floor(idx / 2));
                      return (
                        <path key={m.id}
                          d={`M0,${cy} H${midX} V${sibY} M${midX},${ny} H${BK.lineW}`}
                          fill="none" stroke={connClr} strokeWidth={1.5} />
                      );
                    }
                    return (
                      <line key={m.id}
                        x1={0} y1={cy} x2={midX} y2={cy}
                        stroke={connClr} strokeWidth={1.5} />
                    );
                  }

                  return null;
                })}
              </svg>
            );
          })}

          {/* ── Bronze boxes (one per final-round winner) ── */}
          {lastMatches.map((m: any, idx: number) => {
            const cy = BK.labelH + slotCy(lastMatches.length, idx);
            const winner = m.status === 'finished'
              ? (m.winner_id === m.red_athlete_id ? m.red_name : m.blue_name)
              : null;
            return (
              <div key={`bx-${m.id}`} style={{
                position: 'absolute',
                top: cy - 36,
                left: colLeft(numCols),
                width: 120, height: 72,
                border: '2px solid rgba(249,115,22,0.4)',
                borderRadius: 12,
                background: 'rgba(249,115,22,0.06)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4,
              }}>
                <Medal size={16} color="#f97316" />
                {winner && (
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: '#f97316',
                    textAlign: 'center', padding: '0 6px',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', maxWidth: '100%',
                  }}>
                    {winner}
                  </div>
                )}
                <div style={{
                  fontSize: 9, color: 'var(--fg3)', fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  3e place
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}

// ─── Main bracket view with optional repechage tab ───────────────────────────
function BracketView({ matches }: { matches: any[] }) {
  const [tab, setTab] = useState<'main' | 'repechage'>('main');

  // 'final' = last main-bracket match; include it
  const mainMatches = matches.filter((m: any) =>
    m.bracket === 'main' || m.bracket === 'final' || !m.bracket
  );
  const repMatches  = matches.filter((m: any) =>
    m.bracket === 'repechage' || m.bracket === 'bronze'
  );
  const hasRepechage = repMatches.length > 0;

  const toRounds = (arr: any[]): Record<number, any[]> => {
    const map: Record<number, any[]> = {};
    for (const m of arr) {
      const r = m.round ?? 0;
      if (!map[r]) map[r] = [];
      map[r].push(m);
    }
    for (const r of Object.values(map)) {
      r.sort((a, b) => (a.index_in_round ?? 0) - (b.index_in_round ?? 0));
    }
    return map;
  };

  const mainRounds = Object.entries(toRounds(mainMatches))
    .sort(([a], [b]) => Number(a) - Number(b)) as [string, any[]][];

  const ROUND_LABEL: Record<number, string> = {
    1: 'Finale', 2: '1/2 Finale', 4: '1/4 de Finale',
    8: '1/8e de Finale', 16: '1/16e de Finale', 32: '1/32e de Finale',
  };

  const firstCount = mainRounds[0]?.[1]?.length ?? 0;
  const bracketH   = firstCount > 0 ? (firstCount - 1) * BK.unitH + BK.cardH : BK.cardH;
  const numCols    = mainRounds.length;
  const colW       = BK.cardW + BK.lineW;
  const totalW     = numCols * colW + 128;
  const connClr    = 'var(--b4)';
  const midX       = BK.lineW / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Tab toggle (only when repechage exists) ── */}
      {hasRepechage && (
        <div style={{ display: 'flex', gap: 6 }}>
          {(['main', 'repechage'] as const).map(t => {
            const active = tab === t;
            const accent = t === 'main' ? '#ca8a04' : '#f97316';
            const accentBg = t === 'main' ? 'rgba(202,138,4,0.12)' : 'rgba(249,115,22,0.12)';
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 9,
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: active ? accentBg : 'var(--inp)',
                  color: active ? accent : 'var(--fg3)',
                  border: active ? `1px solid ${accent}40` : '1px solid var(--b2)',
                  boxShadow: active ? `0 0 0 1px ${accent}20` : 'none',
                }}
              >
                {t === 'main'
                  ? <><Trophy size={13} color={active ? accent : 'var(--fg3)'} /> Tableau principal</>
                  : <><Medal  size={13} color={active ? accent : 'var(--fg3)'} /> Repêchage — 3e place</>}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main bracket tree ── */}
      {tab === 'main' && (
        mainRounds.length === 0 ? (
          <div style={{ color: 'var(--fg3)', fontSize: 13 }}>Tableau non encore généré</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ position: 'relative', width: totalW, height: BK.labelH + bracketH + 20 }}>

              {/* Column labels */}
              {mainRounds.map(([rk, rMatches], colIdx) => (
                <div key={`lbl-${rk}`} style={{
                  position: 'absolute', top: 0, left: colIdx * colW, width: BK.cardW,
                  height: BK.labelH,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'var(--fg3)',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  {ROUND_LABEL[rMatches.length] ?? 'Tour'}
                </div>
              ))}

              {/* "VAINQUEUR" label */}
              <div style={{
                position: 'absolute', top: 0, left: numCols * colW, width: 120,
                height: BK.labelH,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#ca8a04',
                textTransform: 'uppercase' as const, letterSpacing: '0.1em',
              }}>
                Vainqueur
              </div>

              {/* Match cards */}
              {mainRounds.map(([, rMatches], colIdx) =>
                (rMatches as any[]).map((m, idx) => (
                  <div key={m.id} style={{
                    position: 'absolute',
                    top: BK.labelH + bMatchTop(colIdx, idx),
                    left: colIdx * colW,
                    width: BK.cardW,
                  }}>
                    <MatchCard match={m} />
                  </div>
                ))
              )}

              {/* SVG connector lines */}
              {mainRounds.map(([rk, rMatches], colIdx) => {
                const isLastCol = colIdx === numCols - 1;
                return (
                  <svg key={`svg-${rk}`} style={{
                    position: 'absolute',
                    top: BK.labelH,
                    left: colIdx * colW + BK.cardW,
                    width: BK.lineW, height: bracketH,
                    overflow: 'visible', pointerEvents: 'none',
                  }}>
                    {(rMatches as any[]).map((m, idx) => {
                      const cy = bMatchTop(colIdx, idx) + BK.cardH / 2;
                      if (isLastCol) {
                        return (
                          <line key={m.id}
                            x1={0} y1={cy} x2={BK.lineW} y2={cy}
                            stroke={connClr} strokeWidth={1.5} />
                        );
                      }
                      if (idx % 2 === 0) {
                        const sibLen = (rMatches as any[]).length;
                        const sibY   = idx + 1 < sibLen
                          ? bMatchTop(colIdx, idx + 1) + BK.cardH / 2 : cy;
                        const nextY  = bMatchTop(colIdx + 1, Math.floor(idx / 2)) + BK.cardH / 2;
                        return (
                          <path key={m.id}
                            d={`M0,${cy} H${midX} V${sibY} M${midX},${nextY} H${BK.lineW}`}
                            fill="none" stroke={connClr} strokeWidth={1.5} />
                        );
                      }
                      return (
                        <line key={m.id}
                          x1={0} y1={cy} x2={midX} y2={cy}
                          stroke={connClr} strokeWidth={1.5} />
                      );
                    })}
                  </svg>
                );
              })}

              {/* Winner box */}
              {numCols > 0 && (() => {
                const finaleMatches = mainRounds[numCols - 1]?.[1] as any[] ?? [];
                const boxCenterY = BK.labelH + bMatchTop(numCols - 1, 0) + BK.cardH / 2;
                return (
                  <div style={{
                    position: 'absolute',
                    top: boxCenterY - 40, left: numCols * colW,
                    width: 112, height: 80,
                    border: '2px solid rgba(202,138,4,0.55)',
                    borderRadius: 12, background: 'rgba(202,138,4,0.07)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    <Trophy size={20} color="#fbbf24" />
                    {finaleMatches[0]?.status === 'finished' && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textAlign: 'center', padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                        {finaleMatches[0]?.winner_id === finaleMatches[0]?.red_athlete_id
                          ? finaleMatches[0]?.red_name
                          : finaleMatches[0]?.blue_name}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>
        )
      )}

      {/* ── Repechage tree ── */}
      {tab === 'repechage' && hasRepechage && (
        <RepechageView matches={matches} />
      )}

    </div>
  );
}

/**
 * Points de classement UWW selon le type de victoire :
 *   fall / forfeit / abandon / dq → 5:0
 *   superiority (adversaire sans points) → 4:0
 *   superiority (adversaire avec points) → 4:1
 *   points (adversaire sans points)      → 3:0
 *   points (adversaire avec points)      → 3:1
 *   double disqualification              → 0:0
 */
function uwwClassificationPts(winType: string, loserScore: number): { w: number; l: number } {
  if (['fall', 'forfeit', 'abandon', 'dq'].includes(winType)) return { w: 5, l: 0 };
  if (winType === 'superiority') return { w: 4, l: loserScore > 0 ? 1 : 0 };
  return { w: 3, l: loserScore > 0 ? 1 : 0 }; // 'points' ou défaut
}

/** Calcule le classement UWW d'une poule depuis les matchs terminés */
function computePoolRankings(
  poolId: string,
  athletes: Array<{ id: string; name: string; club: string | null }>,
  matches: any[]
) {
  const finished = matches.filter(m => m.pool_id === poolId && m.status === 'finished');

  const stats: Record<string, { name: string; club: string; pts: number; tech: number; conceded: number }> = {};
  for (const a of athletes) {
    if (a?.id) stats[a.id] = { name: a.name || '?', club: a.club || '', pts: 0, tech: 0, conceded: 0 };
  }

  for (const m of finished) {
    const rid = m.red_athlete_id, bid = m.blue_athlete_id, wid = m.winner_id;
    const sr: number = m.score_red  ?? 0;
    const sb: number = m.score_blue ?? 0;

    if (!wid) {
      // Double disqualification → 0 pts pour les deux
    } else {
      const redWins   = wid === rid;
      const loserScore = redWins ? sb : sr;
      const { w, l }  = uwwClassificationPts(m.win_type || 'points', loserScore);
      if (rid && stats[rid]) { stats[rid].pts += redWins ? w : l; stats[rid].tech += sr; stats[rid].conceded += sb; }
      if (bid && stats[bid]) { stats[bid].pts += redWins ? l : w; stats[bid].tech += sb; stats[bid].conceded += sr; }
    }
  }

  const ranked = Object.entries(stats).map(([id, s]) => ({ id, ...s }));

  return ranked.sort((a, b) => {
    // 1. Points de classement
    if (b.pts !== a.pts) return b.pts - a.pts;
    // 2. Points techniques marqués
    if (b.tech !== a.tech) return b.tech - a.tech;
    // 3. Confrontation directe
    const h2h = finished.find(m =>
      (m.red_athlete_id === a.id && m.blue_athlete_id === b.id) ||
      (m.red_athlete_id === b.id && m.blue_athlete_id === a.id)
    );
    if (h2h?.winner_id === a.id) return -1;
    if (h2h?.winner_id === b.id) return  1;
    // 4. Moins de points encaissés
    if (a.conceded !== b.conceded) return a.conceded - b.conceded;
    // 5. Égalité parfaite
    return 0;
  });
}

function RoundColumn({ matches, label }: { matches: any[]; label: string }) {
  return (
    <div style={{ minWidth: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</div>
      {matches.map((m: any) => <MatchCard key={m.id} match={m} />)}
    </div>
  );
}

function PoolsFinalsView({ matches, pools }: { matches: any[]; pools: any[] }) {
  const poolMatches  = matches.filter((m: any) => m.pool_id);
  const finalMatches = matches.filter((m: any) => ['semifinal', 'final', 'bronze'].includes(m.match_type));

  if (pools.length === 0) {
    return <div style={{ color: 'var(--fg3)', fontSize: 13 }}>Aucune poule générée</div>;
  }

  const poolRankings = pools.map(pool => ({
    pool,
    ranking: computePoolRankings(
      pool.id,
      (pool.athletes ?? []).filter((a: any) => a?.id),
      poolMatches
    ),
  }));

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

      {/* ── Gauche : matchs + phase finale ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {pools.map(pool => {
          const pMatches = poolMatches.filter((m: any) => m.pool_id === pool.id);
          return (
            <div key={pool.id} style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '9px 16px', borderBottom: '1px solid var(--b2)', fontSize: 11, fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Poule {pool.name}
              </div>
              <div>
                {pMatches.map((m: any, i: number) => {
                  const isFinished = m.status === 'finished';
                  const redWon  = isFinished && m.winner_id === m.red_athlete_id;
                  const blueWon = isFinished && m.winner_id === m.blue_athlete_id;
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderTop: i > 0 ? '1px solid var(--b1)' : 'none' }}>
                      {/* Rouge */}
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: redWon ? 700 : 500, color: redWon ? 'var(--fg)' : '#f87171', lineHeight: 1.2 }}>{m.red_name || '?'}</div>
                          {m.red_club && <div style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 1 }}>{m.red_club}</div>}
                        </div>
                      </div>
                      {/* Score / VS */}
                      <div style={{ fontFamily: 'monospace', fontWeight: 900, color: isFinished ? 'var(--fg)' : 'var(--dim)', fontSize: 14, flexShrink: 0, minWidth: 52, textAlign: 'center' }}>
                        {isFinished ? `${m.score_red} – ${m.score_blue}` : 'vs'}
                      </div>
                      {/* Bleu */}
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: blueWon ? 700 : 500, color: blueWon ? 'var(--fg)' : '#60a5fa', lineHeight: 1.2 }}>{m.blue_name || '?'}</div>
                          {m.blue_club && <div style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 2 }}>{m.blue_club}</div>}
                        </div>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                      </div>
                      {/* Arbitrer */}
                      <Link to={`/ref/${m.id}`} target="_blank" style={{ color: 'var(--dim)', display: 'flex', textDecoration: 'none', marginLeft: 2, flexShrink: 0 }}>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  );
                })}
                {pMatches.length === 0 && (
                  <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--dim)' }}>Tableau non généré</div>
                )}
              </div>
            </div>
          );
        })}

        {/* Phase finale */}
        {finalMatches.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg2)', marginBottom: 12 }}>Phase finale</div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
              {(['semifinal', 'final', 'bronze'] as const).map(type => {
                const t = finalMatches.filter((m: any) => m.match_type === type);
                if (t.length === 0) return null;
                const labels: Record<string, string> = { semifinal: 'Demi-finales', final: 'Finale', bronze: 'Bronze' };
                return <RoundColumn key={type} matches={t} label={labels[type]} />;
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Droite : classements par poule ── */}
      <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {poolRankings.map(({ pool, ranking }) => (
          <div key={pool.id} style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 14, overflow: 'hidden' }}>
            {/* Titre */}
            <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--b2)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Trophy size={12} color="#fbbf24" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg)' }}>Classement Poule {pool.name}</span>
            </div>
            {/* En-têtes colonnes */}
            <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr 62px 62px', gap: 4, padding: '6px 12px 5px', borderBottom: '1px solid var(--b1)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--dim)' }}>#</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Athlète</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Pts class.</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Pts tech.</div>
            </div>
            {/* Lignes */}
            {ranking.map((r, i) => {
              const rs = RANK_STYLE(i);
              return (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '26px 1fr 62px 62px', gap: 4, padding: '9px 12px', borderTop: i > 0 ? '1px solid var(--b1)' : 'none', alignItems: 'center' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: rs.bg, color: rs.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                    {r.club && <div style={{ fontSize: 10, color: 'var(--fg3)', marginTop: 1 }}>{r.club}</div>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg2)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.pts}</div>
                  <div style={{ fontSize: 13, color: 'var(--fg3)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.tech}</div>
                </div>
              );
            })}
            {ranking.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 11, color: 'var(--dim)' }}>Aucun athlète</div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}

const RANK_STYLE = (i: number) => i === 0
  ? { bg: '#ca8a04', color: '#000' }
  : i === 1
  ? { bg: '#9ca3af', color: '#000' }
  : i === 2
  ? { bg: '#c2410c', color: '#fff' }
  : { bg: 'var(--inp)', color: 'var(--fg3)' };

export default function Brackets() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [selectedComp, setSelectedComp] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<'single' | 'bulk' | null>(null);
  const [forceDelete, setForceDelete] = useState(false);

  // Vérification des droits admin
  const isGlobalAdmin = (user?.globalRoles || []).some((r: string) => ['super_admin', 'admin'].includes(r));

  const { data: tournamentUsers = [] } = useQuery({
    queryKey: ['tournament-users', id],
    queryFn: () => api.get(`/api/tournaments/${id}/users`).then(r => r.data).catch(() => []),
    enabled: !isGlobalAdmin, // inutile si déjà super_admin
  });

  const isTournamentAdmin = isGlobalAdmin || tournamentUsers.some((u: any) => u.user_id === user?.id && u.role === 'tournament_admin');

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions', id],
    queryFn: () => api.get(`/api/tournaments/${id}/competitions`).then(r => r.data),
  });

  const comp = selectedComp
    ? competitions.find((c: any) => c.id === selectedComp)
    : competitions[0] || null;

  const compId = comp?.id || null;

  // Compétitions ayant la même catégorie d'âge que la compétition sélectionnée
  const sameAgeComps: any[] = comp
    ? competitions.filter((c: any) => c.age_category === comp.age_category)
    : [];

  const { data: bracketData, isLoading } = useQuery({
    queryKey: ['bracket', compId],
    queryFn: () => api.get(`/api/competitions/${compId}/bracket`).then(r => r.data),
    enabled: !!compId,
  });

  const { data: rankings = [] } = useQuery({
    queryKey: ['rankings', compId],
    queryFn: () => api.get(`/api/competitions/${compId}/rankings`).then(r => r.data).catch(() => []),
    enabled: !!compId,
  });

  const generateBracket = useMutation({
    mutationFn: (cid: string) => api.post(`/api/competitions/${cid}/generate-bracket`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bracket', compId] }); toast.success('Tableau généré'); },
    onError: () => toast.error('Erreur lors de la génération du tableau'),
  });

  const deleteSingle = useMutation({
    mutationFn: ({ cid, force }: { cid: string; force: boolean }) =>
      api.delete(`/api/competitions/${cid}/bracket`, { params: force ? { force: 'true' } : {} }),
    onSuccess: () => {
      setDeleteModal(null);
      setForceDelete(false);
      qc.invalidateQueries({ queryKey: ['bracket', compId] });
      toast.success('Tableau supprimé');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Erreur lors de la suppression';
      toast.error(msg, { duration: 6000 });
    },
  });

  const deleteBulk = useMutation({
    mutationFn: ({ ageCategory, force }: { ageCategory: string; force: boolean }) =>
      api.delete(`/api/tournaments/${id}/brackets`, { params: { age_category: ageCategory, ...(force ? { force: 'true' } : {}) } }),
    onSuccess: (r) => {
      setDeleteModal(null);
      setForceDelete(false);
      qc.invalidateQueries({ queryKey: ['bracket'] });
      toast.success(`${r.data.deleted} tableau${r.data.deleted !== 1 ? 'x' : ''} supprimé${r.data.deleted !== 1 ? 's' : ''}`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Erreur lors de la suppression';
      toast.error(msg, { duration: 6000 });
    },
  });

  const isPendingDelete = deleteSingle.isPending || deleteBulk.isPending;

  const handleConfirmDelete = () => {
    if (!comp) return;
    if (deleteModal === 'single') {
      deleteSingle.mutate({ cid: comp.id, force: forceDelete });
    } else if (deleteModal === 'bulk') {
      deleteBulk.mutate({ ageCategory: comp.age_category, force: forceDelete });
    }
  };

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Tableaux"
        subtitle="Visualisation et gestion des tableaux de compétition"
        actions={compId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isTournamentAdmin && (
              <button
                onClick={() => setDeleteModal('single')}
                title="Supprimer le tableau"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '8px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer' }}
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            )}
            <button
              onClick={() => generateBracket.mutate(compId)}
              disabled={generateBracket.isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: generateBracket.isPending ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.3)', opacity: generateBracket.isPending ? 0.7 : 1 }}
            >
              <RefreshCw size={14} style={{ animation: generateBracket.isPending ? 'spin 1s linear infinite' : 'none' }} />
              {generateBracket.isPending ? 'Génération…' : 'Générer le tableau'}
            </button>
          </div>
        ) : undefined}
      />

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {competitions.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--inp)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Zap size={28} color="var(--dim)" strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg)', marginBottom: 6 }}>Aucune compétition</div>
            <div style={{ fontSize: 13, color: 'var(--fg3)' }}>Générez les compétitions depuis l'onglet Compétitions</div>
          </div>
        ) : (
          <>
            {/* Competition selector */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {competitions.map((c: any) => {
                const isActive = comp?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedComp(c.id)}
                    style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: isActive ? '#dc2626' : 'var(--b3)', color: isActive ? '#fff' : 'var(--fg3)', transition: 'all 0.15s' }}
                  >
                    {c.age_category} · {c.weight_category}kg {c.gender}
                  </button>
                );
              })}
            </div>

            {comp && (
              <>
                {/* Competition info bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--fg3)', padding: '10px 16px', background: 'var(--inp)', border: '1px solid var(--b2)', borderRadius: 10 }}>
                  <span style={{ color: 'var(--fg2)', fontWeight: 500 }}>{FORMAT_LABEL[comp.format_type] || comp.format_type}</span>
                  <span>·</span>
                  <span>{comp.athlete_count ?? 0} athlètes</span>
                  <span>·</span>
                  <span style={{ textTransform: 'capitalize' }}>{STYLE_LABELS[comp.style] ?? comp.style}</span>
                </div>

                {isLoading ? (
                  <div style={{ color: 'var(--fg3)', fontSize: 13, padding: '20px 0' }}>Chargement…</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Bracket view */}
                    {comp.format_type === 'nordic' && (
                      <NordicView matches={bracketData?.matches || []} pools={bracketData?.pools || []} />
                    )}
                    {comp.format_type === 'pools_finals' && (
                      <PoolsFinalsView matches={bracketData?.matches || []} pools={bracketData?.pools || []} />
                    )}
                    {comp.format_type === 'bracket_repechage' && (
                      <BracketView matches={bracketData?.matches || []} />
                    )}

                    {/* Rankings */}
                    {rankings.length > 0 && (
                      <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid var(--b2)' }}>
                          <Trophy size={14} color="#fbbf24" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>Classement</span>
                        </div>
                        <div style={{ padding: '8px 0' }}>
                          {rankings.map((r: any, i: number) => {
                            const rs = RANK_STYLE(i);
                            return (
                              <div key={r.athlete_id || i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px', borderTop: i > 0 ? '1px solid var(--b1)' : 'none' }}>
                                <div style={{ width: 26, height: 26, borderRadius: 8, background: rs.bg, color: rs.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                                  {r.rank ?? i + 1}
                                </div>
                                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{r.athlete_name || r.name}</span>
                                <span style={{ fontSize: 11, color: 'var(--fg3)' }}>{r.club_name || r.club}</span>
                                {r.points !== undefined && (
                                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--fg3)' }}>{r.points} pts</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── Modal suppression ── */}
      {deleteModal && comp && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'var(--ovl)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteModal(null); }}
        >
          <div style={{ background: 'var(--card)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 16, padding: 28, maxWidth: 460, width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.6)' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={18} color="#f87171" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg)' }}>Supprimer le tableau</div>
                <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 2 }}>Cette action est irréversible</div>
              </div>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
              {/* Option 1 : ce tableau uniquement */}
              <button
                onClick={() => setDeleteModal('single')}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: deleteModal === 'single' ? 'rgba(239,68,68,0.1)' : 'var(--inp)', border: deleteModal === 'single' ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--b3)', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${deleteModal === 'single' ? '#f87171' : 'var(--dim)'}`, background: deleteModal === 'single' ? '#f87171' : 'transparent', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: deleteModal === 'single' ? 'var(--fg)' : 'var(--fg2)' }}>
                    Ce tableau uniquement
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 3 }}>
                    {comp.weight_category}kg {comp.gender} · {comp.age_category} · {STYLE_LABELS[comp.style] ?? comp.style}
                  </div>
                </div>
              </button>

              {/* Option 2 : tous les tableaux de la catégorie d'âge */}
              {sameAgeComps.length > 1 && (
                <button
                  onClick={() => setDeleteModal('bulk')}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: deleteModal === 'bulk' ? 'rgba(239,68,68,0.1)' : 'var(--inp)', border: deleteModal === 'bulk' ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--b3)', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${deleteModal === 'bulk' ? '#f87171' : 'var(--dim)'}`, background: deleteModal === 'bulk' ? '#f87171' : 'transparent', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: deleteModal === 'bulk' ? 'var(--fg)' : 'var(--fg2)' }}>
                      Tous les tableaux {comp.age_category}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 3 }}>
                      {sameAgeComps.length} compétition{sameAgeComps.length !== 1 ? 's' : ''} — toutes catégories de poids
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Option force — super admin uniquement */}
            {isGlobalAdmin && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 9, border: `1px solid ${forceDelete ? 'rgba(239,68,68,0.4)' : 'var(--b2)'}`, background: forceDelete ? 'rgba(239,68,68,0.08)' : 'var(--inp)' }}>
                  <input
                    type="checkbox"
                    checked={forceDelete}
                    onChange={e => setForceDelete(e.target.checked)}
                    style={{ marginTop: 2, accentColor: '#ef4444', width: 15, height: 15, flexShrink: 0, cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: forceDelete ? '#f87171' : 'var(--fg3)' }}>
                      ⚡ Forcer la suppression (super admin)
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 2 }}>
                      Supprime même les combats en cours ou déjà validés — les résultats seront perdus
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setDeleteModal(null); setForceDelete(false); }}
                disabled={isPendingDelete}
                style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: '1px solid var(--b3)', background: 'var(--inp)', color: 'var(--fg2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isPendingDelete}
                style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', background: forceDelete ? '#7f1d1d' : '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: isPendingDelete ? 'not-allowed' : 'pointer', opacity: isPendingDelete ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {isPendingDelete ? (
                  <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Suppression…</>
                ) : (
                  <><Trash2 size={13} /> {forceDelete ? 'Forcer la suppression' : 'Confirmer la suppression'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
