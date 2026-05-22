import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Activity, Tv, AlertCircle, Clock, CornerDownLeft, Check, GripVertical, UserCheck } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import { useAuth } from '../store/auth';
import api from '../lib/api';
import toast from 'react-hot-toast';

const STYLE_SHORT: Record<string, string> = {
  libre: 'Libre', greco: 'Gréco', feminine: 'Fém.',
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

export default function MatManager() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  /* ── Data ── */
  const { data: allMats = [] } = useQuery({
    queryKey: ['mats', id],
    queryFn: () => api.get(`/api/tournaments/${id}/mats`).then(r => r.data),
    refetchInterval: 10000,
  });

  // Utilisateurs du tournoi (pour la liste d'arbitres)
  const { data: tournamentUsers = [] } = useQuery({
    queryKey: ['tournament-users', id],
    queryFn: () => api.get(`/api/tournaments/${id}/users`).then(r => r.data).catch(() => []),
    staleTime: 30000,
  });
  const refereeUsers = tournamentUsers.filter((u: any) => u.role === 'referee');

  // Rôle de l'utilisateur courant dans ce tournoi
  const myRole: string = tournamentUsers.find((u: any) => u.user_id === user?.id)?.role ?? '';
  const isReferee = myRole === 'referee';
  const isAdmin   = myRole === 'tournament_admin' || myRole === 'mat_manager'
    || (user?.globalRoles || []).some((r: string) => ['super_admin', 'admin'].includes(r));

  const { data: queue = [] } = useQuery({
    queryKey: ['queue', id],
    queryFn: () => api.get(`/api/tournaments/${id}/queue`).then(r => r.data),
    refetchInterval: 5000,
  });

  // Pour un arbitre : seulement son tapis. Pour les autres : tous les tapis actifs.
  const activeMats = allMats.filter((m: any) => m.is_active !== false);
  const mats = isReferee
    ? activeMats.filter((m: any) => m.referee_id === user?.id)
    : activeMats;

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

  // Un arbitre ne voit que la file de son tapis, pas la file globale
  const unassigned: any[] = isReferee ? [] : queue
    .filter((q: any) => !q.mat_id && q.status === 'ready')
    .sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999));

  const activeCount = queue.filter((q: any) => q.status === 'on_mat').length;

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
        title="Gestion des tapis"
        subtitle={`${mats.length} actif${mats.length !== 1 ? 's' : ''} · ${activeCount} en cours${unassigned.length > 0 ? ` · ${unassigned.length} en attente` : ''}`}
      />

      <div style={{ padding: isMobile ? '12px' : '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Grille des tapis actifs ── */}
        {mats.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
            <Activity size={28} color="#374151" strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              {isReferee ? 'Aucun tapis affecté' : 'Aucun tapis actif'}
            </div>
            <div style={{ fontSize: 12, color: '#4b5563' }}>
              {isReferee ? 'Contactez le responsable du tournoi pour être affecté à un tapis' : 'Ajoutez des tapis dans les Paramètres du tournoi'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, alignItems: 'start' }}>
            {Object.values(byMat).map(({ mat, matches }: any) => {
              const current  = matches.find((m: any) => m.status === 'on_mat') ?? matches[0] ?? null;
              const matQueue = matches.filter((m: any) => m !== current);
              const hasActivity = current?.status === 'on_mat';

              return (
                <div key={mat.id} style={{ background: '#0e0e0e', border: `1px solid ${hasActivity ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 16, overflow: 'hidden' }}>
                  {/* Header tapis */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${hasActivity ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.05)'}`, background: hasActivity ? 'rgba(251,191,36,0.04)' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: hasActivity ? 'rgba(251,191,36,0.14)' : 'rgba(255,255,255,0.05)', border: `1px solid ${hasActivity ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={15} color={hasActivity ? '#fbbf24' : '#4b5563'} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{mat.name}</div>
                        {hasActivity
                          ? <div style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.04em' }}>● EN COURS</div>
                          : <div style={{ fontSize: 10, color: '#374151' }}>Libre</div>
                        }
                      </div>
                    </div>
                    <Link to={`/mat/${mat.id}`} target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#60a5fa', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.18)', borderRadius: 8, padding: '5px 11px', textDecoration: 'none' }}>
                      <Tv size={11} /> Live
                    </Link>
                  </div>

                  {/* ── Sélecteur d'arbitre (admins uniquement) ── */}
                  {isAdmin && (
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <UserCheck size={11} color="#4b5563" style={{ flexShrink: 0 }} />
                        <select
                          value={mat.referee_id ?? ''}
                          disabled={hasActivity || assignReferee.isPending}
                          onChange={e => assignReferee.mutate({ matId: mat.id, refereeId: e.target.value || null })}
                          title={hasActivity ? 'Impossible de changer l\'arbitre pendant un combat' : 'Sélectionner un arbitre'}
                          style={{
                            flex: 1, fontSize: 11, background: hasActivity ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${mat.referee_id ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: 7, color: mat.referee_id ? '#93c5fd' : '#4b5563',
                            padding: '4px 8px', outline: 'none', cursor: hasActivity ? 'not-allowed' : 'pointer',
                            opacity: hasActivity ? 0.5 : 1,
                          }}
                        >
                          <option value="">— Aucun arbitre —</option>
                          {refereeUsers.map((u: any) => (
                            <option key={u.user_id} value={u.user_id}>{u.user_name || u.user_email}</option>
                          ))}
                        </select>
                        {hasActivity && (
                          <span style={{ fontSize: 9, color: '#4b5563', flexShrink: 0 }}>Combat en cours</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Arbitre affiché (vue arbitre) ── */}
                  {isReferee && mat.referee_name && (
                    <div style={{ padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <UserCheck size={10} color="#60a5fa" />
                      <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>{mat.referee_name}</span>
                    </div>
                  )}

                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {current ? (
                      <CurrentMatchCard
                        match={current}
                        onUnassign={() => unassign.mutate(current.id)}
                        onPromote={() => promote.mutate(current.id)}
                        isUnassigning={unassign.isPending}
                        isPromoting={promote.isPending}
                        isReferee={isReferee}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', color: '#2d2d2d', fontSize: 12 }}>Tapis libre</div>
                    )}
                    {matQueue.length > 0 && !isReferee && (
                      <MatQueueSection
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

        {/* ── File globale non affectée ── */}
        {unassigned.length > 0 && (
          <div style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '12px 14px' : '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <AlertCircle size={13} color="#f87171" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Combats en attente</span>
              <span style={{ background: 'rgba(248,113,113,0.14)', color: '#f87171', borderRadius: 6, padding: '1px 9px', fontSize: 11, fontWeight: 700 }}>{unassigned.length}</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#374151' }}>Affecter à un tapis →</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {unassigned.map((q: any, idx: number) => (
                <div
                  key={q.id}
                  draggable
                  onDragStart={() => { setDraggedId(q.id); setDragOverId(null); }}
                  onDragOver={e => { e.preventDefault(); setDragOverId(q.id); }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={() => { handleDrop(draggedId!, q.id, unassigned); setDraggedId(null); setDragOverId(null); }}
                  onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: isMobile ? '10px 14px' : '9px 18px',
                    borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: dragOverId === q.id ? 'rgba(96,165,250,0.06)' : (idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'),
                    opacity: draggedId === q.id ? 0.4 : 1,
                    cursor: 'grab',
                    transition: 'background 0.1s',
                  }}
                >
                  <GripVertical size={12} color="#374151" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#374151', width: 18, textAlign: 'center', flexShrink: 0 }}>{q.position ?? idx + 1}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.red_name || '?'}</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#2d2d2d', flexShrink: 0 }}>vs</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{q.blue_name || '?'}</span>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#4b5563', whiteSpace: 'nowrap', flexShrink: 0, display: isMobile ? 'none' : 'block' }}>{q.age_category} · {q.weight_category}kg</span>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {mats.map((mat: any) => (
                      <button key={mat.id} onClick={() => assign.mutate({ queueId: q.id, matId: mat.id })} title={`Affecter à ${mat.name}`}
                        style={{ fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {mat.name.replace('Tapis ', '')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

/* ─── Sous-composants ─── */

function CurrentMatchCard({
  match, onUnassign, onPromote, isUnassigning, isPromoting, isReferee,
}: {
  match: any; onUnassign: () => void; onPromote: () => void;
  isUnassigning: boolean; isPromoting: boolean; isReferee?: boolean;
}) {
  const isOnMat = match.status === 'on_mat';
  return (
    <div style={{ background: isOnMat ? 'rgba(251,191,36,0.06)' : 'rgba(96,165,250,0.05)', border: `1px solid ${isOnMat ? 'rgba(251,191,36,0.18)' : 'rgba(96,165,250,0.15)'}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px 6px 12px', background: isOnMat ? 'rgba(251,191,36,0.08)' : 'rgba(96,165,250,0.07)', borderBottom: `1px solid ${isOnMat ? 'rgba(251,191,36,0.12)' : 'rgba(96,165,250,0.1)'}` }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: isOnMat ? '#fbbf24' : '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {isOnMat ? '● Combat en cours' : '▶ Prochain combat'}
        </span>
        {/* Bouton dissocier — masqué pour les arbitres */}
        {!isReferee && (
          <button
            onClick={onUnassign}
            disabled={isUnassigning}
            title="Dissocier du tapis — remettre en file globale"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}
          >
            <CornerDownLeft size={10} />
            Dissocier
          </button>
        )}
      </div>
      <div style={{ padding: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.red_name || '?'}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>vs</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{match.blue_name || '?'}</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#4b5563', textAlign: 'center', marginBottom: 10 }}>
          {match.age_category} · {match.weight_category}kg · {STYLE_SHORT[match.style] ?? match.style}
        </div>

        {isOnMat && match.match_id ? (
          <Link to={`/ref/${match.match_id}`} target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#fff', background: '#dc2626', borderRadius: 8, padding: '8px 0', textDecoration: 'none' }}>
            Arbitrer ce combat →
          </Link>
        ) : !isOnMat && !isReferee ? (
          /* Bouton "Lancer ce combat" — passe de ready → on_mat (réservé aux admins/mat_manager) */
          <button
            onClick={onPromote}
            disabled={isPromoting}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: '#fff', background: 'rgba(34,197,94,0.85)', border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', letterSpacing: '0.02em' }}
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

function MatQueueSection({
  items, onUnassign, onConfirm, isPending, isConfirming,
  draggedId, dragOverId, setDraggedId, setDragOverId, onDrop,
}: {
  items: any[]; onUnassign: (id: string) => void; onConfirm: (id: string) => void;
  isPending: boolean; isConfirming: boolean;
  draggedId: string | null; dragOverId: string | null;
  setDraggedId: (id: string | null) => void; setDragOverId: (id: string | null) => void;
  onDrop: (dragId: string, targetId: string) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
        <Clock size={10} color="#4b5563" />
        <span style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          File de ce tapis ({items.length})
        </span>
      </div>
      <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
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
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px',
                borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: dragOverId === q.id ? 'rgba(96,165,250,0.08)' : (i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'),
                opacity: draggedId === q.id ? 0.4 : 1,
                cursor: 'grab',
                transition: 'background 0.1s',
              }}
            >
              <GripVertical size={11} color="#2d2d2d" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#374151', width: 14, textAlign: 'center', flexShrink: 0 }}>{q.position ?? i + 1}</span>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.red_name || '?'}</span>
              <span style={{ fontSize: 9, color: '#2d2d2d', fontWeight: 700 }}>vs</span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{q.blue_name || '?'}</span>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />

              {/* Confirmer / infirmer */}
              <button
                onClick={() => onConfirm(q.id)}
                disabled={isConfirming}
                title={isConfirmed ? 'Retirer la confirmation (masque du live)' : 'Confirmer — afficher sur l\'écran live'}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 5,
                  background: isConfirmed ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isConfirmed ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  color: isConfirmed ? '#4ade80' : '#4b5563',
                  cursor: 'pointer',
                }}
              >
                <Check size={9} />
                {isConfirmed ? 'OK' : '?'}
              </button>

              {/* Dissocier */}
              <button
                onClick={() => onUnassign(q.id)}
                disabled={isPending}
                title="Dissocier — remettre en attente"
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
