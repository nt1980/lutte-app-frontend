import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';

const WIN_TYPES = [
  { value: 'points',      label: 'Aux points',       short: 'PTS' },
  { value: 'superiority', label: 'Supériorité',       short: 'SUP' },
  { value: 'fall',        label: 'Tombé',             short: 'TOM' },
  { value: 'forfeit',     label: 'Forfait',           short: 'FOR' },
  { value: 'abandon',     label: 'Abandon',           short: 'ABA' },
  { value: 'dq',          label: 'Disqualif.',        short: 'DQ'  },
];

const DURATIONS: Record<string, number> = {
  U7: 60, U9: 90, U11: 90, U13: 120, U15: 120, default: 180,
};

function useIsMobile() {
  const [v, setV] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setV(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return v;
}

export default function RefView() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate    = useNavigate();
  const qc          = useQueryClient();
  const isMobile    = useIsMobile();

  const [scoreRed,  setScoreRed]  = useState(0);
  const [scoreBlue, setScoreBlue] = useState(0);
  const [winType,   setWinType]   = useState('points');
  const [timer,     setTimer]     = useState(0);
  const [running,   setRunning]   = useState(false);
  const [period,    setPeriod]    = useState(1);
  const [showFinish, setShowFinish] = useState(false);

  const { data: match } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => api.get(`/api/matches/${matchId}`).then(r => r.data),
    refetchInterval: running ? false : 8000,
  });

  const totalDuration = DURATIONS[match?.age_category] ?? DURATIONS.default;
  const remaining     = Math.max(0, totalDuration - timer);
  const pct           = totalDuration > 0 ? (timer / totalDuration) * 100 : 0;
  const isUrgent      = remaining < 30 && remaining > 0 && running;

  useEffect(() => {
    if (!running) return;
    if (timer >= totalDuration) { setRunning(false); return; }
    const t = setInterval(() => setTimer(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [running, timer, totalDuration]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Broadcast live-score en temps réel vers l'écran live (debounce 400ms)
  const liveScoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!matchId) return;
    if (liveScoreTimer.current) clearTimeout(liveScoreTimer.current);
    liveScoreTimer.current = setTimeout(() => {
      api.put(`/api/matches/${matchId}/live-score`, { score_red: scoreRed, score_blue: scoreBlue }).catch(() => {});
    }, 400);
    return () => { if (liveScoreTimer.current) clearTimeout(liveScoreTimer.current); };
  }, [scoreRed, scoreBlue, matchId]);

  const addPoint = useCallback((side: 'red' | 'blue', pts: number) => {
    if (side === 'red')  setScoreRed(p  => Math.max(0, p + pts));
    else                 setScoreBlue(p => Math.max(0, p + pts));
  }, []);

  const mutation = useMutation({
    mutationFn: ({ winner_id, loser_id }: any) =>
      api.put(`/api/matches/${matchId}/result`, {
        winner_id, loser_id,
        score_red: scoreRed, score_blue: scoreBlue, win_type: winType,
      }),
    onSuccess: () => {
      toast.success('Résultat enregistré');
      qc.invalidateQueries({ queryKey: ['match', matchId] });
      setShowFinish(false);
    },
    onError: () => toast.error('Erreur lors de l\'enregistrement'),
  });

  const finish = (winnerId: string, loserId: string) => {
    if (!winnerId) return toast.error('Athlete introuvable');
    mutation.mutate({ winner_id: winnerId, loser_id: loserId });
  };

  if (!match) return (
    <div style={{ height: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#374151', animation: 'bounce 1s infinite', animationDelay: `${i * 120}ms` }} />)}
      </div>
    </div>
  );

  const finished = match.status === 'finished';

  // ─── Boutons de points ───
  const POINTS = [1, 2, 3, 4];

  /* ════════════════════════════════════════════════
     VUE MOBILE — inspirée de l'interface de référence
  ════════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div style={{ height: '100vh', background: '#050505', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(0,0,0,0.7)', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
          >
            ← Combat live
          </button>
          <div style={{
            fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 20,
            background: finished ? 'rgba(34,197,94,0.15)' : running ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
            color: finished ? '#4ade80' : running ? '#f87171' : '#6b7280',
          }}>
            {finished ? '✓ Terminé' : running ? '● En jeu' : `P${period}/2`}
          </div>
          <div style={{ fontSize: 11, color: '#4b5563' }}>
            {match.age_category} · {match.weight_category}kg
          </div>
        </div>

        {/* Zone scores — rouge gauche, bleu droite */}
        <div style={{ display: 'flex', flexShrink: 0, height: '34vh' }}>

          {/* Rouge */}
          <div style={{ flex: 1, background: 'linear-gradient(160deg,#991b1b,#b91c1c)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            <div style={{ height: 3, background: '#ef4444', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', gap: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Rouge</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2 }}>
                {match.red_name || '—'}
              </div>
              {match.red_club && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{match.red_club}</div>}
              <div style={{ fontSize: '4rem', fontWeight: 900, color: '#fff', lineHeight: 1, marginTop: 4 }}>{scoreRed}</div>
            </div>
          </div>

          {/* Séparateur chrono */}
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

          {/* Bleu */}
          <div style={{ flex: 1, background: 'linear-gradient(160deg,#1d4ed8,#2563eb)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ height: 3, background: '#3b82f6', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', gap: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Bleu</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2 }}>
                {match.blue_name || '—'}
              </div>
              {match.blue_club && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{match.blue_club}</div>}
              <div style={{ fontSize: '4rem', fontWeight: 900, color: '#fff', lineHeight: 1, marginTop: 4 }}>{scoreBlue}</div>
            </div>
          </div>
        </div>

        {/* Boutons de points */}
        {!finished && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 12px', flexShrink: 0 }}>
            {/* Rouge : +1 +2 +3 +4 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                {POINTS.map(p => (
                  <button key={p} onClick={() => addPoint('red', p)} style={{
                    background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 10,
                    fontWeight: 900, fontSize: 18, cursor: 'pointer',
                    paddingTop: 14, paddingBottom: 14,
                    boxShadow: '0 3px 12px rgba(185,28,28,0.4)',
                    transition: 'transform 0.08s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
                  onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    +{p}
                  </button>
                ))}
              </div>
              <button onClick={() => addPoint('red', -1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#6b7280', fontSize: 12, cursor: 'pointer', padding: '6px 0' }}>
                −1 correction
              </button>
            </div>

            {/* Bleu : +1 +2 +3 +4 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                {POINTS.map(p => (
                  <button key={p} onClick={() => addPoint('blue', p)} style={{
                    background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10,
                    fontWeight: 900, fontSize: 18, cursor: 'pointer',
                    paddingTop: 14, paddingBottom: 14,
                    boxShadow: '0 3px 12px rgba(29,78,216,0.4)',
                    transition: 'transform 0.08s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
                  onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    +{p}
                  </button>
                ))}
              </div>
              <button onClick={() => addPoint('blue', -1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#6b7280', fontSize: 12, cursor: 'pointer', padding: '6px 0' }}>
                −1 correction
              </button>
            </div>
          </div>
        )}

        {/* Barre inférieure : Démarrer | Reset+Période | Résultat */}
        {!finished && (
          <div style={{ display: 'flex', gap: 0, flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Démarrer / Pause */}
            <button
              onClick={() => setRunning(r => !r)}
              style={{
                flex: 2, padding: '16px 0',
                background: running ? '#f59e0b' : '#1d4ed8',
                color: running ? '#000' : '#fff',
                border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {running ? '⏸ Pause' : '▶ Démarrer'}
            </button>

            {/* Chrono + Reset + Période */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderLeft: '1px solid rgba(255,255,255,0.07)', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '8px 0', gap: 4 }}>
              <div style={{ fontSize: isUrgent ? 20 : 18, fontWeight: 900, fontFamily: 'monospace', color: isUrgent ? '#ef4444' : '#fff', letterSpacing: '-1px' }}>
                {fmt(remaining)}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => { setTimer(0); setRunning(false); }}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 7, color: '#9ca3af', fontSize: 13, cursor: 'pointer', padding: '4px 10px' }}
                >
                  ↺
                </button>
                {period === 1 && !running && timer > 0 && (
                  <button
                    onClick={() => { setTimer(0); setPeriod(2); }}
                    style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 7, color: '#60a5fa', fontSize: 10, cursor: 'pointer', padding: '4px 8px', fontWeight: 600 }}
                  >
                    P2
                  </button>
                )}
              </div>
            </div>

            {/* Bouton résultat / drapeau */}
            <button
              onClick={() => setShowFinish(true)}
              style={{
                flex: 1, padding: '16px 0',
                background: '#d97706',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              🏁
            </button>
          </div>
        )}

        {/* Finished state */}
        {finished && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#4ade80' }}>Combat terminé</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{match.winner_name} gagne</div>
          </div>
        )}

        {/* ── Modal résultat ── */}
        {showFinish && (
          <>
            <div onClick={() => setShowFinish(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
            <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#111', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px 20px 0 0', zIndex: 201, padding: '20px 20px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>🏁 Déclarer la victoire</div>

              {/* Type de victoire */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Victoire par</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {WIN_TYPES.map(w => (
                    <button key={w.value} onClick={() => setWinType(w.value)} style={{
                      padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: winType === w.value ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                      color: winType === w.value ? '#fff' : '#6b7280',
                    }}>
                      {w.short} <span style={{ fontWeight: 400, fontSize: 11 }}>— {w.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Boutons victoire */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => finish(match.red_athlete_id, match.blue_athlete_id)}
                  disabled={mutation.isPending}
                  style={{ flex: 1, padding: '16px', borderRadius: 14, background: '#b91c1c', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 15, boxShadow: '0 4px 20px rgba(185,28,28,0.4)' }}
                >
                  🏆 ROUGE gagne
                </button>
                <button
                  onClick={() => finish(match.blue_athlete_id, match.red_athlete_id)}
                  disabled={mutation.isPending}
                  style={{ flex: 1, padding: '16px', borderRadius: 14, background: '#1d4ed8', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 15, boxShadow: '0 4px 20px rgba(29,78,216,0.4)' }}
                >
                  🏆 BLEU gagne
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════
     VUE DESKTOP — layout original (inline styles)
  ════════════════════════════════════════════════ */
  return (
    <div style={{ height: '100vh', background: '#050505', color: '#fff', display: 'flex', flexDirection: 'column', userSelect: 'none', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9ca3af' }}>
          <span style={{ fontWeight: 600, color: '#d1d5db' }}>{match.age_category}</span>
          <span>·</span><span>{match.weight_category} kg</span>
          <span>·</span><span style={{ textTransform: 'capitalize' }}>{match.style}</span>
        </div>
        <div style={{
          fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
          padding: '4px 12px', borderRadius: 20,
          background: finished ? 'rgba(34,197,94,0.15)' : running ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
          color: finished ? '#4ade80' : running ? '#f87171' : '#6b7280',
        }}>
          {finished ? '✓ Terminé' : running ? '● En jeu' : `Période ${period}/2`}
        </div>
        <div style={{ fontSize: 10, color: '#374151', fontFamily: 'monospace' }}>{matchId?.slice(0, 8)}</div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* ROUGE */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg,#7f1d1d,#991b1b)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ height: 3, background: '#ef4444', flexShrink: 0 }} />
          <div style={{ padding: '24px 32px' }}>
            <div style={{ fontSize: 30, fontWeight: 900, textTransform: 'uppercase', color: '#fff', lineHeight: 1.1 }}>{match.red_name || 'ROUGE'}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{match.red_club}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '9rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', textShadow: '0 4px 32px rgba(0,0,0,0.5)' }}>{scoreRed}</div>
          </div>
          {!finished && (
            <div style={{ padding: '0 32px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxWidth: 320 }}>
                {POINTS.map(p => (
                  <button key={p} onClick={() => addPoint('red', p)} style={{ background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 22, cursor: 'pointer', padding: '18px 0', boxShadow: '0 4px 16px rgba(185,28,28,0.4)', transition: 'transform 0.08s' }}
                    onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                    onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                    onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >+{p}</button>
                ))}
              </div>
              <button onClick={() => addPoint('red', -1)} style={{ marginTop: 6, width: '100%', maxWidth: 320, padding: '9px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>−1 correction</button>
            </div>
          )}
          {!finished && (
            <div style={{ padding: '0 32px 24px' }}>
              <button onClick={() => finish(match.red_athlete_id, match.blue_athlete_id)} disabled={mutation.isPending}
                style={{ width: '100%', maxWidth: 320, padding: '14px', borderRadius: 14, background: '#7f1d1d', border: '2px solid rgba(239,68,68,0.3)', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 20px rgba(127,29,29,0.4)' }}>
                🏆 Victoire ROUGE
              </button>
            </div>
          )}
        </div>

        {/* CENTRE */}
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '24px 16px', background: '#080808', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>

          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: isUrgent ? '3.8rem' : '3.5rem', fontWeight: 900, fontFamily: 'monospace', color: isUrgent ? '#ef4444' : '#fff', letterSpacing: '-3px', lineHeight: 1, transition: 'color 0.3s' }}>
              {fmt(remaining)}
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, margin: '10px 0', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${100 - pct}%`, background: isUrgent ? '#ef4444' : '#3b82f6', borderRadius: 2, transition: 'width 1s linear, background 0.3s' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
              <button onClick={() => setRunning(r => !r)} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: running ? '#f59e0b' : '#16a34a', color: running ? '#000' : '#fff' }}>
                {running ? '⏸' : '▶'}
              </button>
              <button onClick={() => { setTimer(0); setRunning(false); }} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#6b7280', fontSize: 14, cursor: 'pointer' }}>↺</button>
            </div>
            {period === 1 && !running && timer > 0 && (
              <button onClick={() => { setTimer(0); setPeriod(2); }} style={{ marginTop: 8, fontSize: 11, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer' }}>→ Période 2</button>
            )}
          </div>

          <div style={{ width: '100%' }}>
            <div style={{ fontSize: 10, color: '#4b5563', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Victoire par</div>
            {WIN_TYPES.map(w => (
              <button key={w.value} onClick={() => setWinType(w.value)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, marginBottom: 2, background: winType === w.value ? 'rgba(255,255,255,0.1)' : 'transparent', color: winType === w.value ? '#fff' : '#6b7280', fontWeight: winType === w.value ? 700 : 400 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4b5563', marginRight: 6 }}>{w.short}</span>{w.label}
              </button>
            ))}
          </div>

          {finished && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 18 }}>✓</div>
              <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>Enregistré</div>
              <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>{match.winner_name} gagne</div>
            </div>
          )}
        </div>

        {/* BLEU */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg,#1e3a8a,#1d4ed8)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ height: 3, background: '#3b82f6', flexShrink: 0 }} />
          <div style={{ padding: '24px 32px', textAlign: 'right' }}>
            <div style={{ fontSize: 30, fontWeight: 900, textTransform: 'uppercase', color: '#fff', lineHeight: 1.1 }}>{match.blue_name || 'BLEU'}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{match.blue_club}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '9rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', textShadow: '0 4px 32px rgba(0,0,0,0.5)' }}>{scoreBlue}</div>
          </div>
          {!finished && (
            <div style={{ padding: '0 32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, width: '100%', maxWidth: 320 }}>
                {POINTS.map(p => (
                  <button key={p} onClick={() => addPoint('blue', p)} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 22, cursor: 'pointer', padding: '18px 0', boxShadow: '0 4px 16px rgba(29,78,216,0.4)', transition: 'transform 0.08s' }}
                    onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                    onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                    onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >+{p}</button>
                ))}
              </div>
              <button onClick={() => addPoint('blue', -1)} style={{ marginTop: 6, width: '100%', maxWidth: 320, padding: '9px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>−1 correction</button>
            </div>
          )}
          {!finished && (
            <div style={{ padding: '0 32px 24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => finish(match.blue_athlete_id, match.red_athlete_id)} disabled={mutation.isPending}
                style={{ width: '100%', maxWidth: 320, padding: '14px', borderRadius: 14, background: '#1e3a8a', border: '2px solid rgba(59,130,246,0.3)', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 20px rgba(30,58,138,0.4)' }}>
                🏆 Victoire BLEU
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
