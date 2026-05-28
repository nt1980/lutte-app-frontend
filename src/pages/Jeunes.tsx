import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Baby, RefreshCw, Trash2, Play, AlertTriangle,
  ChevronDown, Monitor, Award, Swords,
} from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PoolAthlete {
  athlete_id: string;
  name: string;
  gender: string;
  weight: string | number;
  club: string;
  seed_order: number;
}

interface JeunesPool {
  id: string;
  age_category: string;
  weight_min: number;
  weight_max: number;
  gender_strategy: string;
  gender: string;
  pool_name: string;
  pool_status: string;
  mat_id: string | null;
  mat_name: string | null;
  referee_id: string | null;
  referee_name: string | null;
  match_count: number;
  matches_done: number;
  athletes: PoolAthlete[];
  display_order: number;
}

interface Unassigned {
  id: string;
  athlete_id: string;
  name: string;
  gender: string;
  club: string;
  age_category: string;
  weigh_in_weight: string | number;
  reason: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GENDER_LABEL: Record<string, string> = { M: 'Garçons', F: 'Filles', MX: 'Mixte' };
const GENDER_COLOR: Record<string, string> = { M: '#60a5fa', F: '#f472b6', MX: '#a78bfa' };

const AGE_TABS = ['Tout', 'U9', 'U11'];

const GENDER_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  M:  { label: 'M', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)'  },
  F:  { label: 'F', color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
  MX: { label: 'MX', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
};

function GenderBadge({ gender }: { gender: string }) {
  const b = GENDER_BADGE[gender] ?? { label: gender, color: 'var(--faint)', bg: 'var(--bg2)' };
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, color: b.color, background: b.bg,
      borderRadius: 4, padding: '1px 5px', flexShrink: 0, letterSpacing: '0.04em',
    }}>{b.label}</span>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function checkConstraints(athletes: PoolAthlete[], tolPct = 10): string[] {
  const v: string[] = [];
  if (athletes.length > 4) v.push(`Trop d'athlètes (${athletes.length}/4 max)`);
  if (athletes.length < 2) v.push('Moins de 2 athlètes');
  const ws = athletes.map(a => Number(a.weight)).filter(Boolean);
  if (ws.length > 1) {
    const spread = Math.max(...ws) / Math.min(...ws);
    if (spread > 1 + tolPct / 100) v.push(`Écart de poids > ${tolPct} % (${((spread - 1) * 100).toFixed(1)} %)`);
  }
  return v;
}

/** Retourne true si cet athlète est hors tolérance par rapport aux autres du groupe */
function isOutOfTolerance(weight: number, allWeights: number[], tolPct = 10): boolean {
  if (allWeights.length < 2) return false;
  const tol = 1 + tolPct / 100;
  const wMin = Math.min(...allWeights);
  const wMax = Math.max(...allWeights);
  if (wMax <= wMin * tol) return false; // poule valide → personne en rouge
  return weight > wMin * tol || weight < wMax / tol;
}

// ─── Pool Card ───────────────────────────────────────────────────────────────

function PoolCard({
  pool,
  onRemoveAthlete,
  compact = false,
  tolPct = 10,
}: {
  pool: JeunesPool;
  onRemoveAthlete?: (poolId: string, athleteId: string) => void;
  compact?: boolean;
  tolPct?: number;
}) {
  const athletes = pool.athletes ?? [];
  const violations = checkConstraints(athletes, tolPct);
  const color = GENDER_COLOR[pool.gender] ?? '#94a3b8';

  // Calcul du vrai min/max depuis les athlètes présents (mis à jour côté client)
  const weights = athletes.map(a => Number(a.weight)).filter(Boolean);
  const effMin = weights.length ? Math.min(...weights) : null;
  const effMax = weights.length ? Math.max(...weights) : null;

  return (
    <div style={{
      background: 'var(--card)',
      border: `1px solid ${violations.length ? 'rgba(239,68,68,0.4)' : 'var(--b2)'}`,
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        background: violations.length ? 'rgba(239,68,68,0.07)' : 'var(--bg2)',
        borderBottom: '1px solid var(--b2)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color, letterSpacing: '0.05em',
          background: `${color}20`, borderRadius: 6, padding: '2px 7px',
        }}>
          {pool.age_category}
        </div>
        <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: 'var(--fg)' }}>
          {pool.pool_name}
        </div>
        {/* Range de poids recalculée depuis les athlètes réels */}
        <div style={{ fontSize: 10, color: violations.length ? '#f87171' : 'var(--faint)' }}>
          {effMin !== null ? `${effMin.toFixed(1)}–${effMax!.toFixed(1)} kg` : '—'}
        </div>
        <div style={{ fontSize: 10, color, fontWeight: 600 }}>
          {GENDER_LABEL[pool.gender] ?? pool.gender}
        </div>
        {violations.length > 0 && <AlertTriangle size={13} color="#ef4444" />}
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <div style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
          {violations.map(v => (
            <div key={v} style={{ fontSize: 11, color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={10} /> {v}
            </div>
          ))}
        </div>
      )}

