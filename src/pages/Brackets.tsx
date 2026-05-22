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

function MatchCard({ match }: { match: any }) {
  const s = STATUS_STYLE[match.status] || STATUS_STYLE.waiting;
  const isFinished = match.status === 'finished';
  const winnerIsRed = match.winner_color === 'red';

  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '10px 12px', minWidth: 170, fontSize: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isFinished && winnerIsRed ? '#fff' : '#f87171', fontWeight: isFinished && winnerIsRed ? 700 : 400 }}>
          {match.red_name || (match.is_bye ? 'BYE' : '?')}
        </span>
        {isFinished && <span style={{ fontFamily: 'monospace', color: '#fff', fontWeight: 700, flexShrink: 0 }}>{match.score_red ?? ''}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isFinished && !winnerIsRed ? '#fff' : '#60a5fa', fontWeight: isFinished && !winnerIsRed ? 700 : 400 }}>
          {match.blue_name || (match.is_bye ? 'BYE' : '?')}
        </span>
        {isFinished && <span style={{ fontFamily: 'monospace', color: '#fff', fontWeight: 700, flexShrink: 0 }}>{match.score_blue ?? ''}</span>}
      </div>
      {match.status === 'on_mat' && (
        <div style={{ marginTop: 6, fontSize: 10, color: '#fbbf24', fontWeight: 600 }}>● En cours</div>
      )}
      {isFinished && match.win_type && (
        <div style={{ marginTop: 4, fontSize: 10, color: '#4b5563', textTransform: 'capitalize' }}>{match.win_type}</div>
      )}
      {match.match_id && (
        <Link
          to={`/ref/${match.match_id}`}
          target="_blank"
          style={{ display: 'block', marginTop: 8, textAlign: 'center', fontSize: 10, background: 'rgba(220,38,38,0.15)', color: '#f87171', borderRadius: 6, padding: '3px 6px', textDecoration: 'none', fontWeight: 600 }}
        >
          Arbitrer →
        </Link>
      )}
    </div>
  );
}

function RoundColumn({ matches, label }: { matches: any[]; label: string }) {
  if (matches.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 185 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 4 }}>{label}</div>
      {matches.map((m: any) => <MatchCard key={m.id} match={m} />)}
    </div>
  );
}

