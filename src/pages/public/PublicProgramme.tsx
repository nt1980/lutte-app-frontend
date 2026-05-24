import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Trophy, ArrowLeft, Users } from 'lucide-react';
import api from '../../lib/api';

const styleLabel: Record<string, string> = {
  greco_romaine: 'Gréco-romaine',
  libre: 'Lutte libre',
  feminine: 'Lutte féminine',
};

export default function PublicProgramme() {
  const { slug } = useParams<{ slug: string }>();

  const { data: tournament } = useQuery({
    queryKey: ['public-tournament', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}`).then(r => r.data),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-programme', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}/programme`).then(r => r.data),
    enabled: !!tournament,
  });

  const competitions: any[] = data?.competitions || [];
  const pools: any[]        = data?.pools || [];

  // Group pools by competition
  const poolsByComp = pools.reduce((acc: any, p: any) => {
    if (!acc[p.competition_id]) acc[p.competition_id] = [];
    acc[p.competition_id].push(p);
    return acc;
  }, {});

  // Group competitions by age category
  const byCategory = competitions.reduce((acc: any, c: any) => {
    if (!acc[c.age_category]) acc[c.age_category] = [];
    acc[c.age_category].push(c);
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
          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Programme</span>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>Programme des compétitions</h1>
        {tournament && (
          <p style={{ color: 'var(--fg3)', fontSize: '0.875rem', marginBottom: '2.5rem' }}>
            {tournament.name} · {new Date(tournament.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {tournament.city}
          </p>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--fg3)' }}>Chargement du programme…</div>
        )}

        {isError && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ color: '#f87171', fontWeight: 600, marginBottom: '0.5rem' }}>Programme non disponible</div>
            <div style={{ color: 'var(--fg3)', fontSize: '0.875rem' }}>Le programme n'est pas encore publié pour ce tournoi.</div>
          </div>
        )}

        {!isLoading && !isError && competitions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--fg3)' }}>
            <Users size={32} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--dim)' }} />
            Les compétitions ne sont pas encore disponibles.
          </div>
        )}

        {Object.entries(byCategory).map(([cat, comps]: [string, any]) => (
          <div key={cat} style={{ marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>
              {cat}
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {comps.map((comp: any) => {
                const compPools = poolsByComp[comp.id] || [];
                return (
                  <div key={comp.id} style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden' }}>
                    {/* Competition header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: compPools.length ? '1px solid var(--b2)' : 'none' }}>
                      <div>
                        <span style={{ color: 'var(--fg)', fontWeight: 700, fontSize: '0.95rem' }}>
                          {comp.weight_category} kg · {comp.gender === 'M' ? 'Masculin' : 'Féminin'}
                        </span>
                        <span style={{ color: 'var(--fg3)', fontSize: '0.8rem', marginLeft: 12 }}>
                          {styleLabel[comp.style] || comp.style}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 6, padding: '0.2rem 0.6rem', fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600 }}>
                          {comp.athlete_count} combattants
                        </span>
                        <span style={{ background: 'var(--inp)', borderRadius: 6, padding: '0.2rem 0.6rem', fontSize: '0.7rem', color: 'var(--fg3)' }}>
                          {comp.format_type === 'nordic' ? 'Nordique' : comp.format_type === 'pools_finals' ? 'Poules + Finales' : 'Tableau + Repêchage'}
                        </span>
                      </div>
                    </div>

                    {/* Pools */}
                    {compPools.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1, background: 'var(--b1)' }}>
                        {compPools.map((pool: any) => (
                          <div key={pool.id} style={{ background: 'var(--card)', padding: '1rem 1.25rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--fg3)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {pool.name}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {(pool.athletes || []).filter((a: any) => a.athlete_id).map((a: any, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--inp)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--fg3)', fontWeight: 700, flexShrink: 0 }}>
                                    {i + 1}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--fg3)' }}>{a.club}{a.weight ? ` · ${a.weight} kg` : ''}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {compPools.length === 0 && (
                      <div style={{ padding: '1rem 1.25rem', color: 'var(--fg3)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                        Tableau non encore généré
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
