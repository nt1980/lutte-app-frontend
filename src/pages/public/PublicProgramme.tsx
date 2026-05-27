import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Trophy, ArrowLeft, Users, Search, X, Tv, Zap } from 'lucide-react';
import api from '../../lib/api';

const styleLabel: Record<string, string> = {
  greco_romaine: 'Gréco-romaine', libre: 'Lutte libre', feminine: 'Lutte féminine',
};

const INP: React.CSSProperties = {
  background: 'var(--inp)', border: '1px solid var(--b3)', borderRadius: 10,
  color: 'var(--fg)', fontSize: 13, padding: '7px 12px', outline: 'none', width: '100%',
};
const SEL: React.CSSProperties = { ...INP, cursor: 'pointer', appearance: 'none' as any };

function roundLabel(row: any): string {
  if (row.match_type === 'final')     return 'Finale';
  if (row.match_type === 'semifinal') return '1/2 finale';
  if (row.match_type === 'bronze')    return 'Bronze';
  if (row.bracket === 'repechage')    return 'Repêchage';
  if (row.bracket === 'bronze')       return 'Bronze';
  if (row.pool_name)                  return row.pool_name;
  if (row.round != null && row.max_round != null) {
    const fromEnd = Number(row.max_round) - Number(row.round);
    if (fromEnd === 0) return 'Finale';
    if (fromEnd === 1) return '1/2 finale';
    if (fromEnd === 2) return '1/4 de finale';
    return `Tour ${row.round}`;
  }
  return '—';
}

