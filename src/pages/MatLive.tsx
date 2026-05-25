import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';

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
  // Route /mat/:matId          → matId (UUID ou slug global)
  // Route /t/:id/mat/:matSlug  → id (tournamentSlug) + matSlug
  const { matId, id: tournamentSlug, matSlug } = useParams<{
    matId?: string; id?: string; matSlug?: string;
  }>();
  const [data, setData] = useState<any>(null);
  const [timer, setTimer] = useState(0);
  const isMobile = useIsMobile();

  // Scores locaux mis à jour via WS
  const [scoreRed,  setScoreRed]  = useState<number | null>(null);
  const [scoreBlue, setScoreBlue] = useState<number | null>(null);
  const prevMatchIdRef = useRef<string | null>(null);

  // Choisir le bon endpoint selon le format de l'URL
  const apiPath = tournamentSlug && matSlug
    ? `/api/live/${tournamentSlug}/${matSlug}`   // /t/:tournamentSlug/mat/:matSlug
    : UUID_RE.test(matId ?? '')
      ? `/api/mats/${matId}/live`                // /mat/:uuid (rétrocompat)
      : `/api/live/${matId}`;                    // /mat/:globalSlug

  const fetchData = useCallback(() => {
    api.get(apiPath).then(r => setData(r.data)).catch(() => {});
  }, [apiPath]);

  // Polling de secours (5 s)
  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, [fetchData]);

  // Reset scores locaux quand le combat change
  useEffect(() => {
    const cid = data?.current?.id ?? null;
    if (cid !== prevMatchIdRef.current) {
      prevMatchIdRef.current = cid;
      setScoreRed(null);
      setScoreBlue(null);
      setTimer(0);
    }
  }, [data?.current?.id]);

  // Chrono auto — démarre quand un combat est en cours, reset sur changement
  useEffect(() => {
    if (!data?.current) { setTimer(0); return; }
    const t = setInterval(() => setTimer(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [data?.current?.id]);

  // WebSocket pour les mises à jour en temps réel
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
            // Met à jour les scores locaux si c'est le combat en cours
            setData((prev: any) => {
              if (!prev?.current || prev.current.id !== msg.match_id) return prev;
              return { ...prev, current: { ...prev.current, score_red: msg.score_red, score_blue: msg.score_blue } };
            });
            setScoreRed(msg.score_red);
            setScoreBlue(msg.score_blue);
          }
          if (['match_finished', 'match_assigned', 'match_unassigned', 'match_promoted', 'queue_confirmed', 'queue_reordered'].includes(msg.type)) {
            fetchData();
          }
        } catch {}
      };
      ws.onclose = () => { if (alive) setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    };
    connect();

    return () => { alive = false; ws?.close(); };
  }, [data?.tournament_id, fetchData]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const current = data?.current;
  const next    = data?.next ?? [];

  // Scores affichés : locaux (WS) si dispo, sinon depuis DB
  const displayRed  = scoreRed  !== null ? scoreRed  : (current?.score_red  ?? 0);
  const displayBlue = scoreBlue !== null ? scoreBlue : (current?.score_blue ?? 0);

  const nameStyle: React.CSSProperties = {
    fontSize: isMobile ? 22 : 38,
    fontWeight: 900,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '-0.5px',
    lineHeight: 1.1,
  };

  const clubStyle: React.CSSProperties = {
    fontSize: isMobile ? 13 : 18,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    fontWeight: 400,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: isMobile ? 10 : 12,
    fontWeight: 800,
    letterSpacing: '0.15em',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
  };

  const scoreStyle: React.CSSProperties = {
    fontSize: isMobile ? '5rem' : '9rem',
    fontWeight: 900,
    lineHeight: 1,
    color: '#fff',
    fontVariantNumeric: 'tabular-nums',
    textShadow: '0 4px 32px rgba(0,0,0,0.5)',
  };

  return (
    <div style={{ height: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '10px 16px' : '10px 28px',
        background: 'rgba(0,0,0,0.7)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0, zIndex: 10, gap: 16,
      }}>
        {/* Nom du tapis */}
        <div style={{ fontSize: isMobile ? 11 : 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0 }}>
          {data?.mat_name || 'Tapis'}
        </div>

        {/* Chrono — centré et grand */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{
            fontSize: isMobile ? '1.8rem' : '3rem',
            fontWeight: 900, fontFamily: 'monospace',
            color: current ? '#fff' : '#1f2937',
            letterSpacing: '-2px', lineHeight: 1,
          }}>
            {fmt(timer)}
          </div>
          {current && (
            <div style={{ fontSize: isMobile ? 10 : 12, color: '#4b5563', marginTop: 2 }}>
              {current.age_category} · {current.weight_category} kg · <span style={{ textTransform: 'capitalize' }}>{current.style}</span>
            </div>
          )}
        </div>

        {/* Badge LIVE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: current ? '#ef4444' : '#374151', boxShadow: current ? '0 0 8px rgba(239,68,68,0.7)' : 'none', transition: 'all 0.3s' }} />
          <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 800, color: current ? '#ef4444' : '#374151', letterSpacing: '0.15em' }}>LIVE</span>
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
          <div style={{ height: isMobile ? 3 : 5, background: '#ef4444', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? '16px 20px' : '36px 48px' }}>
            <div>
              <div style={labelStyle}>Rouge</div>
              <div style={{ ...nameStyle, marginTop: 6 }}>
                {current?.red_name
                  ? <>
                      <span>{current.red_name.split(' ')[0]}</span>
                      {current.red_name.split(' ').length > 1 && (
                        <span style={{ fontWeight: 400, display: 'block', fontSize: isMobile ? 17 : 28 }}>
                          {current.red_name.split(' ').slice(1).join(' ')}
                        </span>
                      )}
                    </>
                  : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                }
              </div>
              {current?.red_club && <div style={clubStyle}>{current.red_club}</div>}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={scoreStyle}>{displayRed}</div>
            </div>
          </div>
        </div>

        {/* ══ BLEU ══ */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #2563eb 100%)',
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ height: isMobile ? 3 : 5, background: '#3b82f6', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? '16px 20px' : '36px 48px', alignItems: isMobile ? 'flex-start' : 'flex-end' }}>
            <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
              <div style={labelStyle}>Bleu</div>
              <div style={{ ...nameStyle, marginTop: 6 }}>
                {current?.blue_name
                  ? <>
                      <span>{current.blue_name.split(' ')[0]}</span>
                      {current.blue_name.split(' ').length > 1 && (
                        <span style={{ fontWeight: 400, display: 'block', fontSize: isMobile ? 17 : 28 }}>
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
              <div style={scoreStyle}>{displayBlue}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Prochain combat (premier confirmé) ── */}
      {next.length > 0 && (
        <div style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          {/* Premier combat en vedette */}
          <div style={{ padding: isMobile ? '10px 16px' : '12px 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Prochain ›
            </div>
            <span style={{ fontSize: isMobile ? 14 : 18, fontWeight: 800, color: '#fca5a5' }}>{next[0].red_name || '?'}</span>
            <span style={{ fontSize: isMobile ? 11 : 13, color: '#374151', fontWeight: 700 }}>vs</span>
            <span style={{ fontSize: isMobile ? 14 : 18, fontWeight: 800, color: '#93c5fd' }}>{next[0].blue_name || '?'}</span>
            {!isMobile && (
              <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                {next[0].age_category} · {next[0].weight_category} kg · <span style={{ textTransform: 'capitalize' }}>{next[0].style}</span>
              </span>
            )}
          </div>
          {/* Autres combats suivants */}
          {next.length > 1 && (
            <div style={{ display: 'flex', gap: 8, padding: isMobile ? '0 16px 10px' : '0 28px 10px', overflowX: 'auto' }}>
              {next.slice(1).map((m: any, i: number) => (
                <div key={m.id} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '5px 10px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#374151' }}>#{i + 2}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5' }}>{m.red_name || '?'}</span>
                  <span style={{ fontSize: 9, color: '#374151' }}>vs</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd' }}>{m.blue_name || '?'}</span>
                  {!isMobile && <span style={{ fontSize: 9, color: '#4b5563', borderLeft: '1px solid rgba(255,255,255,0.07)', paddingLeft: 8 }}>{m.age_category} · {m.weight_category}kg</span>}
                </div>
              ))}
            </div>
          )}
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
