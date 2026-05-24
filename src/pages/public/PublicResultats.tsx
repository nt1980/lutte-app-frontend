import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Trophy, ArrowLeft, Medal } from 'lucide-react';
import api from '../../lib/api';

const winTypeLabel: Record<string, string> = {
  points: 'Aux points', superiority: 'Supériorité', fall: 'Tombé',
  forfeit: 'Forfait', abandon: 'Abandon', dq: 'Disqualification',
};

export default function PublicResultats() {
  const { slug } = useParams<{ slug: string }>();
  const [filterCat, setFilterCat] = useState('');

  const { data: tournament } = useQuery({
    queryKey: ['public-tournament', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}`).then(r => r.data),
  });

  const { data: results = [], isLoading, isError } = useQuery({
    queryKey: ['public-results', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}/results`).then(r => r.data),
    enabled: !!tournament?.public_results_enabled,
    refetchInterval: 15000,
  });

  const categories: string[] = [...new Set(results.map((r: any) => r.age_category))].sort() as string[];

  const filtered = filterCat ? results.filter((r: any) => r.age_category === filterCat) : results;

  // Group by category + weight
  const grouped = filtered.reduce((acc: any, r: any) => {
    const key = `${r.age_category} · ${r.weight_category}kg`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--b2)', position: 'sticky', top: 0, background: 'var(--bg)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
        <Link to={`/tournoi/${slug}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg3)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
          <ArrowLeft size={16} /> {tournament?.name || 'Retour'}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={13} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Résultats</span>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.4rem' }}>Résultats</h1>
            {tournament && (
              <p style={{ color: 'var(--fg3)', fontSize: '0.875rem' }}>
                {tournament.name} · {results.length} combat{results.length > 1 ? 's' : ''} terminé{results.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Live badge */}
          {results.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 99, padding: '0.35rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#f87171' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              Mis à jour en temps réel
            </div>
          )}
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.5rem' }}>
            <button
              onClick={() => setFilterCat('')}
              style={{ padding: '0.35rem 1rem', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: !filterCat ? '#dc2626' : 'var(--inp)', color: !filterCat ? 'white' : 'var(--fg3)', transition: 'all 0.15s' }}
            >
              Toutes
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat === filterCat ? '' : cat)}
                style={{ padding: '0.35rem 1rem', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: filterCat === cat ? '#dc2626' : 'var(--inp)', color: filterCat === cat ? 'white' : 'var(--fg3)', transition: 'all 0.15s' }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--fg3)' }}>Chargement des résultats…</div>
        )}

        {isError && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Medal size={32} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--dim)' }} />
            <div style={{ color: '#f87171', fontWeight: 600, marginBottom: '0.5rem' }}>Résultats non disponibles</div>
            <div style={{ color: 'var(--fg3)', fontSize: '0.875rem' }}>Les résultats ne sont pas encore publiés.</div>
          </div>
        )}

        {!isLoading && !isError && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Medal size={32} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--dim)' }} />
            <div style={{ color: 'var(--fg3)', fontWeight: 600, marginBottom: '0.5rem' }}>Aucun résultat pour l'instant</div>
            <div style={{ color: 'var(--fg3)', fontSize: '0.875rem' }}>Les résultats apparaîtront ici dès que les combats seront terminés.</div>
          </div>
        )}

        {/* Results grouped by category */}
        {Object.entries(grouped).map(([key, matches]: [string, any]) => (
          <div key={key} style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
              {key}
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden' }}>
              {matches.map((r: any, i: number) => (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0.85rem 1.25rem', borderTop: i > 0 ? '1px solid var(--b1)' : 'none', gap: '1rem' }}>
                  {/* Red */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: r.winner_id === r.red_athlete_id ? 700 : 400, color: r.winner_id === r.red_athlete_id ? 'var(--fg)' : 'var(--fg3)' }}>
                        {r.red_name}
                        {r.winner_id === r.red_athlete_id && <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#fbbf24' }}>🏆</span>}
                      </div>
                      {r.red_club && <div style={{ fontSize: '0.72rem', color: 'var(--fg3)' }}>{r.red_club}</div>}
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>
                      {r.score_red ?? '—'} – {r.score_blue ?? '—'}
                    </div>
                    {r.win_type && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--fg3)', marginTop: 2 }}>
                        {winTypeLabel[r.win_type] || r.win_type}
                      </div>
                    )}
                  </div>

                  {/* Blue */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: r.winner_id === r.blue_athlete_id ? 700 : 400, color: r.winner_id === r.blue_athlete_id ? 'var(--fg)' : 'var(--fg3)' }}>
                        {r.winner_id === r.blue_athlete_id && <span style={{ marginRight: 6, fontSize: '0.7rem', color: '#fbbf24' }}>🏆</span>}
                        {r.blue_name}
                      </div>
                      {r.blue_club && <div style={{ fontSize: '0.72rem', color: 'var(--fg3)' }}>{r.blue_club}</div>}
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
