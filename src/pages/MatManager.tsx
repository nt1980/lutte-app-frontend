import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Activity, Tv, AlertCircle, Clock } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function MatManager() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: mats = [] } = useQuery({
    queryKey: ['mats', id],
    queryFn: () => api.get(`/api/tournaments/${id}/mats`).then(r => r.data),
  });

  const { data: queue = [] } = useQuery({
    queryKey: ['queue', id],
    queryFn: () => api.get(`/api/tournaments/${id}/queue`).then(r => r.data),
    refetchInterval: 5000,
  });

  const assign = useMutation({
    mutationFn: ({ queueId, matId }: any) => api.put(`/api/queue/${queueId}/assign-mat`, { mat_id: matId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queue', id] }); toast.success('Combat affecté'); },
    onError: () => toast.error('Erreur'),
  });

  const byMat = mats.reduce((acc: any, mat: any) => {
    acc[mat.id] = { mat, matches: queue.filter((q: any) => q.mat_id === mat.id) };
    return acc;
  }, {});

  const unassigned = queue.filter((q: any) => !q.mat_id && q.status === 'ready');
  const activeCount = queue.filter((q: any) => q.status === 'on_mat').length;

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Gestion des tapis"
        subtitle={`${mats.length} tapis · ${activeCount} combat${activeCount !== 1 ? 's' : ''} en cours`}
      />

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {queue.length === 0 && mats.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Activity size={28} color="#374151" strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Aucun tapis configuré</div>
            <div style={{ fontSize: 13, color: '#4b5563' }}>Configurez les tapis dans les paramètres du tournoi</div>
          </div>
        ) : (
          <>
            {/* Mat cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {Object.values(byMat).map(({ mat, matches }: any) => {
                const current = matches.find((m: any) => m.status === 'on_mat');
                const next = matches.filter((m: any) => m.status === 'ready');
                const hasActivity = !!current;

                return (
                  <div
                    key={mat.id}
                    style={{ background: '#111', border: `1px solid ${hasActivity ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, overflow: 'hidden' }}
                  >
                    {/* Mat header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: hasActivity ? 'rgba(251,191,36,0.05)' : 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: hasActivity ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${hasActivity ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Activity size={14} color={hasActivity ? '#fbbf24' : '#4b5563'} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{mat.name}</div>
                          {hasActivity && <div style={{ fontSize: 10, fontWeight: 600, color: '#fbbf24', marginTop: 1 }}>EN COURS</div>}
                          {!hasActivity && <div style={{ fontSize: 10, color: '#374151', marginTop: 1 }}>Libre</div>}
                        </div>
                      </div>
                      <Link
                        to={`/mat/${mat.id}`}
                        target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#60a5fa', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 7, padding: '4px 10px', textDecoration: 'none' }}
                      >
                        <Tv size={11} /> Live
                      </Link>
                    </div>

                    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Current match */}
                      {current ? (
                        <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 10, padding: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Combat en cours</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#f87171' }}>{current.red_name || '?'}</span>
                            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 700 }}>vs</span>
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#60a5fa', textAlign: 'right' }}>{current.blue_name || '?'}</span>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                          </div>
                          <div style={{ fontSize: 10, color: '#4b5563', marginBottom: current.match_id ? 8 : 0 }}>
                            {current.age_category} · {current.weight_category}kg · {current.style}
                          </div>
                          {current.match_id && (
                            <Link
                              to={`/ref/${current.match_id}`}
                              target="_blank"
                              style={{ display: 'block', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#fff', background: '#dc2626', borderRadius: 7, padding: '6px 0', textDecoration: 'none' }}
                            >
                              Vue arbitre →
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', color: '#374151', fontSize: 12 }}>
                          Tapis libre
                        </div>
                      )}

                      {/* Queue */}
                      {next.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                            <Clock size={10} /> Prochains ({next.length})
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {next.slice(0, 3).map((q: any) => (
                              <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 7, padding: '6px 10px', fontSize: 11 }}>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                                <span style={{ color: '#f87171', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.red_name || '?'}</span>
                                <span style={{ color: '#374151' }}>vs</span>
                                <span style={{ color: '#60a5fa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{q.blue_name || '?'}</span>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                                <span style={{ color: '#374151', flexShrink: 0 }}>{q.age_category}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unassigned matches */}
            {unassigned.length > 0 && (
              <div style={{ background: '#111', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <AlertCircle size={14} color="#f87171" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Combats prêts — à affecter</span>
                  <span style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', borderRadius: 6, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{unassigned.length}</span>
                </div>
                <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                  {unassigned.map((q: any) => (
                    <div key={q.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.red_name || '?'}</span>
                        <span style={{ fontSize: 10, color: '#374151', fontWeight: 700 }}>vs</span>
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#60a5fa', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.blue_name || '?'}</span>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                      </div>
                      <div style={{ fontSize: 10, color: '#4b5563' }}>{q.age_category} · {q.weight_category}kg</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {mats.map((mat: any) => (
                          <button
                            key={mat.id}
                            onClick={() => assign.mutate({ queueId: q.id, matId: mat.id })}
                            style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#d1d5db', cursor: 'pointer' }}
                          >
                            {mat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {queue.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', textAlign: 'center', color: '#4b5563', fontSize: 13 }}>
                <Activity size={24} color="#374151" style={{ marginBottom: 8 }} />
                Aucun combat dans la file d'attente
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