export default function PublicProgramme() {
  const { slug } = useParams<{ slug: string }>();

  const [search,     setSearch]     = useState('');
  const [filterAge,  setFilterAge]  = useState('');
  const [filterPoid, setFilterPoid] = useState('');

  const { data: tournament } = useQuery({
    queryKey: ['public-tournament', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}`).then(r => r.data),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-programme', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}/programme`).then(r => r.data),
    enabled: !!tournament,
    refetchInterval: 30000,
  });

  const { data: matsQueue = [] } = useQuery({
    queryKey: ['public-queue', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}/public-queue`).then(r => r.data),
    enabled: !!tournament?.public_page_enabled,
    refetchInterval: 10000,
  });

  const competitions: any[] = data?.competitions || [];
  const pools: any[]        = data?.pools || [];
  const poolsByComp = pools.reduce((acc: any, p: any) => {
    if (!acc[p.competition_id]) acc[p.competition_id] = [];
    acc[p.competition_id].push(p);
    return acc;
  }, {});

  // Options filtres
  const ageOptions: string[] = useMemo(() =>
    [...new Set(competitions.map((c: any) => c.age_category).filter(Boolean))].sort() as string[],
    [competitions]);

  const poidOptions: string[] = useMemo(() => {
    const base = filterAge ? competitions.filter((c: any) => c.age_category === filterAge) : competitions;
    return [...new Set(base.map((c: any) => c.weight_category).filter(v => v != null))].sort((a: any, b: any) => Number(a) - Number(b)) as string[];
  }, [competitions, filterAge]);

  // Filtrer les compétitions
  const filteredComps = useMemo(() => {
    const q = search.toLowerCase().trim();
    return competitions.filter((c: any) => {
      if (filterAge  && c.age_category !== filterAge) return false;
      if (filterPoid && String(c.weight_category) !== filterPoid) return false;
      if (q) {
        // chercher dans les athlètes des pools de cette compétition
        const compPools = poolsByComp[c.id] || [];
        const names = compPools.flatMap((p: any) =>
          (p.athletes || []).map((a: any) => `${a.name ?? ''} ${a.club ?? ''}`)).join(' ').toLowerCase();
        if (!names.includes(q)) return false;
      }
      return true;
    });
  }, [competitions, filterAge, filterPoid, search, poolsByComp]);

  const byCategory = useMemo(() => filteredComps.reduce((acc: any, c: any) => {
    if (!acc[c.age_category]) acc[c.age_category] = [];
    acc[c.age_category].push(c);
    return acc;
  }, {}), [filteredComps]);

  const hasFilters = search || filterAge || filterPoid;
  const resetFilters = () => { setSearch(''); setFilterAge(''); setFilterPoid(''); };

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

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>Programme des compétitions</h1>
        {tournament && (
          <p style={{ color: 'var(--fg3)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            {tournament.name} · {new Date(tournament.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {tournament.city}
          </p>
        )}

        {/* ══════════════════════════════════════════
            SECTION TAPIS — Combat en cours + File
        ══════════════════════════════════════════ */}
        {matsQueue.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
              <Tv size={15} color="#34d399" />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Tapis en direct</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {matsQueue.map((mat: any) => (
                <div key={mat.mat_id} style={{ background: 'var(--card)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, overflow: 'hidden' }}>
                  {/* Mat header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--b1)', background: 'rgba(52,211,153,0.06)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--fg)' }}>{mat.mat_name}</span>
                    {mat.queue.length > 0 && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--fg3)', background: 'var(--inp)', padding: '2px 8px', borderRadius: 99 }}>
                        {mat.queue.length} en attente
                      </span>
                    )}
                  </div>

                  {/* Combat en cours */}
                  {mat.current ? (
                    <div style={{ padding: '10px 14px', borderBottom: mat.queue.length ? '1px solid var(--b1)' : 'none' }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                        ● En cours
                      </div>
                      <MatchRow item={mat.current} num={null} isCurrent />
                    </div>
                  ) : (
                    <div style={{ padding: '10px 14px', color: 'var(--fg3)', fontSize: '0.8rem', fontStyle: 'italic', borderBottom: mat.queue.length ? '1px solid var(--b1)' : 'none' }}>
                      Aucun combat en cours
                    </div>
                  )}

                  {/* File d'attente */}
                  {mat.queue.length > 0 && (
                    <div>
                      {mat.queue.map((item: any, idx: number) => (
                        <div key={item.id} style={{ borderTop: idx > 0 ? '1px solid var(--b1)' : 'none' }}>
                          <MatchRow item={item} num={idx + 1} isCurrent={false} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            SECTION PROGRAMME — Poules + compétitions
        ══════════════════════════════════════════ */}

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

        {!isLoading && !isError && competitions.length > 0 && (
          <>
            {/* Filtres */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, padding: '14px 16px', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg3)', pointerEvents: 'none' }} />
                <input style={{ ...INP, paddingLeft: 30 }} placeholder="Rechercher un nom, club…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div style={{ flex: '1 1 140px', minWidth: 130 }}>
                <select style={SEL} value={filterAge} onChange={e => { setFilterAge(e.target.value); setFilterPoid(''); }}>
                  <option value="">Toutes catégories</option>
                  {ageOptions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={{ flex: '1 1 120px', minWidth: 110 }}>
                <select style={SEL} value={filterPoid} onChange={e => setFilterPoid(e.target.value)} disabled={poidOptions.length === 0}>
                  <option value="">Tous les poids</option>
                  {poidOptions.map(p => <option key={p} value={p}>{p} kg</option>)}
                </select>
              </div>
              {hasFilters && (
                <button onClick={resetFilters} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid var(--b3)', borderRadius: 8, padding: '7px 10px', color: 'var(--fg3)', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
                  <X size={12} /> Réinitialiser
                </button>
              )}
            </div>

            {filteredComps.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--fg3)' }}>
                Aucune compétition ne correspond à votre recherche.
              </div>
            )}

            {/* Compétitions par catégorie d'âge */}
            {Object.entries(byCategory).map(([cat, comps]: [string, any]) => (
              <div key={cat} style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                  <Zap size={13} color="var(--fg3)" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{cat}</span>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  {comps.map((comp: any) => {
                    const compPools = poolsByComp[comp.id] || [];
                    const q = search.toLowerCase().trim();
                    return (
                      <div key={comp.id} style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden' }}>
                        {/* Entête compétition */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '1rem 1.25rem', borderBottom: compPools.length ? '1px solid var(--b2)' : 'none' }}>
                          <div>
                            <span style={{ color: 'var(--fg)', fontWeight: 700, fontSize: '0.95rem' }}>
                              {comp.weight_category != null ? `${comp.weight_category} kg` : 'Poids libre'} · {comp.gender === 'M' ? 'Masculin' : comp.gender === 'F' ? 'Féminin' : 'Mixte'}
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

                        {/* Poules */}
                        {compPools.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1, background: 'var(--b1)' }}>
                            {compPools.map((pool: any) => {
                              const athletes = (pool.athletes || []).filter((a: any) => a.athlete_id);
                              // Filtrer les athlètes si recherche
                              const shown = q
                                ? athletes.filter((a: any) => `${a.name ?? ''} ${a.club ?? ''}`.toLowerCase().includes(q))
                                : athletes;
                              if (q && shown.length === 0) return null;
                              return (
                                <div key={pool.id} style={{ background: 'var(--card)', padding: '1rem 1.25rem' }}>
                                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--fg3)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {pool.name}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                    {athletes.map((a: any, i: number) => {
                                      const match = q && `${a.name ?? ''} ${a.club ?? ''}`.toLowerCase().includes(q);
                                      return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: match ? '3px 6px' : 0, background: match ? 'rgba(220,38,38,0.08)' : 'transparent', borderRadius: match ? 6 : 0 }}>
                                          <div style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--inp)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', color: 'var(--fg3)', fontWeight: 700, flexShrink: 0 }}>
                                            {i + 1}
                                          </div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--fg3)' }}>
                                              {a.club}{a.weight ? ` · ${a.weight} kg` : ''}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
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
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Composant ligne de match (tapis queue) ─── */
function MatchRow({ item, num, isCurrent }: { item: any; num: number | null; isCurrent: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px' }}>
      {/* Position dans la file */}
      {num !== null && (
        <div style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--inp)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700, color: 'var(--fg3)', flexShrink: 0 }}>
          {num}
        </div>
      )}
      {isCurrent && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0, animation: 'pulse 2s infinite' }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Catégorie */}
        <div style={{ fontSize: '0.62rem', color: 'var(--fg3)', marginBottom: 3 }}>
          {item.age_category}{item.weight_category ? ` · ${item.weight_category} kg` : ''}{item.style ? ` · ${styleLabel[item.style] || item.style}` : ''} — {roundLabel(item)}
        </div>
        {/* Athlètes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap' }}>{item.red_name || '—'}</span>
            {item.red_club && <span style={{ fontSize: '0.68rem', color: 'var(--fg3)' }}>({item.red_club})</span>}
          </span>
          <span style={{ color: 'var(--fg3)', fontSize: '0.75rem' }}>vs</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap' }}>{item.blue_name || '—'}</span>
            {item.blue_club && <span style={{ fontSize: '0.68rem', color: 'var(--fg3)' }}>({item.blue_club})</span>}
          </span>
        </div>
      </div>
    </div>
  );
}
