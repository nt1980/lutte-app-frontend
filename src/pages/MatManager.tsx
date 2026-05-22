import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  Activity, Tv, AlertCircle, Clock, Plus, Trash2, Pencil,
  Check, X, CornerDownLeft, ToggleLeft, ToggleRight,
} from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
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

  // État gestion tapis
  const [newMatName, setNewMatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /* ── Data ── */
  const { data: allMats = [] } = useQuery({
    queryKey: ['mats', id],
    queryFn: () => api.get(`/api/tournaments/${id}/mats`).then(r => r.data),
  });

  const { data: queue = [] } = useQuery({
    queryKey: ['queue', id],
    queryFn: () => api.get(`/api/tournaments/${id}/queue`).then(r => r.data),
    refetchInterval: 5000,
  });

  // Tapis actifs uniquement pour la vue opérationnelle
  const mats = allMats.filter((m: any) => m.is_active !== false);

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

  /* ── Mutations tapis ── */
  const addMat = useMutation({
    mutationFn: (name: string) => api.post(`/api/tournaments/${id}/mats`, { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mats', id] }); setNewMatName(''); toast.success('Tapis ajouté'); },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Erreur'),
  });

  const updateMat = useMutation({
    mutationFn: (data: { matId: string; name?: string; is_active?: boolean }) =>
      api.put(`/api/mats/${data.matId}`, { name: data.name, is_active: data.is_active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mats', id] }); setEditingId(null); },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Erreur'),
  });

  const deleteMat = useMutation({
    mutationFn: (matId: string) => api.delete(`/api/mats/${matId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mats', id] });
      qc.invalidateQueries({ queryKey: ['queue', id] });
      setConfirmDeleteId(null);
      toast.success('Tapis supprimé');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Erreur', { duration: 6000 }),
  });

  /* ── Données dérivées ── */
  const byMat = mats.reduce((acc: any, mat: any) => {
    const matches = queue
      .filter((q: any) => q.mat_id === mat.id)
      .sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999));
    acc[mat.id] = { mat, matches };
    return acc;
  }, {});

  const unassigned: any[] = queue
    .filter((q: any) => !q.mat_id && q.status === 'ready')
    .sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999));

  const activeCount = queue.filter((q: any) => q.status === 'on_mat').length;

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
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Aucun tapis actif</div>
            <div style={{ fontSize: 12, color: '#4b5563' }}>Ajoutez des tapis dans la section ci-dessous</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, alignItems: 'start' }}>
            {Object.values(byMat).map(({ mat, matches }: any) => {
              const current = matches.find((m: any) => m.status === 'on_mat') ?? matches[0] ?? null;
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

                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {current ? (
                      <CurrentMatchCard match={current} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', color: '#2d2d2d', fontSize: 12 }}>Tapis libre</div>
                    )}
                    {matQueue.length > 0 && (
                      <MatQueueSection items={matQueue} onUnassign={qid => unassign.mutate(qid)} isPending={unassign.isPending} />
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
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: isMobile ? '10px 14px' : '9px 18px', borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
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

        {/* ════════════════════════════════════════
            GESTION DES TAPIS — section permanente
        ════════════════════════════════════════ */}
        <div style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, overflow: 'hidden' }}>

          {/* Header section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={13} color="#6b7280" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Gestion des tapis</div>
              <div style={{ fontSize: 10, color: '#4b5563', marginTop: 1 }}>Ajouter, renommer, activer ou supprimer des tapis — disponible même en cours de compétition</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#374151', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 5, fontWeight: 600 }}>
              {allMats.length} tapis
            </span>
          </div>

          {/* Liste de tous les tapis */}
          <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allMats.length === 0 && (
              <div style={{ fontSize: 12, color: '#374151', textAlign: 'center', padding: '12px 0' }}>Aucun tapis — ajoutez-en ci-dessous</div>
            )}

            {allMats.map((mat: any) => {
              const isActive = mat.is_active !== false;

              if (editingId === mat.id) {
                return (
                  <div key={mat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px' }}>
                    <input
                      autoFocus
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && editingName.trim()) updateMat.mutate({ matId: mat.id, name: editingName.trim() });
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, padding: '6px 10px', fontSize: 13, color: '#fff', outline: 'none' }}
                    />
                    <button onClick={() => editingName.trim() && updateMat.mutate({ matId: mat.id, name: editingName.trim() })} disabled={updateMat.isPending}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', cursor: 'pointer', padding: 0 }}>
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280', cursor: 'pointer', padding: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                );
              }

              if (confirmDeleteId === mat.id) {
                return (
                  <div key={mat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px' }}>
                    <span style={{ flex: 1, fontSize: 12, color: '#f87171', fontWeight: 600 }}>Supprimer «&nbsp;{mat.name}&nbsp;» ? Les combats en attente seront désaffectés.</span>
                    <button onClick={() => deleteMat.mutate(mat.id)} disabled={deleteMat.isPending}
                      style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 7, background: '#dc2626', border: 'none', color: '#fff', cursor: 'pointer' }}>
                      {deleteMat.isPending ? '…' : 'Supprimer'}
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280', cursor: 'pointer', padding: 0 }}>
                      <X size={13} />
                    </button>
                  </div>
                );
              }

              return (
                <div key={mat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)'}`, borderRadius: 10, padding: '10px 14px', opacity: isActive ? 1 : 0.5 }}>

                  {/* Indicateur actif/inactif */}
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#22c55e' : '#374151', flexShrink: 0 }} />

                  {/* Nom */}
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: isActive ? '#e5e7eb' : '#6b7280' }}>{mat.name}</span>

                  {/* Badge inactif */}
                  {!isActive && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5, padding: '1px 7px' }}>Inactif</span>
                  )}

                  {/* Toggle actif/inactif */}
                  <button
                    onClick={() => updateMat.mutate({ matId: mat.id, is_active: !isActive })}
                    disabled={updateMat.isPending}
                    title={isActive ? 'Désactiver ce tapis' : 'Réactiver ce tapis'}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 7, background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isActive ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`, color: isActive ? '#4ade80' : '#6b7280', cursor: 'pointer' }}
                  >
                    {isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {isActive ? 'Actif' : 'Inactif'}
                  </button>

                  {/* Renommer */}
                  <button
                    onClick={() => { setEditingId(mat.id); setEditingName(mat.name); setConfirmDeleteId(null); }}
                    title="Renommer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6b7280', cursor: 'pointer', padding: 0 }}
                  >
                    <Pencil size={13} />
                  </button>

                  {/* Supprimer */}
                  <button
                    onClick={() => { setConfirmDeleteId(mat.id); setEditingId(null); }}
                    title="Supprimer définitivement"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', padding: 0 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}

            {/* Ajouter un tapis */}
            <div style={{ display: 'flex', gap: 8, paddingTop: allMats.length > 0 ? 4 : 0 }}>
              <input
                value={newMatName}
                onChange={e => setNewMatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newMatName.trim()) addMat.mutate(newMatName.trim()); }}
                placeholder="Nom du nouveau tapis (ex : Tapis E)"
                style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: '#fff', outline: 'none' }}
              />
              <button
                onClick={() => { if (newMatName.trim()) addMat.mutate(newMatName.trim()); }}
                disabled={!newMatName.trim() || addMat.isPending}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: newMatName.trim() ? '#dc2626' : 'rgba(255,255,255,0.04)', color: newMatName.trim() ? '#fff' : '#374151', padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: newMatName.trim() ? 'pointer' : 'default', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
              >
                <Plus size={14} />
                {addMat.isPending ? 'Ajout…' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

/* ─── Sous-composants ─── */

function CurrentMatchCard({ match }: { match: any }) {
  const isOnMat = match.status === 'on_mat';
  return (
    <div style={{ background: isOnMat ? 'rgba(251,191,36,0.06)' : 'rgba(96,165,250,0.05)', border: `1px solid ${isOnMat ? 'rgba(251,191,36,0.18)' : 'rgba(96,165,250,0.15)'}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '6px 12px', background: isOnMat ? 'rgba(251,191,36,0.08)' : 'rgba(96,165,250,0.07)', borderBottom: `1px solid ${isOnMat ? 'rgba(251,191,36,0.12)' : 'rgba(96,165,250,0.1)'}` }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: isOnMat ? '#fbbf24' : '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {isOnMat ? '● Combat en cours' : '▶ Prochain combat'}
        </span>
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
        <div style={{ fontSize: 10, color: '#4b5563', textAlign: 'center', marginBottom: isOnMat && match.match_id ? 10 : 0 }}>
          {match.age_category} · {match.weight_category}kg · {STYLE_SHORT[match.style] ?? match.style}
        </div>
        {isOnMat && match.match_id && (
          <Link to={`/ref/${match.match_id}`} target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#fff', background: '#dc2626', borderRadius: 8, padding: '8px 0', textDecoration: 'none' }}>
            Vue arbitre →
          </Link>
        )}
      </div>
    </div>
  );
}

function MatQueueSection({ items, onUnassign, isPending }: { items: any[]; onUnassign: (id: string) => void; isPending: boolean }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
        <Clock size={10} color="#4b5563" />
        <span style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          File de ce tapis ({items.length})
        </span>
      </div>
      <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
        {items.map((q: any, i: number) => (
          <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#374151', width: 14, textAlign: 'center', flexShrink: 0 }}>{q.position ?? i + 1}</span>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.red_name || '?'}</span>
            <span style={{ fontSize: 9, color: '#2d2d2d', fontWeight: 700 }}>vs</span>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{q.blue_name || '?'}</span>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: '#374151', whiteSpace: 'nowrap', flexShrink: 0 }}>{q.age_category}·{q.weight_category}kg</span>
            {q.status === 'ready' && (
              <button onClick={() => onUnassign(q.id)} disabled={isPending} title="Désaffecter — remettre en attente"
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', padding: 0 }}>
                <CornerDownLeft size={11} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
