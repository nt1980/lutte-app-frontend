import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';

function useIsMobile() {
  const [v, setV] = useState(() => window.innerWidth < 700);
  useEffect(() => {
    const fn = () => setV(window.innerWidth < 700);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return v;
}

export default function MatLive() {
  const { matId }         = useParams<{ matId: string }>();
  const [data, setData]   = useState<any>(null);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetch = () => api.get(`/api/mats/${matId}/live`).then(r => setData(r.data)).catch(() => {});
    fetch();
    const iv = setInterval(fetch, 3000);
    return () => clearInterval(iv);
  }, [matId]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTimer(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const current = data?.current;
  const next    = data?.next ?? [];

  // ──────────────────────────────────────────
  // Styles communs
  // ──────────────────────────────────────────
  const scoreStyle: React.CSSProperties = {
    fontSize: isMobile ? '5rem' : '9rem',
    fontWeight: 900,
    lineHeight: 1,
    color: '#fff',
    fontVariantNumeric: 'tabular-nums',
    textShadow: '0 4px 32px rgba(0,0,0,0.5)',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: isMobile ? 16 : 22,
    fontWeight: 900,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '-0.5px',
    lineHeight: 1.1,
  };

  const clubStyle: React.CSSProperties = {
    fontSize: isMobile ? 11 : 13,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 3,
    fontWeight: 400,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: isMobile ? 9 : 10,
    fontWeight: 800,
    letterSpacing: '0.15em',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
  };

  return (
    <div style={{ height: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '10px 16px' : '12px 24px',
        background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {data?.mat_name || 'Tapis'}
        </div>

        {current && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: isMobile ? 10 : 11, color: '#9ca3af' }}>
            <span style={{ fontWeight: 600, color: '#d1d5db' }}>{current.age_category}</span>
            <span style={{ color: '#374151' }}>·</span>
            <span>{current.weight_category} kg</span>
            {!isMobile && <><span style={{ color: '#374151' }}>·</span><span style={{ textTransform: 'capitalize' }}>{current.style}</span></>}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: running ? '#ef4444' : '#374151', boxShadow: running ? '0 0 8px rgba(239,68,68,0.7)' : 'none', transition: 'all 0.3s' }} />
          <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 800, color: running ? '#ef4444' : '#374151', letterSpacing: '0.15em' }}>LIVE</span>
        </div>
      </div>

      {/* ── Zone principale ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 0 }}>

        {/* ══ ROUGE ══ */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 40%, #b91c1c 100%)',
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Barre couleur */}
          <div style={{ height: isMobile ? 3 : 4, background: '#ef4444', flexShrink: 0 }} />

          {/* Contenu */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? '14px 18px' : '28px 40px' }}>
            {/* Nom en haut */}
            <div>
              <div style={labelStyle}>Rouge</div>
              <div style={{ ...nameStyle, marginTop: 4 }}>
                {current?.red_name
                  ? <>
                      <span>{current.red_name.split(' ')[0]}</span>
                      {current.red_name.split(' ').length > 1 && (
                        <span style={{ fontWeight: 400, display: 'block', fontSize: isMobile ? 13 : 18 }}>
                          {current.red_name.split(' ').slice(1).join(' ')}
                        </span>
                      )}
                    </>
                  : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                }
              </div>
              {current?.red_club && <div style={clubStyle}>{current.red_club}</div>}
            </div>

            {/* Score au centre */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={scoreStyle}>{current?.score_red ?? 0}</div>
            </div>
          </div>
        </div>

        {/* ══ Centre : chrono ══ */}
        <div style={{
          background: '#050505',
          borderTop: isMobile ? '1px solid rgba(255,255,255,0.06)' : 'none',
          borderBottom: isMobile ? '1px solid rgba(255,255,255,0.06)' : 'none',
          borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.06)',
          borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 24 : 0,
          flexDirection: isMobile ? 'row' : 'column',
          padding: isMobile ? '12px 24px' : '24px 20px',
          flexShrink: 0,
          width: isMobile ? 'auto' : 200,
        }}>
          {/* Chrono */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: isMobile ? '2rem' : '3.5rem',
              fontWeight: 900, fontFamily: 'monospace',
              color: '#fff', letterSpacing: '-2px',
              lineHeight: 1,
            }}>
              {fmt(timer)}
            </div>
            <div style={{ fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 4 }}>Chrono</div>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'row' : 'column', width: isMobile ? 'auto' : '100%' }}>
            <button
              onClick={() => setRunning(r => !r)}
              style={{
                padding: isMobile ? '8px 18px' : '10px 0',
                borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                background: running ? '#f59e0b' : '#16a34a',
                color: running ? '#000' : '#fff',
                width: isMobile ? 'auto' : '100%',
                transition: 'background 0.15s',
              }}
            >
              {running ? '⏸ PAUSE' : '▶ START'}
            </button>
            <button
              onClick={() => { setTimer(0); setRunning(false); }}
              style={{
                padding: isMobile ? '8px 14px' : '8px 0',
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', color: '#6b7280', fontSize: 13,
                width: isMobile ? 'auto' : '100%',
              }}
            >
              ↺ Reset
            </button>
          </div>

          {!current && (
            <div style={{ fontSize: isMobile ? 18 : 28, fontWeight: 900, color: '#374151' }}>VS</div>
          )}
        </div>

        {/* ══ BLEU ══ */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #2563eb 100%)',
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ height: isMobile ? 3 : 4, background: '#3b82f6', flexShrink: 0 }} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? '14px 18px' : '28px 40px', alignItems: isMobile ? 'flex-start' : 'flex-end' }}>
            <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
              <div style={labelStyle}>Bleu</div>
              <div style={{ ...nameStyle, marginTop: 4 }}>
                {current?.blue_name
                  ? <>
                      <span>{current.blue_name.split(' ')[0]}</span>
                      {current.blue_name.split(' ').length > 1 && (
                        <span style={{ fontWeight: 400, display: 'block', fontSize: isMobile ? 13 : 18 }}>
                          {current.blue_name.split(' ').slice(1).join(' ')}
                        </span>
                      )}
                    </>
                  : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                }
              </div>
              {current?.blue_club && <div style={clubStyle}>{current.blue_club}</div>}
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <div style={scoreStyle}>{current?.score_blue ?? 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Prochains combats ── */}
      {next.length > 0 && (
        <div style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '10px 14px' : '12px 24px', flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Prochains combats</div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }}>
            {next.map((m: any, i: number) => (
              <div key={m.id} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '8px 12px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4b5563' }}>#{i + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>{m.red_name || '?'}</span>
                <span style={{ fontSize: 10, color: '#374151' }}>vs</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd' }}>{m.blue_name || '?'}</span>
                {!isMobile && <span style={{ fontSize: 10, color: '#4b5563', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 10 }}>{m.age_category} · {m.weight_category}kg</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── État vide ── */}
      {!current && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 5 }}>
          <div style={{ fontSize: isMobile ? 56 : 80, fontWeight: 900, color: '#1f2937', lineHeight: 1 }}>—</div>
          <div style={{ fontSize: 12, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 12 }}>En attente d'un combat</div>
        </div>
      )}
    </div>
  );
}
