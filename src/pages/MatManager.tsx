import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Activity, Tv, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const STYLE_SHORT: Record<string, string> = {
  libre:    'Libre',
  greco:    'Gréco',
  feminine: 'Fém.',
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

  // Matches par tapis
  const byMat = mats.reduce((acc: any, mat: any) => {
    acc[mat.id] = { mat, matches: queue.filter((q: any) => q.mat_id === mat.id) };
    return acc;
  }, {});

  // Queue globale non affectée, triée par position
  const unassigned: any[] = queue
    .filter((q: any) => !q.mat_id && q.status === 'ready')
    .sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999));

  const activeCount = queue.filter((q: any) => q.status === 'on_mat').length;

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Gestion des tapis"
        subtitle={`${mats.length} tapis · ${activeCount} combat${activeCount !== 1 ? 's' : ''} en cours${unassigned.length > 0 ? ` · ${unassigned.length} en attente` : ''}`}
      />

      <div style={{ padding: isMobile ? '12px' : '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

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
            {/* ── Grille des tapis ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
              alignItems: 'start',
            }}>
              {Object.values(byMat).map(({ mat, matches }: any) => {
                const current  = matches.find((m: any) => m.status === 'on_mat');
                const matQueue = matches.filter((m: any) => m.status === 'ready')
                  .sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999));
                const hasActivity = !!current;

                return (
                  <div
                    key={mat.id}
                    style={{
                      background: '#0e0e0e',
                      border: `1px solid ${hasActivity ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 16,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* ── Header du tapis ── */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderBottom: `1px solid ${hasActivity ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.05)'}`,
                      background: hasActivity ? 'rgba(251,191,36,0.04)' : 'transparent',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9,
                          background: hasActivity ? 'rgba(251,191,36,0.14)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${hasActivity ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
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
                      <Link
                        to={`/mat/${mat.id}`}
                        target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#60a5fa', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.18)', borderRadius: 8, padding: '5px 11px', textDecoration: 'none' }}
                      >
                        <Tv size={11} /> Live
                      </Link>
                    </div>

                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                      {/* ── Combat en cours ── */}
                      {current ? (
                        <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 12, overflow: 'hidden' }}>
                          <div style={{ padding: '6px 12px', background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.12)' }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                              ● Combat en cours
                            </span>
                          </div>
                          <div style={{ padding: '12px' }}>
                            {/* Noms */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {current.red_name || '?'}
                                </span>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>vs</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
                                  {current.blue_name || '?'}
                                </span>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                              </div>
                            </div>
                            {/* Catégorie */}
                            <div style={{ fontSize: 10, color: '#4b5563', marginBottom: current.match_id ? 10 : 0, textAlign: 'center' }}>
                              {current.age_category} · {current.weight_category}kg · {STYLE_SHORT[current.style] ?? current.style}
                            </div>
                            {current.match_id && (
                              <Link
                                to={`/ref/${current.match_id}`}
                                target="_blank"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#fff', background: '#dc2626', borderRadius: 8, padding: '8px 0', textDecoration: 'none' }}
                              >
                                Vue arbitre <ChevronRight size={13} />
                              </Link>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', color: '#2d2d2d', fontSize: 12 }}>
                          Tapis libre
                        </div>
                      )}

                      {/* ── Queue spécifique à ce tapis (rare mais possible) ── */}
                      {matQueue.length > 0 && (
                        <QueueSection items={matQueue} label="File de ce tapis" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── File d'attente globale — combats non affectés ── */}
            {unassigned.length > 0 && (
              <div style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '12px 14px' : '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(248,113,113,0.03)' }}>
                  <AlertCircle size={13} color="#f87171" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Combats en attente</span>
                  <span style={{ background: 'rgba(248,113,113,0.14)', color: '#f87171', borderRadius: 6, padding: '1px 9px', fontSize: 11, fontWeight: 700 }}>
                    {unassigned.length}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#374151' }}>
                    Affecter à un tapis →
                  </span>
                </div>

                {/* Liste condensée */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {unassigned.map((q: any, idx: number) => (
                    <div
                      key={q.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: isMobile ? '10px 14px' : '9px 18px',
                        borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      }}
                    >
                      {/* Position */}
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#374151', width: 18, textAlign: 'center', flexShrink: 0 }}>
                        {q.position ?? idx + 1}
                      </span>

                      {/* Rouge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                        <span style={{ fontSize: isMobile ? 13 : 12, fontWeight: 600, color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {q.red_name || '?'}
                        </span>
                      </div>

                      <span style={{ fontSize: 10, fontWeight: 700, color: '#2d2d2d', flexShrink: 0 }}>vs</span>

                      {/* Bleu */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: isMobile ? 13 : 12, fontWeight: 600, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
                          {q.blue_name || '?'}
                        </span>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                      </div>

                      {/* Catégorie */}
                      <span style={{ fontSize: 10, color: '#4b5563', whiteSpace: 'nowrap', flexShrink: 0, display: isMobile ? 'none' : 'block' }}>
                        {q.age_category} · {q.weight_category}kg
                      </span>

                      {/* Boutons d'affectation */}
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        {mats.map((mat: any) => (
                          <button
                            key={mat.id}
                            onClick={() => assign.mutate({ queueId: q.id, matId: mat.id })}
                            title={`Affecter à ${mat.name}`}
                            style={{
                              fontSize: 10, fontWeight: 700,
                              padding: '4px 9px', borderRadius: 6,
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#9ca3af', cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {mat.name.replace('Tapis ', '')}
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

function QueueSection({ items, label }: { items: any[]; label: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
        <Clock size={10} color="#4b5563" />
        <span style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label} ({items.length})
        </span>
      </div>
      <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
        {items.map((q: any, i: number) => (
          <div
            key={q.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px',
              borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 700, color: '#374151', width: 14, textAlign: 'center', flexShrink: 0 }}>
              {q.position ?? i + 1}
            </span>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {q.red_name || '?'}
            </span>
            <span style={{ fontSize: 9, color: '#2d2d2d', fontWeight: 700 }}>vs</span>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
              {q.blue_name || '?'}
            </span>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: '#374151', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {q.age_category} · {q.weight_category}kg
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
