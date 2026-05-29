import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  Activity, Tv, AlertCircle, Clock, CornerDownLeft, Check,
  GripVertical, UserCheck, RefreshCw, Baby,
} from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import { useAuth } from '../store/auth';
import api from '../lib/api';
import toast from 'react-hot-toast';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function restElapsedMs(q: any, now: number): number | null {
  const red  = q.red_last_fight_at  ? now - new Date(q.red_last_fight_at).getTime()  : null;
  const blue = q.blue_last_fight_at ? now - new Date(q.blue_last_fight_at).getTime() : null;
  if (red === null && blue === null) return null;
  if (red === null) return blue;
  if (blue === null) return red;
  return Math.min(red, blue);
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function GBadgeSm({ g }: { g: string }) {
  const cfg = g === 'M'
    ? { text: 'M',  bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)'  }
    : g === 'F'
    ? { text: 'F',  bg: 'rgba(236,72,153,0.15)',  color: '#f472b6', border: 'rgba(236,72,153,0.3)'  }
    : { text: 'MX', bg: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: 'rgba(167,139,250,0.3)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', height: 16, borderRadius: 4, fontSize: 9, fontWeight: 800, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.text}
    </span>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function JeunesMats() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const [draggedId,  setDraggedId]  = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Data ── */
  const { data: tournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.get(`/api/tournaments/${id}`).then(r => r.data),
    staleTime: 30000,
  });
  const minRestMs = ((tournament?.min_rest_minutes ?? 5) as number) * 60_000;

  const { data: allMats = [] } = useQuery({
    queryKey: ['mats', id],
    queryFn: () => api.get(`/api/tournaments/${id}/mats`).then(r => r.data),
    refetchInterval: 10000,
  });

  const { data: tournamentUsers = [] } = useQuery({
    queryKey: ['tournament-users', id],
    queryFn: () => api.get(`/api/tournaments/${id}/users`).then(r => r.data).catch(() => []),
    staleTime: 30000,
  });
  const refereeUsers = tournamentUsers;

  const myRole: string = tournamentUsers.find((u: any) => u.user_id === user?.id)?.role ?? '';
  const isAdmin = myRole === 'tournament_admin' || myRole === 'mat_manager'
    || (user?.globalRoles || []).some((r: string) => ['super_admin', 'admin'].includes(r));
  const isReferee = !isAdmin && (
    myRole === 'referee' ||
    allMats.some((m: any) => m.referee_id === user?.id)
  );

  const { data: rawQueue = [] } = useQuery({
    queryKey: ['queue', id],
    queryFn: () => api.get(`/api/tournaments/${id}/queue`).then(r => r.data),
    refetchInterval: 5000,
  });

  /* ── Filtre jeunes : tapis + queue ── */
  const mats = allMats.filter((m: any) => m.is_active !== false && m.is_jeune === true);
  const queue = (rawQueue as any[]).filter((q: any) => q.competition_source === 'jeunes');

  /* ── Mutations queue ── */
  const assign = useMutation({
    mutationFn: ({ queueId, matId }: { queueId: string; matId: string }) =>
      api.put(`/api/queue/${queueId}/assign-mat`, { mat_id: matId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queue', id] }); toast.success('Combat affecté'); },
    onError: () => toast.error('Erreur'),
  });

  const unassign = useMutation({
    mutationFn: (queueId: string) => api.put(`/api/queue/${queueId}/unassign`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queue', id] }); toast.success('Combat remis en attente'); },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Erreur', { duration: 5000 }),
  });

  const promote = useMutation({
    mutationFn: (queueId: string) => api.put(`/api/queue/${queueId}/promote`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queue', id] }); toast.success('Combat lancé sur le tapis'); },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Erreur', { duration: 5000 }),
  });

  const confirm = useMutation({
    mutationFn: (queueId: string) => api.put(`/api/queue/${queueId}/confirm`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queue', id] }); },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Erreur'),
  });

  const reorder = useMutation({
    mutationFn: (items: { id: string; position: number }[]) =>
      api.put(`/api/tournaments/${id}/queue/reorder`, { items }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue', id] }),
    onError: () => toast.error('Erreur réordonnancement'),
  });

  const assignReferee = useMutation({
    mutationFn: ({ matId, refereeId }: { matId: string; refereeId: string | null }) =>
      api.put(`/api/mats/${matId}/referee`, { referee_id: refereeId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mats', id] }); toast.success('Arbitre mis à jour'); },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Erreur', { duration: 5000 }),
  });

  /* ── Données dérivées ── */
  const byMat = mats.reduce((acc: any, mat: any) => {
    const matches = queue
      .filter((q: any) => q.mat_id === mat.id)
      .sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999));
    acc[mat.id] = { mat, matches };
    return acc;
  }, {});

  const unassigned: any[] = isReferee ? [] : queue
    .filter((q: any) => !q.mat_id && q.status === 'ready')
    .sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999));

  const activeCount = queue.filter((q: any) => q.status === 'on_mat').length;

  /* ── Tri de la file globale ── */
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = useCallback((col: string) => {
    setSortCol(prev => {
      if (prev === col) {
        if (sortDir === 'asc') { setSortDir('desc'); return col; }
        setSortDir('asc'); return null;
      }
      setSortDir('asc');
      return col;
    });
  }, [sortDir]);

  const sortedUnassigned = useMemo(() => {
    if (!sortCol) return unassigned;
    return [...unassigned].sort((a, b) => {
      let va: number | string, vb: number | string;
      switch (sortCol) {
        case 'poule': va = a.pool_name ?? ''; vb = b.pool_name ?? ''; break;
        case 'age':   va = a.age_category ?? ''; vb = b.age_category ?? ''; break;
        case 'genre': va = a.gender ?? ''; vb = b.gender ?? ''; break;
        case 'repos': va = restElapsedMs(a, now) ?? -1; vb = restElapsedMs(b, now) ?? -1; break;
        default: return 0;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }, [unassigned, sortCol, sortDir, now]);

  /* ── Drag helpers ── */
  const handleDrop = useCallback((dragId: string, targetId: string, list: any[]) => {
    if (!dragId || dragId === targetId) return;
    const newList = [...list];
    const fromIdx = newList.findIndex(x => x.id === dragId);
    const toIdx   = newList.findIndex(x => x.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [removed] = newList.splice(fromIdx, 1);
    newList.splice(toIdx, 0, removed);
    const items = newList.map((item, idx) => ({ id: item.id, position: idx + 1 }));
    reorder.mutate(items);
  }, [reorder]);

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Tapis Jeunes"
        subtitle={`${mats.length} tapis jeune${mats.length !== 1 ? 's' : ''} · ${activeCount} en cours${unassigned.length > 0 ? ` · ${unassigned.length} en attente` : ''}`}
      />

      <div style={{ padding: isMobile ? '12px' : '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Grille des tapis jeunes ── */}
        {mats.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', background: 'var(--card2)', border: '1px solid var(--b2)', borderRadius: 16 }}>
            <Baby size={32} color="var(--dim)" strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}>
              Aucun tapis Jeunes configuré
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg3)', marginBottom: 6 }}>
              Créez des tapis dans les <strong>Paramètres</strong> du tournoi et activez le flag&nbsp;
              <span style={{ color: '#a78bfa', fontWeight: 700 }}>Jeunes</span>.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'start' }}>
            {Object.values(byMat).map(({ mat, matches }: any) => {
              const current  = matches.find((m: any) => m.status === 'on_mat') ?? matches[0] ?? null;
              const matQueue = matches.filter((m: any) => m !== current);
              const hasActivity = current?.status === 'on_mat';

              return (
                <div key={mat.id} style={{
                  flex: isMobile ? '1 1 100%' : (hasActivity ? '2 1 420px' : '1 1 260px'),
                  minWidth: isMobile ? undefined : (hasActivity ? 380 : 240),
                  transition: 'flex 0.35s ease, min-width 0.35s ease',
                  background: 'var(--card2)',
                  border: `1px solid ${hasActivity ? 'rgba(167,139,250,0.35)' : 'var(--b2)'}`,
                  borderRadius: 16, overflow: 'hidden',
                }}>
                  {/* Header tapis */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${hasActivity ? 'rgba(167,139,250,0.15)' : 'var(--b1)'}`, background: hasActivity ? 'rgba(167,139,250,0.06)' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: hasActivity ? 'rgba(167,139,250,0.14)' : 'var(--inp)', border: `1px solid ${hasActivity ? 'rgba(167,139,250,0.3)' : 'var(--b3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Baby size={15} color={hasActivity ? '#a78bfa' : 'var(--fg3)'} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', lineHeight: 1.2 }}>{mat.name}</div>
                          <span style={{ fontSize: 9, fontWeight: 800, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', borderRadius: 4, padding: '1px 6px', border: '1px solid rgba(167,139,250,0.25)' }}>JEUNES</span>
                        </div>
                        {hasActivity
                          ? <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.04em' }}>● EN COURS</div>
                          : <div style={{ fontSize: 10, color: 'var(--dim)' }}>Libre</div>
                        }
                      </div>
                    </div>
                    {!isReferee && (
                      <Link to={`/mat/${mat.id}`} target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#60a5fa', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.18)', borderRadius: 8, padding: '5px 11px', textDecoration: 'none' }}>
                        <Tv size={11} /> Live
                      </Link>
                    )}
                  </div>

                  {/* Sélecteur d'arbitre (admins) */}
                  {isAdmin && (
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--b1)', background: 'var(--inp)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <UserCheck size={11} color="var(--fg3)" style={{ flexShrink: 0 }} />
                        <select
                          value={mat.referee_id ?? ''}
                          disabled={hasActivity || assignReferee.isPending}
                          onChange={e => assignReferee.mutate({ matId: mat.id, refereeId: e.target.value || null })}
                          style={{ flex: 1, fontSize: 11, background: 'var(--inp)', border: `1px solid ${mat.referee_id ? 'rgba(96,165,250,0.25)' : 'var(--b3)'}`, borderRadius: 7, color: mat.referee_id ? '#93c5fd' : 'var(--fg3)', padding: '4px 8px', outline: 'none', cursor: hasActivity ? 'not-allowed' : 'pointer', opacity: hasActivity ? 0.5 : 1 }}
                        >
                          <option value="">— Aucun arbitre —</option>
                          {refereeUsers.map((u: any) => (
                            <option key={u.user_id} value={u.user_id}>{u.user_name || u.name || u.user_email || u.email}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {isReferee && mat.referee_name && (
                    <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <UserCheck size={10} color="#60a5fa" />
                      <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>{mat.referee_name}</span>
                    </div>
                  )}

                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {current ? (
                      <JeunesMatchCard
                        match={current}
                        onUnassign={() => unassign.mutate(current.id)}
                        onPromote={() => promote.mutate(current.id)}
                        isUnassigning={unassign.isPending}
                        isPromoting={promote.isPending}
                        isReferee={isReferee}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', color: 'var(--b4)', fontSize: 12 }}>Tapis libre</div>
                    )}
                    {matQueue.length > 0 && !isReferee && (
                      <JeunesMatQueueSection
                        items={matQueue}
                        onUnassign={qid => unassign.mutate(qid)}
                        onConfirm={qid => confirm.mutate(qid)}
                        isPending={unassign.isPending}
                        isConfirming={confirm.isPending}
                        draggedId={draggedId}
                        dragOverId={dragOverId}
                        setDraggedId={setDraggedId}
                        setDragOverId={setDragOverId}
                        onDrop={(dId, tId) => handleDrop(dId, tId, matQueue)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── File globale non affectée (combats jeunes) ── */}
        {unassigned.length > 0 && (
          <div style={{ background: 'var(--card2)', border: '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '10px 14px' : '11px 18px', borderBottom: '1px solid var(--b2)' }}>
              <AlertCircle size={13} color="#f87171" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>Combats jeunes en attente</span>
              <span style={{ background: 'rgba(248,113,113,0.14)', color: '#f87171', borderRadius: 6, padding: '1px 9px', fontSize: 11, fontWeight: 700 }}>{unassigned.length}</span>
              <button
                onClick={() => { qc.invalidateQueries({ queryKey: ['queue', id] }); setNow(Date.now()); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--inp)', border: '1px solid var(--b3)', color: 'var(--fg3)', borderRadius: 7, padding: '3px 9px', fontSize: 11, cursor: 'pointer' }}
              >
                <RefreshCw size={11} /> Actualiser
              </button>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--dim)' }}>Affecter à un tapis →</span>
            </div>

            {/* En-têtes colonnes */}
            <div style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) 28px minmax(0,1fr) 80px 28px 60px auto', alignItems: 'center', gap: 0, padding: '5px 14px', borderBottom: '1px solid var(--b1)', background: 'var(--inp)' }}>
              <ColH>#</ColH>
              <ColH>Rouge</ColH>
              <div />
              <ColH right>Bleu</ColH>
              <SortColH label="Poule" col="poule" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <SortColH label="S"     col="genre" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <SortColH label="Repos" col="repos" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <ColH right>Tapis</ColH>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {sortedUnassigned.map((q: any, idx: number) => {
                const elapsedMs = restElapsedMs(q, now);
                const tooSoon   = elapsedMs !== null && elapsedMs < minRestMs;
                const dragActive = !sortCol && !tooSoon;
                const rowBg = dragOverId === q.id
                  ? 'rgba(96,165,250,0.06)'
                  : tooSoon
                  ? 'rgba(251,191,36,0.06)'
                  : (idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)');

                return (
                  <div
                    key={q.id}
                    draggable={dragActive}
                    onDragStart={() => { if (dragActive) { setDraggedId(q.id); setDragOverId(null); } }}
                    onDragOver={e => { e.preventDefault(); if (dragActive) setDragOverId(q.id); }}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={() => { if (dragActive) handleDrop(draggedId!, q.id, unassigned); setDraggedId(null); setDragOverId(null); }}
                    onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '28px minmax(0,1fr) 28px minmax(0,1fr) 80px 28px 60px auto',
                      alignItems: 'center', gap: 0,
                      padding: '7px 14px',
                      borderTop: idx > 0 ? `1px solid ${tooSoon ? 'rgba(251,191,36,0.2)' : 'var(--b1)'}` : 'none',
                      background: rowBg,
                      opacity: draggedId === q.id ? 0.4 : 1,
                      cursor: tooSoon ? 'not-allowed' : sortCol ? 'default' : 'grab',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* # */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <GripVertical size={10} color={tooSoon ? '#92400e' : dragActive ? 'var(--b4)' : 'var(--b2)'} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: tooSoon ? '#92400e' : 'var(--dim)' }}>{q.position ?? idx + 1}</span>
                    </div>

                    {/* Rouge */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.red_name || '?'}</span>
                      </div>
                      {q.red_club && <div style={{ fontSize: 10, color: 'var(--fg3)', marginTop: 1, paddingLeft: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.red_club}</div>}
                    </div>

                    {/* vs */}
                    <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'var(--b4)' }}>vs</div>

                    {/* Bleu */}
                    <div style={{ minWidth: 0, textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.blue_name || '?'}</span>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                      </div>
                      {q.blue_club && <div style={{ fontSize: 10, color: 'var(--fg3)', marginTop: 1, paddingRight: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.blue_club}</div>}
                    </div>

                    {/* Poule */}
                    <div style={{ textAlign: 'center' }}>
                      {q.pool_name && (
                        <span style={{ display: 'inline-block', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 800 }}>
                          {q.pool_name}{q.round != null ? ` R${q.round}` : ''}
                        </span>
                      )}
                    </div>

                    {/* Sexe */}
                    <div style={{ textAlign: 'center' }}><GBadgeSm g={q.gender} /></div>

                    {/* Repos */}
                    <div style={{ textAlign: 'center' }}>
                      {elapsedMs === null ? (
                        <span style={{ fontSize: 10, color: 'var(--dim)' }}>—</span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 800, color: tooSoon ? '#fbbf24' : '#4ade80', background: tooSoon ? 'rgba(251,191,36,0.1)' : 'rgba(74,222,128,0.08)', border: `1px solid ${tooSoon ? 'rgba(251,191,36,0.3)' : 'rgba(74,222,128,0.2)'}`, borderRadius: 4, padding: '1px 5px' }}>
                          {formatElapsed(elapsedMs)}
                        </span>
                      )}
                    </div>

                    {/* Boutons tapis */}
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      {mats.map((mat: any) => (
                        <button
                          key={mat.id}
                          onClick={() => !tooSoon && assign.mutate({ queueId: q.id, matId: mat.id })}
                          disabled={tooSoon}
                          title={tooSoon ? `Repos insuffisant (min ${tournament?.min_rest_minutes ?? 5} min)` : `Affecter à ${mat.name}`}
                          style={{ fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 6, background: tooSoon ? 'rgba(251,191,36,0.08)' : 'var(--b3)', border: `1px solid ${tooSoon ? 'rgba(251,191,36,0.2)' : 'var(--b4)'}`, color: tooSoon ? '#92400e' : 'var(--fg2)', cursor: tooSoon ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' as const, opacity: tooSoon ? 0.6 : 1 }}
                        >
                          {mat.name.replace('Tapis ', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

/* ─── En-têtes de colonnes ─── */

function ColH({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: right ? 'right' : 'left' }}>
      {children}
    </div>
  );
}

function SortColH({ label, col, sortCol, sortDir, onSort }: { label: string; col: string; sortCol: string | null; sortDir: 'asc' | 'desc'; onSort: (c: string) => void }) {
  const active = sortCol === col;
  return (
    <button
      onClick={() => onSort(col)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, background: active ? 'rgba(96,165,250,0.08)' : 'none', border: active ? '1px solid rgba(96,165,250,0.2)' : '1px solid transparent', borderRadius: 4, cursor: 'pointer', padding: '1px 4px', width: '100%', fontSize: 9, fontWeight: 700, color: active ? '#93c5fd' : 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'background 0.15s, color 0.15s' }}
    >
      {label}
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: '6px', marginTop: 1 }}>
        <span style={{ fontSize: 6, color: active && sortDir === 'asc' ? '#60a5fa' : 'var(--b4)', lineHeight: '7px' }}>▲</span>
        <span style={{ fontSize: 6, color: active && sortDir === 'desc' ? '#60a5fa' : 'var(--b4)', lineHeight: '7px' }}>▼</span>
      </span>
    </button>
  );
}

/* ─── Carte combat courant (version jeunes — affiche poule + round) ─── */

function JeunesMatchCard({ match, onUnassign, onPromote, isUnassigning, isPromoting, isReferee }: {
  match: any; onUnassign: () => void; onPromote: () => void;
  isUnassigning: boolean; isPromoting: boolean; isReferee?: boolean;
}) {
  const isOnMat = match.status === 'on_mat';
  const accentCol = isOnMat ? 'rgba(167,139,250,' : 'rgba(96,165,250,';
  const accentHex = isOnMat ? '#a78bfa' : '#60a5fa';
  return (
    <div style={{ background: `${accentCol}0.06)`, border: `1px solid ${accentCol}0.18)`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px 6px 12px', background: `${accentCol}0.08)`, borderBottom: `1px solid ${accentCol}0.12)` }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: accentHex, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {isOnMat ? '● Combat en cours' : '▶ Prochain combat'}
        </span>
        {!isReferee && (
          <button
            onClick={onUnassign}
            disabled={isUnassigning}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}
          >
            <CornerDownLeft size={10} />
            Dissocier
          </button>
        )}
      </div>
      <div style={{ padding: '12px' }}>
        {/* Poule + round */}
        {match.pool_name && (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span style={{ display: 'inline-block', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', borderRadius: 5, padding: '1px 8px', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em' }}>
              {match.pool_name}{match.round != null ? ` · R${match.round}` : ''}
            </span>
          </div>
        )}
        {/* Combattants */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'start', gap: 8, marginBottom: 6 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.red_name || '?'}</span>
            </div>
            {match.red_club && <div style={{ fontSize: 10, color: 'var(--fg3)', marginTop: 2, paddingLeft: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.red_club}</div>}
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--dim)', marginTop: 2 }}>vs</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.blue_name || '?'}</span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
            </div>
            {match.blue_club && <div style={{ fontSize: 10, color: 'var(--fg3)', marginTop: 2, paddingRight: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.blue_club}</div>}
          </div>
        </div>
        {/* Catégorie */}
        <div style={{ fontSize: 10, color: 'var(--fg3)', textAlign: 'center', marginBottom: 10 }}>
          {match.age_category}
          {match.weight_category && ` · ${match.weight_category}kg`}
        </div>

        {isOnMat && match.match_id ? (
          <Link to={`/ref/${match.match_id}`} target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#fff', background: '#dc2626', borderRadius: 8, padding: '8px 0', textDecoration: 'none' }}>
            Arbitrer ce combat →
          </Link>
        ) : !isOnMat && !isReferee ? (
          <button
            onClick={onPromote}
            disabled={isPromoting}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: '#fff', background: 'rgba(34,197,94,0.85)', border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer' }}
          >
            ▶ {isPromoting ? 'Lancement…' : 'Lancer ce combat'}
          </button>
        ) : !isOnMat && isReferee ? (
          <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, color: '#4b5563' }}>
            En attente du lancement par le responsable tapis
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ─── File d'attente par tapis (version jeunes) ─── */

function JeunesMatQueueSection({ items, onUnassign, onConfirm, isPending, isConfirming, draggedId, dragOverId, setDraggedId, setDragOverId, onDrop }: {
  items: any[]; onUnassign: (id: string) => void; onConfirm: (id: string) => void;
  isPending: boolean; isConfirming: boolean;
  draggedId: string | null; dragOverId: string | null;
  setDraggedId: (id: string | null) => void; setDragOverId: (id: string | null) => void;
  onDrop: (dragId: string, targetId: string) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
        <Clock size={10} color="var(--fg3)" />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          File ({items.length})
        </span>
      </div>
      <div style={{ border: '1px solid var(--b2)', borderRadius: 10, overflow: 'hidden' }}>
        {items.map((q: any, i: number) => {
          const isConfirmed = q.confirmed === true;
          return (
            <div
              key={q.id}
              draggable
              onDragStart={() => { setDraggedId(q.id); setDragOverId(null); }}
              onDragOver={e => { e.preventDefault(); setDragOverId(q.id); }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={() => { if (draggedId) onDrop(draggedId, q.id); setDraggedId(null); setDragOverId(null); }}
              onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderTop: i > 0 ? '1px solid var(--b1)' : 'none', background: dragOverId === q.id ? 'rgba(96,165,250,0.08)' : (i % 2 === 0 ? 'var(--inp)' : 'transparent'), opacity: draggedId === q.id ? 0.4 : 1, cursor: 'grab' }}
            >
              <GripVertical size={11} color="var(--b4)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--dim)', width: 14, textAlign: 'center', flexShrink: 0 }}>{q.position ?? i + 1}</span>
              {/* Rouge */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.red_name || '?'}</span>
                </div>
              </div>
              <span style={{ fontSize: 9, color: 'var(--b4)', fontWeight: 700, flexShrink: 0 }}>vs</span>
              {/* Bleu */}
              <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.blue_name || '?'}</span>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                </div>
              </div>
              {/* Poule */}
              {q.pool_name && (
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', borderRadius: 3, padding: '1px 5px' }}>{q.pool_name}</div>
                </div>
              )}
              {/* Confirmer */}
              <button
                onClick={() => onConfirm(q.id)}
                disabled={isConfirming}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 5, background: isConfirmed ? 'rgba(34,197,94,0.12)' : 'var(--inp)', border: `1px solid ${isConfirmed ? 'rgba(34,197,94,0.3)' : 'var(--b3)'}`, color: isConfirmed ? '#4ade80' : 'var(--fg3)', cursor: 'pointer' }}
              >
                <Check size={9} />
                {isConfirmed ? 'OK' : '?'}
              </button>
              {/* Dissocier */}
              <button
                onClick={() => onUnassign(q.id)}
                disabled={isPending}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', padding: 0 }}
              >
                <CornerDownLeft size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