      {/* Athletes — triés par poids croissant */}
      <div style={{ flex: 1 }}>
        {[...athletes].sort((a, b) => Number(a.weight) - Number(b.weight)).map((a, i) => {
          const w = Number(a.weight);
          const outOfTol = isOutOfTolerance(w, weights, tolPct);
          return (
            <div key={a.athlete_id} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 10px 6px 8px',
              borderLeft: outOfTol ? '3px solid rgba(239,68,68,0.55)' : '3px solid transparent',
              borderBottom: i < athletes.length - 1 ? '1px solid var(--b1)' : 'none',
              background: 'transparent',
            }}>
              <div style={{
                width: 17, height: 17, borderRadius: 5, flexShrink: 0,
                background: 'var(--bg2)', border: '1px solid var(--b2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: 'var(--dim)',
              }}>{i + 1}</div>
              <GenderBadge gender={a.gender} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--fg)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{a.name}</div>
                <div style={{ fontSize: 10, color: 'var(--faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{a.club}</span>
                  <span>·</span>
                  <span style={{ color: outOfTol ? '#f97316' : 'var(--faint)', fontWeight: outOfTol ? 700 : 400 }}>
                    {w.toFixed(1)} kg
                  </span>
                  {outOfTol && <span style={{ color: '#f97316', fontSize: 9 }}>⚠</span>}
                </div>
              </div>
              {!compact && onRemoveAthlete && (
                <button
                  onClick={() => onRemoveAthlete(pool.id, a.athlete_id)}
                  title="Retirer de la poule"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 3,
                    color: 'var(--faint)', display: 'flex', borderRadius: 4, opacity: 0.5,
                  }}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Match progress */}
      {Number(pool.match_count) > 0 && (
        <div style={{
          padding: '6px 12px', background: 'var(--bg2)', borderTop: '1px solid var(--b2)',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--faint)',
        }}>
          <Play size={9} />
          {pool.matches_done}/{pool.match_count} combats
          {Number(pool.matches_done) === Number(pool.match_count) && Number(pool.match_count) > 0 && (
            <span style={{ color: '#22c55e', fontWeight: 700 }}>· Terminé ✓</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Jeunes() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const [tab, setTab] = useState<'pools' | 'mats' | 'rankings'>('pools');
  const [ageFilter, setAgeFilter] = useState<string>('Tout');
  const [showGenModal, setShowGenModal] = useState(false);
  const [genOpts, setGenOpts] = useState({ reset: false, U9: true, U11: true });
  const [createPoolModal, setCreatePoolModal] = useState<{ age_category: string } | null>(null);
  const [selectedRankingPoolId, setSelectedRankingPoolId] = useState<string | null>(null);
  const [emptyPoolConfirm, setEmptyPoolConfirm] = useState<{ poolId: string; poolName: string } | null>(null);

  // ── Data ─────────────────────────────────────────────────────────────────

  const ageCatParam = ageFilter !== 'Tout' ? ageFilter : undefined;

  const { data: tournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.get(`/api/tournaments/${id}`).then(r => r.data),
  });
  const weightTolerance = Number(tournament?.jeunes_weight_tolerance ?? 10);

  const { data: jeunesData, isLoading } = useQuery({
    queryKey: ['jeunes', id, ageCatParam],
    queryFn: () => api.get(`/api/tournaments/${id}/jeunes${ageCatParam ? `?age_category=${ageCatParam}` : ''}`).then(r => r.data),
    refetchInterval: 15000,
  });

  const { data: mats = [] } = useQuery({
    queryKey: ['mats', id],
    queryFn: () => api.get(`/api/tournaments/${id}/mats`).then(r => r.data),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['tournament-users', id],
    queryFn: () => api.get(`/api/tournaments/${id}/users`).then(r => r.data),
  });

  const { data: rankings = [], isLoading: rankLoading, isError: rankError } = useQuery({
    queryKey: ['jeunes-rankings', id, ageCatParam],
    queryFn: () => api.get(`/api/tournaments/${id}/jeunes/rankings${ageCatParam ? `?age_category=${ageCatParam}` : ''}`).then(r => r.data),
    enabled: tab === 'rankings',
    refetchInterval: 10000,
    retry: 1,
  });

  // Auto-select first pool when rankings load
  useEffect(() => {
    if (rankings.length > 0 && !selectedRankingPoolId) {
      setSelectedRankingPoolId((rankings as any[])[0].jeunes_pool_id);
    }
  }, [rankings]);

  // Reset pool selection when age filter changes
  useEffect(() => {
    setSelectedRankingPoolId(null);
  }, [ageCatParam]);

  const pools: JeunesPool[] = jeunesData?.pools ?? [];
  const unassigned: Unassigned[] = jeunesData?.unassigned ?? [];

  // ── Mutations ────────────────────────────────────────────────────────────

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['jeunes', id] });
    qc.invalidateQueries({ queryKey: ['jeunes-rankings', id] });
  };

  const generateMut = useMutation({
    mutationFn: () => api.post(`/api/tournaments/${id}/jeunes/generate`, {
      reset: genOpts.reset,
      age_categories: [...(genOpts.U9 ? ['U9'] : []), ...(genOpts.U11 ? ['U11'] : [])],
    }),
    onSuccess: (r) => {
      toast.success(`${r.data.pools_created} poule(s) créée(s)`);
      setShowGenModal(false);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error;
      if (err?.response?.status === 409 && msg) {
        toast.error(msg, { duration: 6000 });
      } else {
        toast.error('Erreur lors de la génération');
      }
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/api/tournaments/${id}/jeunes`),
    onSuccess: () => { toast.success('Poules supprimées'); invalidate(); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const removeAthleteMut = useMutation({
    mutationFn: ({ poolId, athleteId }: { poolId: string; athleteId: string }) =>
      api.delete(`/api/tournaments/${id}/jeunes/pools/${poolId}/athletes/${athleteId}`).then(r => r.data),
    onSuccess: (data, { poolId }) => {
      toast.success('Athlète retiré de la poule');
      invalidate();
      if (data.athletes_remaining === 0) {
        const poolName = pools.find(p => p.id === poolId)?.pool_name ?? 'cette poule';
        setEmptyPoolConfirm({ poolId, poolName });
      }
    },
    onError: () => toast.error('Erreur'),
  });

  const deletePoolMut = useMutation({
    mutationFn: (poolId: string) =>
      api.delete(`/api/tournaments/${id}/jeunes/pools/${poolId}`),
    onSuccess: () => { toast.success('Poule supprimée'); setEmptyPoolConfirm(null); invalidate(); },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Erreur suppression poule'),
  });

  const assignMut = useMutation({
    mutationFn: ({ poolId, mat_id, referee_id }: { poolId: string; mat_id?: string | null; referee_id?: string | null }) =>
      api.put(`/api/tournaments/${id}/jeunes/pools/${poolId}`, { mat_id, referee_id }),
    onSuccess: () => invalidate(),
    onError: () => toast.error('Erreur d\'assignation'),
  });

  const genMatchesMut = useMutation({
    mutationFn: (poolId: string) =>
      api.post(`/api/tournaments/${id}/jeunes/pools/${poolId}/generate-matches`),
    onSuccess: (r) => { toast.success(`${r.data.matches_created} combat(s) générés`); invalidate(); },
    onError: () => toast.error('Erreur génération combats'),
  });

  const cancelMatchesMut = useMutation({
    mutationFn: (poolId: string) =>
      api.delete(`/api/tournaments/${id}/jeunes/pools/${poolId}/matches`),
    onSuccess: () => { toast.success('Combats annulés'); invalidate(); },
    onError: () => toast.error('Erreur lors de l\'annulation'),
  });

  const genAllMatchesMut = useMutation({
    mutationFn: (ageCat: string) =>
      api.post(`/api/tournaments/${id}/jeunes/${ageCat}/generate-matches`),
    onSuccess: (r) => {
      const skipped = r.data.pools_skipped ?? 0;
      const msg = skipped > 0
        ? `${r.data.matches_created} combat(s) générés (${r.data.pools_processed} poules — ${skipped} déjà générées ignorées)`
        : `${r.data.matches_created} combat(s) générés (${r.data.pools_processed} poules)`;
      toast.success(msg);
      invalidate();
    },
    onError: () => toast.error('Erreur génération combats'),
  });

  const assignUnassignedMut = useMutation({
    mutationFn: ({ athleteId, jeunes_pool_id }: { athleteId: string; jeunes_pool_id: string }) =>
      api.post(`/api/tournaments/${id}/jeunes/unassigned/${athleteId}/assign`, { jeunes_pool_id }),
    onSuccess: () => { toast.success('Athlète assigné à la poule'); invalidate(); },
    onError: () => toast.error('Erreur lors de l\'assignation'),
  });

  const createPoolMut = useMutation({
    mutationFn: ({ age_category, athlete_ids }: { age_category: string; athlete_ids: string[] }) =>
      api.post(`/api/tournaments/${id}/jeunes/pools`, { age_category, athlete_ids }),
    onSuccess: () => { toast.success('Poule créée'); setCreatePoolModal(null); invalidate(); },
    onError: () => toast.error('Erreur lors de la création'),
  });

  // ── UI Helpers ───────────────────────────────────────────────────────────

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
  };

  // Group pools by age category
  const poolsByAge: Record<string, JeunesPool[]> = {};
  for (const p of pools) {
    if (!poolsByAge[p.age_category]) poolsByAge[p.age_category] = [];
    poolsByAge[p.age_category].push(p);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Jeunes — U9 / U11"
        subtitle="Gestion des poules, tapis, arbitres et classements"
        actions={
          <>
            {/* Age filter */}
            <div style={{ display: 'flex', gap: 4 }}>
              {AGE_TABS.map(at => (
                <button key={at} onClick={() => setAgeFilter(at)} style={{
                  ...btnBase,
                  padding: '5px 11px',
                  background: ageFilter === at ? 'rgba(220,38,38,0.15)' : 'var(--inp)',
                  color: ageFilter === at ? '#f87171' : 'var(--fg3)',
                  border: ageFilter === at ? '1px solid rgba(220,38,38,0.4)' : '1px solid var(--b3)',
                }}>
                  {at}
                </button>
              ))}
            </div>

            {/* Generate */}
            <button onClick={() => setShowGenModal(true)} style={{
              ...btnBase, background: '#ef4444', color: '#fff',
            }}>
              <Baby size={13} /> Générer les poules
            </button>

            {/* Delete */}
            {pools.length > 0 && (
              <button onClick={() => {
                if (confirm('Supprimer toutes les poules jeunes ?')) deleteMut.mutate();
              }} style={{ ...btnBase, background: 'var(--inp)', color: 'var(--fg3)', border: '1px solid var(--b3)' }}>
                <Trash2 size={12} /> Réinitialiser
              </button>
            )}
          </>
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--b2)', padding: '0 16px' }}>
        {([
          { key: 'pools',    label: 'Poules',           icon: Baby    },
          { key: 'mats',     label: 'Tapis & Arbitres', icon: Monitor },
          { key: 'rankings', label: 'Classements',      icon: Award   },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === key ? 700 : 500,
              color: tab === key ? '#ef4444' : 'var(--fg3)',
              borderBottom: tab === key ? '2px solid #ef4444' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s',
            }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16, maxWidth: 1400 }}>

        {/* ── Loading ── */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--faint)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* ══════════════════════════ TAB: POOLS ══════════════════════════ */}
        {tab === 'pools' && !isLoading && (
          <>
            {pools.length === 0 ? (
              <EmptyState
                onGenerate={() => setShowGenModal(true)}
                hasFilter={ageFilter !== 'Tout'}
              />
            ) : (
              <>
                {Object.entries(poolsByAge).map(([ageCat, agePools]) => (
                  <div key={ageCat} style={{ marginBottom: 28 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                    }}>
                      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--fg)' }}>
                        Catégorie {ageCat}
                      </h2>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: 'var(--faint)',
                        background: 'var(--bg2)', borderRadius: 6, padding: '2px 8px',
                        border: '1px solid var(--b2)',
                      }}>
                        {agePools.length} poule{agePools.length > 1 ? 's' : ''}
                      </span>
                      {/* Bouton créer une poule manuelle */}
                      {unassigned.filter(u => u.age_category === ageCat).length > 0 && (
                        <button
                          onClick={() => setCreatePoolModal({ age_category: ageCat })}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '4px 10px', borderRadius: 7, border: '1px dashed rgba(59,130,246,0.5)',
                            background: 'rgba(59,130,246,0.07)', color: '#60a5fa',
                            fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          + Créer une poule
                        </button>
                      )}
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                      gap: 12,
                    }}>
                      {agePools.map(p => (
                        <PoolCard
                          key={p.id}
                          pool={p}
                          onRemoveAthlete={(poolId, athleteId) => removeAthleteMut.mutate({ poolId, athleteId })}
                          tolPct={weightTolerance}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Unassigned */}
                {unassigned.length > 0 && (
                  <UnassignedSection
                    athletes={unassigned}
                    pools={pools}
                    onAssign={(athleteId, jeunes_pool_id) => assignUnassignedMut.mutate({ athleteId, jeunes_pool_id })}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* ══════════════════════════ TAB: MATS ══════════════════════════ */}
        {tab === 'mats' && !isLoading && (
          <>
            {pools.length === 0 ? (
              <EmptyState onGenerate={() => setShowGenModal(true)} hasFilter={ageFilter !== 'Tout'} />
            ) : (
              Object.entries(poolsByAge).map(([ageCat, agePools]) => (
                <div key={ageCat} style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--fg)' }}>
                      Catégorie {ageCat}
                    </h2>
                    <button
                      onClick={() => genAllMatchesMut.mutate(ageCat)}
                      disabled={genAllMatchesMut.isPending}
                      style={{ ...btnBase, background: '#22c55e', color: '#fff', fontSize: 11 }}
                    >
                      <Play size={11} /> Générer tous les combats {ageCat}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {agePools.map(p => (
                      <MatRow
                        key={p.id}
                        pool={p}
                        mats={mats}
                        users={users}
                        onAssign={(mat_id, referee_id) => assignMut.mutate({ poolId: p.id, mat_id, referee_id })}
                        onGenerateMatches={() => genMatchesMut.mutate(p.id)}
                        onCancelMatches={() => cancelMatchesMut.mutate(p.id)}
                        generating={genMatchesMut.isPending}
                        canceling={cancelMatchesMut.isPending}
                        tolPct={weightTolerance}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ══════════════════════════ TAB: RANKINGS ══════════════════════════ */}
        {tab === 'rankings' && (
          <>
            {rankLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--faint)' }}>
                <RefreshCw size={22} color="var(--faint)" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : pools.length === 0 ? (
              /* Aucune poule générée du tout */
              <EmptyState onGenerate={() => setShowGenModal(true)} hasFilter={ageFilter !== 'Tout'} />
            ) : rankError ? (
              /* Les poules existent mais l'API a renvoyé une erreur */
              <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--card)', borderRadius: 16, border: '1px solid rgba(239,68,68,0.2)', marginTop: 8 }}>
                <Award size={32} color="var(--dim)" style={{ margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginBottom: 6 }}>Classement indisponible</div>
                <div style={{ fontSize: 13, color: 'var(--faint)' }}>Le serveur n'a pas pu calculer les classements. Réessayez dans quelques instants.</div>
              </div>
            ) : (rankings as any[]).length === 0 ? (
              /* Les poules existent mais aucun classement retourné (données vides) */
              <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--card)', borderRadius: 16, border: '1px solid var(--b2)', marginTop: 8 }}>
                <Award size={32} color="var(--dim)" style={{ margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginBottom: 6 }}>Aucun classement calculé</div>
                <div style={{ fontSize: 13, color: 'var(--faint)' }}>Les classements apparaîtront ici dès que des combats auront été générés et terminés.</div>
              </div>
            ) : (
              <>
                {/* Pool selector */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {(rankings as any[]).map((r: any) => {
                    const sel = selectedRankingPoolId === r.jeunes_pool_id;
                    const col = GENDER_COLOR[r.gender] ?? '#94a3b8';
                    return (
                      <button
                        key={r.jeunes_pool_id}
                        onClick={() => setSelectedRankingPoolId(r.jeunes_pool_id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                          background: sel ? `${col}25` : 'var(--bg2)',
                          outline: sel ? `2px solid ${col}` : '1px solid var(--b2)',
                          outlineOffset: 0,
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700, color: sel ? col : 'var(--fg)' }}>
                          {r.pool_name}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--faint)' }}>
                          {r.age_category} · {r.weight_range} kg
                        </span>
                        {r.mat_name && (
                          <span style={{
                            fontSize: 10, color: '#22c55e', fontWeight: 600,
                            background: 'rgba(34,197,94,0.1)', borderRadius: 4, padding: '1px 5px',
                          }}>
                            {r.mat_name}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected pool detail */}
                {(() => {
                  const sel = (rankings as any[]).find(r => r.jeunes_pool_id === selectedRankingPoolId);
                  if (!sel) return null;
                  return <PoolRankingCard ranking={sel} />;
                })()}
              </>
            )}
          </>
        )}
      </div>

      {/* Create pool modal */}
      {createPoolModal && (
        <CreatePoolModal
          ageCat={createPoolModal.age_category}
          unassigned={unassigned.filter(u => u.age_category === createPoolModal.age_category)}
          loading={createPoolMut.isPending}
          onConfirm={(athleteIds) => createPoolMut.mutate({ age_category: createPoolModal.age_category, athlete_ids: athleteIds })}
          onClose={() => setCreatePoolModal(null)}
          tolPct={weightTolerance}
        />
      )}

      {/* Empty pool confirmation */}
      {emptyPoolConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: 24, width: 380,
            border: '1px solid rgba(239,68,68,0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 size={17} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg)' }}>Poule vide</div>
                <div style={{ fontSize: 11, color: 'var(--faint)' }}>{emptyPoolConfirm.poolName}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg3)', marginBottom: 20, lineHeight: 1.6 }}>
              La poule <strong style={{ color: 'var(--fg)' }}>{emptyPoolConfirm.poolName}</strong> ne contient
              plus d'athlètes. Voulez-vous la supprimer ?
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEmptyPoolConfirm(null)}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--b3)',
                  background: 'var(--inp)', color: 'var(--fg3)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Garder
              </button>
              <button
                onClick={() => deletePoolMut.mutate(emptyPoolConfirm.poolId)}
                disabled={deletePoolMut.isPending}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6, opacity: deletePoolMut.isPending ? 0.7 : 1,
                }}
              >
                <Trash2 size={12} /> {deletePoolMut.isPending ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate modal */}
      {showGenModal && (
        <GenModal
          opts={genOpts}
          onChange={setGenOpts}
          onConfirm={() => generateMut.mutate()}
          onClose={() => setShowGenModal(false)}
          loading={generateMut.isPending}
        />
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </Layout>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function EmptyState({ onGenerate, hasFilter }: { onGenerate: () => void; hasFilter: boolean }) {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 20px',
      background: 'var(--card)', borderRadius: 16, border: '1px solid var(--b2)', marginTop: 8,
    }}>
      <Baby size={40} color="var(--faint)" style={{ margin: '0 auto 12px' }} />
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg)', marginBottom: 6 }}>
        {hasFilter ? 'Aucune poule dans cette catégorie' : 'Aucune poule générée'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--faint)', marginBottom: 20 }}>
        {hasFilter
          ? 'Changez le filtre de catégorie d\'âge ou générez les poules.'
          : 'Générez les poules après la pesée pour les catégories U9 et U11.'}
      </div>
      {!hasFilter && (
        <button
          onClick={onGenerate}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700,
          }}
        >
          <Baby size={14} /> Générer les poules
        </button>
      )}
    </div>
  );
}

function UnassignedSection({
  athletes, pools, onAssign,
}: {
  athletes: Unassigned[];
  pools: JeunesPool[];
  onAssign: (athleteId: string, jeunes_pool_id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [selectedPool, setSelectedPool] = useState<Record<string, string>>({});

  const byAge: Record<string, Unassigned[]> = {};
  for (const a of athletes) {
    if (!byAge[a.age_category]) byAge[a.age_category] = [];
    byAge[a.age_category].push(a);
  }

  return (
    <div style={{
      background: 'rgba(251,191,36,0.06)',
      border: '1px solid rgba(251,191,36,0.3)',
      borderRadius: 12, marginTop: 20,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
          textAlign: 'left',
        }}
      >
        <AlertTriangle size={14} color="#fbbf24" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', flex: 1 }}>
          {athletes.length} athlète{athletes.length > 1 ? 's' : ''} non assigné{athletes.length > 1 ? 's' : ''}
        </span>
        <ChevronDown size={14} color="var(--faint)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(byAge).map(([ageCat, aths]) => {
            const agePools = pools.filter(p => p.age_category === ageCat);
            return (
              <div key={ageCat}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dim)', marginBottom: 6, marginTop: 8,
                  textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ageCat}</div>
                {aths.map(a => {
                  const selKey = a.athlete_id;
                  const selPool = selectedPool[selKey] ?? '';
                  return (
                    <div key={a.athlete_id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                      padding: '7px 10px', borderRadius: 8, background: 'var(--bg2)', marginBottom: 4,
                      border: '1px solid var(--b2)',
                    }}>
                      <GenderBadge gender={a.gender} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--fg)', minWidth: 120 }}>{a.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--faint)' }}>{a.club}</span>
                      <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 600 }}>
                        {Number(a.weigh_in_weight).toFixed(1)} kg
                      </span>
                      <span style={{ fontSize: 10, color: '#fbbf24' }}>
                        {a.reason === 'manual_removal' ? 'Retiré' : 'Sans poule'}
                      </span>
                      {/* Sélecteur de poule + bouton assigner */}
                      {agePools.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          <select
                            value={selPool}
                            onChange={e => setSelectedPool(prev => ({ ...prev, [selKey]: e.target.value }))}
                            style={{
                              padding: '3px 6px', borderRadius: 5, fontSize: 11,
                              background: 'var(--inp)', border: '1px solid var(--b3)', color: 'var(--fg)',
                            }}
                          >
                            <option value="">— Poule —</option>
                            {agePools.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.pool_name} ({Number(p.weight_min).toFixed(1)}–{Number(p.weight_max).toFixed(1)} kg
                                {' · '}{GENDER_LABEL[p.gender] ?? p.gender})
                              </option>
                            ))}
                          </select>
                          <button
                            disabled={!selPool}
                            onClick={() => { if (selPool) { onAssign(a.athlete_id, selPool); setSelectedPool(prev => ({ ...prev, [selKey]: '' })); } }}
                            style={{
                              padding: '3px 9px', borderRadius: 5, border: 'none', cursor: selPool ? 'pointer' : 'not-allowed',
                              background: selPool ? '#3b82f6' : 'var(--bg2)',
                              color: selPool ? '#fff' : 'var(--faint)',
                              fontSize: 11, fontWeight: 600, opacity: selPool ? 1 : 0.6,
                            }}
                          >
                            Assigner
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MatRow({
  pool, mats, users, onAssign, onGenerateMatches, onCancelMatches, generating, canceling, tolPct = 10,
}: {
  pool: JeunesPool;
  mats: any[];
  users: any[];
  onAssign: (mat_id: string | null, referee_id: string | null) => void;
  onGenerateMatches: () => void;
  onCancelMatches: () => void;
  generating: boolean;
  canceling: boolean;
  tolPct?: number;
}) {
  const [showViolationConfirm, setShowViolationConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const violations = checkConstraints(pool.athletes ?? [], tolPct);
  const activeMats = mats.filter((m: any) => m.is_active !== false);
  const referees = users.filter((u: any) => ['referee', 'tournament_admin'].includes(u.role));
  const hasMatches = Number(pool.match_count) > 0;
  const hasFinished = Number(pool.matches_done) > 0;

  const handleGenerate = () => {
    if (violations.length > 0) {
      setShowViolationConfirm(true);
    } else {
      onGenerateMatches();
    }
  };

  const handleCancel = () => {
    if (hasFinished) {
      setShowCancelConfirm(true);
    } else {
      onCancelMatches();
    }
  };

  return (
    <>
      <div style={{
        background: 'var(--card)',
        border: violations.length ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--b2)',
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        {/* Pool info */}
        <div style={{ minWidth: 160, flex: '0 0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg)' }}>
            {pool.pool_name}
            <span style={{
              marginLeft: 6, fontSize: 10, color: GENDER_COLOR[pool.gender],
              background: `${GENDER_COLOR[pool.gender]}20`, borderRadius: 4, padding: '1px 5px',
            }}>
              {pool.age_category} · {GENDER_LABEL[pool.gender] ?? pool.gender}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>
            {Number(pool.weight_min).toFixed(1)}–{Number(pool.weight_max).toFixed(1)} kg · {pool.athletes?.length ?? 0} athlètes
          </div>
        </div>

        {/* Mat selector */}
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 10, color: 'var(--faint)', display: 'block', marginBottom: 3 }}>Tapis</label>
          <select
            value={pool.mat_id ?? ''}
            onChange={e => onAssign(e.target.value || null, pool.referee_id ?? null)}
            style={{
              width: '100%', padding: '5px 8px', borderRadius: 6, fontSize: 12,
              background: 'var(--inp)', border: '1px solid var(--b3)', color: 'var(--fg)',
            }}
          >
            <option value="">— Non assigné —</option>
            {activeMats.map((m: any) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Referee selector */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 10, color: 'var(--faint)', display: 'block', marginBottom: 3 }}>Arbitre</label>
          <select
            value={pool.referee_id ?? ''}
            onChange={e => onAssign(pool.mat_id ?? null, e.target.value || null)}
            style={{
              width: '100%', padding: '5px 8px', borderRadius: 6, fontSize: 12,
              background: 'var(--inp)', border: '1px solid var(--b3)', color: 'var(--fg)',
            }}
          >
            <option value="">— Non assigné —</option>
            {referees.map((u: any) => (
              <option key={u.user_id} value={u.user_id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Match info + action button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {hasMatches && (
            <span style={{ fontSize: 11, color: 'var(--faint)' }}>
              {pool.matches_done}/{pool.match_count} combats
              {Number(pool.matches_done) === Number(pool.match_count) && (
                <span style={{ color: '#22c55e', marginLeft: 4 }}>✓</span>
              )}
            </span>
          )}
          {hasMatches ? (
            /* Combats déjà générés → bouton Annuler */
            <button
              onClick={handleCancel}
              disabled={canceling}
              title="Supprimer les combats de cette poule"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: 'rgba(239,68,68,0.12)', color: '#f87171',
                border: '1px solid rgba(239,68,68,0.3)',
                fontSize: 11, fontWeight: 600, opacity: canceling ? 0.7 : 1,
              } as React.CSSProperties}
            >
              ✕ Annuler génération
            </button>
          ) : (
            /* Pas encore de combats → bouton Générer */
            <button
              onClick={handleGenerate}
              disabled={generating}
              title={violations.length > 0 ? 'Violations détectées — cliquer pour confirmer' : 'Générer les combats'}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: violations.length > 0 ? '#f59e0b' : '#3b82f6',
                color: '#fff',
                fontSize: 11, fontWeight: 600, opacity: generating ? 0.7 : 1,
              }}
            >
              {violations.length > 0 && <AlertTriangle size={10} />}
              <Play size={10} /> Générer combats
            </button>
          )}
        </div>
      </div>

      {/* Confirmation popup si violations */}
      {showViolationConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: 24, width: 400,
            border: '1px solid rgba(245,158,11,0.4)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={18} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg)' }}>Violations détectées</div>
                <div style={{ fontSize: 11, color: 'var(--faint)' }}>{pool.pool_name}</div>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              {violations.map(v => (
                <div key={v} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 0', fontSize: 12, color: '#f87171',
                  borderBottom: '1px solid var(--b1)',
                }}>
                  <AlertTriangle size={10} color="#ef4444" /> {v}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg3)', marginBottom: 20, lineHeight: 1.5 }}>
              Les combats peuvent quand même être générés. Voulez-vous continuer ?
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowViolationConfirm(false)}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--b3)',
                  background: 'var(--inp)', color: 'var(--fg3)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => { setShowViolationConfirm(false); onGenerateMatches(); }}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: '#f59e0b', color: '#fff', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Play size={12} /> Générer quand même
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function winTypeLabel(t: string) {
  const m: Record<string, string> = {
    fall: 'Tombé', superiority: 'Supériorité', points: 'Points',
    dq: 'Disqualif.', forfeit: 'Forfait', abandon: 'Abandon',
  };
  return m[t] || t || '—';
}

function MatchStatusChip({ m }: { m: any }) {
  if (m.status === 'finished') {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, color: '#22c55e',
        background: 'rgba(34,197,94,0.12)', borderRadius: 4, padding: '2px 6px',
      }}>Terminé</span>
    );
  }
  if (m.status === 'on_mat') {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, color: '#f59e0b',
        background: 'rgba(245,158,11,0.12)', borderRadius: 4, padding: '2px 6px',
        display: 'inline-flex', alignItems: 'center', gap: 3,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
        En cours
      </span>
    );
  }
  const matName = m.queue_mat_name;
  if (matName) {
    return (
      <span style={{
        fontSize: 10, fontWeight: 600, color: '#60a5fa',
        background: 'rgba(96,165,250,0.1)', borderRadius: 4, padding: '2px 6px',
      }}>
        {matName}
      </span>
    );
  }
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, color: 'var(--dim)',
      background: 'var(--bg2)', borderRadius: 4, padding: '2px 6px',
    }}>En attente</span>
  );
}

function PoolRankingCard({ ranking }: { ranking: any }) {
  const color = GENDER_COLOR[ranking.gender] ?? '#94a3b8';
  const matches: any[] = ranking.matches ?? [];
  const rankingRows: any[] = ranking.rankings ?? [];
  const athletes: any[] = ranking.athletes ?? [];

  // Build a complete ranking: athletes with stats from rankings, fill in zeros for those with no matches
  const statsMap = new Map(rankingRows.map((r: any) => [r.id, r]));
  const allAthletes = athletes.map((a: any) => {
    const s = statsMap.get(a.athlete_id);
    return {
      athlete_id: a.athlete_id,
      name: a.name,
      club: a.club,
      wins: s?.wins ?? 0,
      draws: s?.draws ?? 0,
      losses: s?.losses ?? 0,
      pts: s?.pts ?? 0,
      tech_pts: s?.tech_pts ?? 0,
      tech_pts_against: s?.tech_pts_against ?? 0,
      rank: s?.rank ?? null,
    };
  }).sort((a, b) => {
    if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
    if (a.rank !== null) return -1;
    if (b.rank !== null) return 1;
    return 0;
  });

  const finished = matches.filter(m => m.status === 'finished');
  const pending  = matches.filter(m => m.status !== 'finished');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>

      {/* ── Left: Classement ── */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{
          padding: '10px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--b2)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Award size={13} color={color} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)', flex: 1 }}>Classement</span>
          <span style={{ fontSize: 10, color, background: `${color}20`, borderRadius: 5, padding: '1px 6px', fontWeight: 700 }}>
            {ranking.age_category}
          </span>
          <span style={{ fontSize: 11, color: 'var(--faint)' }}>
            {ranking.weight_range} kg · {GENDER_LABEL[ranking.gender] ?? ranking.gender}
          </span>
          {ranking.mat_name && (
            <span style={{
              fontSize: 10, color: '#22c55e', fontWeight: 700,
              background: 'rgba(34,197,94,0.1)', borderRadius: 4, padding: '1px 6px',
            }}>{ranking.mat_name}</span>
          )}
        </div>

        {/* Légende barème */}
        <div style={{ padding: '5px 14px', background: 'rgba(251,191,36,0.06)', borderBottom: '1px solid var(--b1)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[['V', '2 pts', '#22c55e'], ['N', '1 pt', '#f59e0b'], ['D', '0 pt', '#ef4444']].map(([l, p, c]) => (
            <span key={l} style={{ fontSize: 10, color: 'var(--faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 800, color: c as string }}>{l}</span> = {p}
            </span>
          ))}
          <span style={{ fontSize: 10, color: 'var(--faint)', marginLeft: 'auto' }}>
            Dept. : goal average (pts marqués − pts encaissés)
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--bg2)' }}>
              {['#', 'Athlète', 'Club', 'Pts cl.', 'G.A.', 'V', 'N', 'D'].map(h => (
                <th key={h} style={{
                  padding: '6px 10px',
                  textAlign: h === 'Athlète' || h === 'Club' ? 'left' : 'center',
                  fontSize: 10, fontWeight: 700, color: 'var(--dim)',
                  borderBottom: '1px solid var(--b2)', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allAthletes.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 16, textAlign: 'center', color: 'var(--faint)', fontSize: 12 }}>
                Aucun athlète dans cette poule
              </td></tr>
            ) : allAthletes.map((r, i) => {
              const rankColor = i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c3d' : 'var(--fg3)';
              const hasPlayed = (r.wins + (r.draws ?? 0) + r.losses) > 0;
              const goalAvg = (r.tech_pts ?? 0) - (r.tech_pts_against ?? 0);
              return (
                <tr key={r.athlete_id} style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.03)',
                  borderBottom: '1px solid var(--b1)',
                  opacity: hasPlayed ? 1 : 0.55,
                }}>
                  <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 800, color: rankColor, fontSize: 13 }}>
                    {hasPlayed ? i + 1 : '—'}
                  </td>
                  <td style={{ padding: '7px 10px', fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap' }}>{r.name}</td>
                  <td style={{ padding: '7px 10px', color: 'var(--faint)', whiteSpace: 'nowrap' }}>{r.club ?? '—'}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 800, color: hasPlayed ? 'var(--fg)' : 'var(--dim)', fontSize: 13 }}>{r.pts}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 600, color: goalAvg > 0 ? '#22c55e' : goalAvg < 0 ? '#ef4444' : 'var(--fg3)' }}>
                    {hasPlayed ? (goalAvg > 0 ? `+${goalAvg}` : `${goalAvg}`) : '—'}
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>{r.wins}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>{r.draws ?? 0}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center', color: '#ef4444', fontWeight: 700 }}>{r.losses}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Right: Combats ── */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{
          padding: '10px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--b2)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Swords size={13} color="var(--fg3)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)', flex: 1 }}>Combats</span>
          <span style={{ fontSize: 11, color: 'var(--faint)' }}>
            {finished.length}/{matches.length} terminé{finished.length > 1 ? 's' : ''}
          </span>
        </div>

        {matches.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--faint)', fontSize: 12 }}>
            Aucun combat généré — utilisez l'onglet Tapis & Arbitres
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Pending first */}
            {pending.length > 0 && (
              <div>
                <div style={{ padding: '6px 12px', fontSize: 10, fontWeight: 700, color: 'var(--dim)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--bg2)',
                  borderBottom: '1px solid var(--b1)',
                }}>En attente ({pending.length})</div>
                {pending.map((m: any) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                    borderBottom: '1px solid var(--b1)',
                    background: m.status === 'on_mat' ? 'rgba(245,158,11,0.05)' : 'transparent',
                  }}>
                    <span style={{ fontSize: 10, color: 'var(--dim)', minWidth: 20 }}>R{m.round}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--fg)', display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600 }}>{m.red_name ?? '—'}</span>
                        <span style={{ color: 'var(--faint)', fontSize: 10 }}>vs</span>
                        <span style={{ fontWeight: 600 }}>{m.blue_name ?? '—'}</span>
                      </div>
                    </div>
                    <MatchStatusChip m={m} />
                  </div>
                ))}
              </div>
            )}

            {/* Finished */}
            {finished.length > 0 && (
              <div>
                <div style={{ padding: '6px 12px', fontSize: 10, fontWeight: 700, color: 'var(--dim)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--bg2)',
                  borderBottom: '1px solid var(--b1)',
                }}>Terminés ({finished.length})</div>
                {finished.map((m: any) => {
                  const redWon = m.winner_id === m.red_athlete_id;
                  const blueWon = m.winner_id === m.blue_athlete_id;
                  return (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                      borderBottom: '1px solid var(--b1)',
                    }}>
                      <span style={{ fontSize: 10, color: 'var(--dim)', minWidth: 20 }}>R{m.round}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: redWon ? 800 : 500, color: redWon ? 'var(--fg)' : 'var(--faint)' }}>
                            {m.red_name ?? '—'}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'monospace', fontWeight: 700 }}>
                            {m.score_red ?? 0}–{m.score_blue ?? 0}
                          </span>
                          <span style={{ fontWeight: blueWon ? 800 : 500, color: blueWon ? 'var(--fg)' : 'var(--faint)' }}>
                            {m.blue_name ?? '—'}
                          </span>
                        </div>
                        {m.win_type && (
                          <div style={{ fontSize: 10, color: 'var(--faint)', marginTop: 1 }}>
                            {winTypeLabel(m.win_type)}
                          </div>
                        )}
                      </div>
                      <MatchStatusChip m={m} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CreatePoolModal({
  ageCat, unassigned, loading, onConfirm, onClose, tolPct = 10,
}: {
  ageCat: string;
  unassigned: Unassigned[];
  loading: boolean;
  onConfirm: (athleteIds: string[]) => void;
  onClose: () => void;
  tolPct?: number;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // Tri par poids
  const sorted = [...unassigned].sort((a, b) => Number(a.weigh_in_weight) - Number(b.weigh_in_weight));

  // Vérification des contraintes de la sélection
  const selAthletes = sorted.filter(a => selected.has(a.athlete_id));
  const selWeights = selAthletes.map(a => Number(a.weigh_in_weight)).filter(Boolean);
  const spread = selWeights.length > 1 ? Math.max(...selWeights) / Math.min(...selWeights) : 1;
  const spreadPct = ((spread - 1) * 100).toFixed(1);
  const tol = 1 + tolPct / 100;
  const overTol = spread > tol;
  const overSize = selected.size > 4;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--card)', borderRadius: 16, padding: 24, width: 420, maxHeight: '80vh',
        border: '1px solid var(--b2)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg)', marginBottom: 4 }}>
          Créer une poule — {ageCat}
        </div>
        <div style={{ fontSize: 12, color: 'var(--faint)', marginBottom: 16 }}>
          Sélectionnez les athlètes à inclure dans cette poule.
        </div>

        {/* Contraintes live */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 6,
            background: overSize ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.1)',
            color: overSize ? '#f87171' : '#22c55e', fontWeight: 600,
          }}>
            {selected.size}/4 athlètes{overSize ? ' ⚠ max 4' : ''}
          </span>
          {selWeights.length > 1 && (
            <span style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 6,
              background: overTol ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.1)',
              color: overTol ? '#f87171' : '#22c55e', fontWeight: 600,
            }}>
              Écart {spreadPct} %{overTol ? ` ⚠ > ${tolPct} %` : ' ✓'}
            </span>
          )}
        </div>

        {/* Liste des athlètes non-assignés */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
          {sorted.map(a => {
            const w = Number(a.weigh_in_weight);
            const isSelected = selected.has(a.athlete_id);
            // Est-ce que cet athlète est hors tolérance avec la sélection actuelle ?
            let outOfTolWithSel = false;
            if (isSelected && selWeights.length > 1) {
              outOfTolWithSel = isOutOfTolerance(w, selWeights, tolPct);
            } else if (!isSelected && selWeights.length > 0) {
              const testWs = [...selWeights, w];
              outOfTolWithSel = Math.max(...testWs) > Math.min(...testWs) * tol;
            }

            return (
              <label key={a.athlete_id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${isSelected ? 'rgba(59,130,246,0.4)' : 'var(--b2)'}`,
                background: isSelected ? 'rgba(59,130,246,0.08)' : 'var(--bg2)',
                transition: 'all 0.12s',
              }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(a.athlete_id)}
                  style={{ width: 14, height: 14, accentColor: '#3b82f6', flexShrink: 0 }}
                />
                <GenderBadge gender={a.gender} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>{a.name}</span>
                <span style={{ fontSize: 11, color: 'var(--faint)' }}>{a.club}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: isSelected && outOfTolWithSel ? '#f97316' : 'var(--faint)',
                }}>
                  {w.toFixed(1)} kg
                  {isSelected && outOfTolWithSel && ' ⚠'}
                </span>
              </label>
            );
          })}
          {sorted.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--faint)', fontSize: 12 }}>
              Aucun athlète non-assigné en {ageCat}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--b1)', paddingTop: 14 }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--b3)',
            background: 'var(--inp)', color: 'var(--fg3)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>Annuler</button>
          <button
            disabled={loading || selected.size < 1}
            onClick={() => onConfirm([...selected])}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: selected.size < 1 ? 'not-allowed' : 'pointer',
              background: selected.size < 1 ? 'var(--bg2)' : '#3b82f6',
              color: selected.size < 1 ? 'var(--faint)' : '#fff',
              fontSize: 12, fontWeight: 700, opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {loading && <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />}
            {loading ? 'Création…' : `Créer la poule (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}

function GenModal({
  opts, onChange, onConfirm, onClose, loading,
}: {
  opts: { reset: boolean; U9: boolean; U11: boolean };
  onChange: (o: { reset: boolean; U9: boolean; U11: boolean }) => void;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--card)', borderRadius: 16, padding: 24, width: 360,
        border: '1px solid var(--b2)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg)', marginBottom: 4 }}>
          Générer les poules jeunes
        </div>
        <div style={{ fontSize: 12, color: 'var(--faint)', marginBottom: 20 }}>
          Algorithme : poules mixtes, max 4 athlètes, écart poids ≤ 10 %
        </div>

        {/* Age categories */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Catégories
          </div>
          {(['U9', 'U11'] as const).map(cat => (
            <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={opts[cat]}
                onChange={e => onChange({ ...opts, [cat]: e.target.checked })}
                style={{ width: 15, height: 15, accentColor: '#ef4444' }}
              />
              <span style={{ fontSize: 13, color: 'var(--fg)' }}>{cat}</span>
            </label>
          ))}
        </div>

        {/* Reset option */}
        <div style={{
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 8, padding: '10px 12px', marginBottom: 20,
        }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={opts.reset}
              onChange={e => onChange({ ...opts, reset: e.target.checked })}
              style={{ width: 15, height: 15, accentColor: '#ef4444', marginTop: 1 }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>Supprimer et régénérer</div>
              <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>
                Efface toutes les poules existantes avant de générer.
              </div>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--b3)',
              background: 'var(--inp)', color: 'var(--fg3)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || (!opts.U9 && !opts.U11)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: loading ? 'var(--bg2)' : '#ef4444',
              color: '#fff', fontSize: 12, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
              opacity: !opts.U9 && !opts.U11 ? 0.5 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {loading ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Baby size={12} />}
            {loading ? 'Génération…' : 'Générer'}
          </button>
        </div>
      </div>
    </div>
  );
}