function NordicView({ matches, pools }: { matches: any[]; pools: any[] }) {
  if (pools.length === 0) return <div style={{ color: '#4b5563', fontSize: 13 }}>Aucune poule générée</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {pools.map((pool: any) => {
        const poolMatches = matches.filter((m: any) => m.pool_id === pool.id);
        return (
          <div key={pool.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>{pool.name}</div>
            <div style={{ padding: '8px 0' }}>
              {poolMatches.map((m: any, i: number) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#f87171' }}>{m.red_name || '?'}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, color: m.status === 'finished' ? '#fff' : '#374151', fontSize: 14 }}>
                    {m.status === 'finished' ? `${m.score_red} – ${m.score_blue}` : 'vs'}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#60a5fa', textAlign: 'right' }}>{m.blue_name || '?'}</span>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                  {m.match_id && (
                    <Link to={`/ref/${m.match_id}`} target="_blank" style={{ color: '#4b5563', display: 'flex', textDecoration: 'none' }}>
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              ))}
              {poolMatches.length === 0 && (
                <div style={{ padding: '12px 16px', fontSize: 12, color: '#374151' }}>Tableau non généré</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BracketView({ matches }: { matches: any[] }) {
  const mainMatches = matches.filter((m: any) => m.bracket === 'main' || !m.bracket);
  const repMatches  = matches.filter((m: any) => m.bracket === 'repechage');

  const toRounds = (arr: any[]) => arr.reduce((acc: any, m: any) => {
    const r = m.round ?? 0;
    if (!acc[r]) acc[r] = [];
    acc[r].push(m);
    return acc;
  }, {});

  const mainRounds = Object.entries(toRounds(mainMatches)).sort(([a], [b]) => Number(a) - Number(b));
  const repRounds  = Object.entries(toRounds(repMatches)).sort(([a], [b]) => Number(a) - Number(b));
  const total = mainRounds.length;

  const roundLabel = (idx: number) => {
    const fromEnd = total - 1 - idx;
    if (fromEnd === 0) return 'Finale';
    if (fromEnd === 1) return 'Demi-finales';
    if (fromEnd === 2) return 'Quarts';
    return `Tour ${idx + 1}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Trophy size={14} color="#fbbf24" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#d1d5db' }}>Tableau principal</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 16, minWidth: 'max-content', paddingBottom: 8 }}>
            {mainRounds.map(([round, rMatches]: [string, any], idx) => (
              <RoundColumn key={round} matches={rMatches} label={roundLabel(idx)} />
            ))}
            {mainRounds.length === 0 && <div style={{ color: '#4b5563', fontSize: 13 }}>Tableau non encore généré</div>}
          </div>
        </div>
      </div>
      {repMatches.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Medal size={14} color="#f97316" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#d1d5db' }}>Repêchage (2× Bronze)</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 16, minWidth: 'max-content', paddingBottom: 8, opacity: 0.85 }}>
              {repRounds.map(([round, rMatches]: [string, any], idx) => (
                <RoundColumn key={round} matches={rMatches} label={`Repêchage T${idx + 1}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PoolsFinalsView({ matches, pools }: { matches: any[]; pools: any[] }) {
  const poolMatches  = matches.filter((m: any) => m.match_type === 'pool' || m.pool_id);
  const finalMatches = matches.filter((m: any) => ['semifinal', 'final', 'bronze'].includes(m.match_type));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <NordicView matches={poolMatches} pools={pools} />
      {finalMatches.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#d1d5db', marginBottom: 14 }}>Phase finale</div>
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
  );
}

const RANK_STYLE = (i: number) => i === 0
  ? { bg: '#ca8a04', color: '#000' }
  : i === 1
  ? { bg: '#9ca3af', color: '#000' }
  : i === 2
  ? { bg: '#c2410c', color: '#fff' }
  : { bg: 'rgba(255,255,255,0.06)', color: '#6b7280' };

export default function Brackets() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [selectedComp, setSelectedComp] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<'single' | 'bulk' | null>(null);

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
    mutationFn: (cid: string) => api.delete(`/api/competitions/${cid}/bracket`),
    onSuccess: () => {
      setDeleteModal(null);
      qc.invalidateQueries({ queryKey: ['bracket', compId] });
      toast.success('Tableau supprimé');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Erreur lors de la suppression';
      toast.error(msg, { duration: 6000 });
    },
  });

  const deleteBulk = useMutation({
    mutationFn: (ageCategory: string) =>
      api.delete(`/api/tournaments/${id}/brackets`, { params: { age_category: ageCategory } }),
    onSuccess: (r) => {
      setDeleteModal(null);
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
      deleteSingle.mutate(comp.id);
    } else if (deleteModal === 'bulk') {
      deleteBulk.mutate(comp.age_category);
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Zap size={28} color="#374151" strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Aucune compétition</div>
            <div style={{ fontSize: 13, color: '#4b5563' }}>Générez les compétitions depuis l'onglet Compétitions</div>
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
                    style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: isActive ? '#dc2626' : 'rgba(255,255,255,0.06)', color: isActive ? '#fff' : '#6b7280', transition: 'all 0.15s' }}
                  >
                    {c.age_category} · {c.weight_category}kg {c.gender === 'M' ? '♂' : '♀'}
                  </button>
                );
              })}
            </div>

            {comp && (
              <>
                {/* Competition info bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#4b5563', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                  <span style={{ color: '#9ca3af', fontWeight: 500 }}>{FORMAT_LABEL[comp.format_type] || comp.format_type}</span>
                  <span>·</span>
                  <span>{comp.athlete_count ?? 0} athlètes</span>
                  <span>·</span>
                  <span style={{ textTransform: 'capitalize' }}>{STYLE_LABELS[comp.style] ?? comp.style}</span>
                </div>

                {isLoading ? (
                  <div style={{ color: '#4b5563', fontSize: 13, padding: '20px 0' }}>Chargement…</div>
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
                      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <Trophy size={14} color="#fbbf24" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Classement</span>
                        </div>
                        <div style={{ padding: '8px 0' }}>
                          {rankings.map((r: any, i: number) => {
                            const rs = RANK_STYLE(i);
                            return (
                              <div key={r.athlete_id || i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                <div style={{ width: 26, height: 26, borderRadius: 8, background: rs.bg, color: rs.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                                  {r.rank ?? i + 1}
                                </div>
                                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#fff' }}>{r.athlete_name || r.name}</span>
                                <span style={{ fontSize: 11, color: '#4b5563' }}>{r.club_name || r.club}</span>
                                {r.points !== undefined && (
                                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6b7280' }}>{r.points} pts</span>
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteModal(null); }}
        >
          <div style={{ background: '#141414', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 16, padding: 28, maxWidth: 460, width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.6)' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={18} color="#f87171" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Supprimer le tableau</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Cette action est irréversible</div>
              </div>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
              {/* Option 1 : ce tableau uniquement */}
              <button
                onClick={() => setDeleteModal('single')}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: deleteModal === 'single' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)', border: deleteModal === 'single' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${deleteModal === 'single' ? '#f87171' : '#374151'}`, background: deleteModal === 'single' ? '#f87171' : 'transparent', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: deleteModal === 'single' ? '#fff' : '#9ca3af' }}>
                    Ce tableau uniquement
                  </div>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 3 }}>
                    {comp.weight_category}kg {comp.gender === 'M' ? '♂' : '♀'} · {comp.age_category} · {STYLE_LABELS[comp.style] ?? comp.style}
                  </div>
                </div>
              </button>

              {/* Option 2 : tous les tableaux de la catégorie d'âge */}
              {sameAgeComps.length > 1 && (
                <button
                  onClick={() => setDeleteModal('bulk')}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: deleteModal === 'bulk' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)', border: deleteModal === 'bulk' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${deleteModal === 'bulk' ? '#f87171' : '#374151'}`, background: deleteModal === 'bulk' ? '#f87171' : 'transparent', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: deleteModal === 'bulk' ? '#fff' : '#9ca3af' }}>
                      Tous les tableaux {comp.age_category}
                    </div>
                    <div style={{ fontSize: 11, color: '#4b5563', marginTop: 3 }}>
                      {sameAgeComps.length} compétition{sameAgeComps.length !== 1 ? 's' : ''} — toutes catégories de poids
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteModal(null)}
                disabled={isPendingDelete}
                style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#9ca3af', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isPendingDelete}
                style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: isPendingDelete ? 'not-allowed' : 'pointer', opacity: isPendingDelete ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {isPendingDelete ? (
                  <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Suppression…</>
                ) : (
                  <><Trash2 size={13} /> Confirmer la suppression</>
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
