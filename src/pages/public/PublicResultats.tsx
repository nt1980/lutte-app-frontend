import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Trophy, ArrowLeft, Medal, Search, X } from 'lucide-react';
import api from '../../lib/api';

const winTypeLabel: Record<string, string> = {
  points: 'Aux points', superiority: 'Supériorité', fall: 'Tombé',
  forfeit: 'Forfait', abandon: 'Abandon', dq: 'Disqualification',
};

const INP: React.CSSProperties = {
  background: 'var(--inp)', border: '1px solid var(--b3)', borderRadius: 10,
  color: 'var(--fg)', fontSize: 13, padding: '7px 12px', outline: 'none', width: '100%',
};
const SEL: React.CSSProperties = { ...INP, cursor: 'pointer', appearance: 'none' as any };

export default function PublicResultats() {
  const { slug } = useParams<{ slug: string }>();

  const [search,     setSearch]     = useState('');
  const [filterAge,  setFilterAge]  = useState('');
  const [filterPoid, setFilterPoid] = useState('');

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

  // Options dynamiques
  const ageOptions: string[]  = useMemo(() => [...new Set(results.map((r: any) => r.age_category).filter(Boolean))].sort() as string[], [results]);
  const poidOptions: string[] = useMemo(() => {
    const base = filterAge ? results.filter((r: any) => r.age_category === filterAge) : results;
    return [...new Set(base.map((r: any) => r.weight_category).filter(Boolean))].sort((a: any, b: any) => Number(a) - Number(b)) as string[];
  }, [results, filterAge]);

  // Filtrage
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return results.filter((r: any) => {
      if (filterAge  && r.age_category    !== filterAge)  return false;
      if (filterPoid && String(r.weight_category) !== filterPoid) return false;
      if (q) {
        const names = [r.red_name, r.blue_name, r.red_club, r.blue_club].join(' ').toLowerCase();
        if (!names.includes(q)) return false;
      }
      return true;
    });
  }, [results, search, filterAge, filterPoid]);

  // Grouper par catégorie + poids
  const grouped = useMemo(() => filtered.reduce((acc: any, r: any) => {
    const key = `${r.age_category}||${r.weight_category}`;
    if (!acc[key]) acc[key] = { label: `${r.age_category} · ${r.weight_category ?? 'Libre'} kg`, rows: [] };
    acc[key].rows.push(r);
    return acc;
  }, {}), [filtered]);

  // Numérotation globale (à travers tous les groupes affichés)
  let lineCounter = 0;

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
          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Résultats</span>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.4rem' }}>Résultats</h1>
            {tournament && (
              <p style={{ color: 'var(--fg3)', fontSize: '0.875rem' }}>
                {tournament.name} · {filtered.length} combat{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          {results.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 99, padding: '0.35rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#f87171' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              Mis à jour en temps réel
            </div>
          )}
        </div>

        {/* ── Filtres ── */}
        {results.length > 0 && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, padding: '14px 16px', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>

            {/* Recherche nom */}
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg3)', pointerEvents: 'none' }} />
              <input
                style={{ ...INP, paddingLeft: 30 }}
                placeholder="Rechercher un nom, club…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Catégorie d'âge */}
            <div style={{ flex: '1 1 140px', minWidth: 130 }}>
              <select style={SEL} value={filterAge} onChange={e => { setFilterAge(e.target.value); setFilterPoid(''); }}>
                <option value="">Toutes catégories</option>
                {ageOptions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Catégorie de poids */}
            <div style={{ flex: '1 1 120px', minWidth: 110 }}>
              <select style={SEL} value={filterPoid} onChange={e => setFilterPoid(e.target.value)} disabled={poidOptions.length === 0}>
                <option value="">Tous les poids</option>
                {poidOptions.map(p => <option key={p} value={p}>{p} kg</option>)}
              </select>
            </div>

            {/* Reset */}
            {hasFilters && (
              <button onClick={resetFilters} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid var(--b3)', borderRadius: 8, padding: '7px 10px', color: 'var(--fg3)', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
                <X size={12} /> Réinitialiser
              </button>
            )}
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
        {!isLoading && !isError && results.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--fg3)' }}>
            Aucun résultat ne correspond à votre recherche.
          </div>
        )}

        {/* Résultats groupés */}
        {Object.values(grouped).map((group: any) => (
          <div key={group.label} style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
              {group.label}
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden' }}>
              {group.rows.map((r: any) => {
                lineCounter++;
                const winnerIsRed  = r.winner_id === r.red_athlete_id;
                const winnerIsBlue = r.winner_id === r.blue_athlete_id;
                return (
                  <div key={r.id} style={{ borderTop: lineCounter > 1 ? '1px solid var(--b1)' : 'none' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto 1fr', alignItems: 'center', padding: '0.8rem 1rem', gap: '0.75rem' }}>

                      {/* N° de ligne */}
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--dim)', textAlign: 'center', background: 'var(--inp)', borderRadius: 6, padding: '3px 0', minWidth: 24 }}>
                        {lineCounter}
                      </div>

                      {/* Rouge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: winnerIsRed ? 700 : 400, color: winnerIsRed ? 'var(--fg)' : 'var(--fg3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            {winnerIsRed && <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>🏆</span>}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.red_name || '—'}</span>
                          </div>
                          {r.red_club && <div style={{ fontSize: '0.7rem', color: 'var(--fg3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.red_club}</div>}
                        </div>
                      </div>

                      {/* Score central */}
                      <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 90 }}>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--fg)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>
                          {r.score_red ?? '—'} – {r.score_blue ?? '—'}
                        </div>
                        {r.win_type && (
                          <div style={{ fontSize: '0.62rem', color: 'var(--fg3)', marginTop: 1 }}>
                            {winTypeLabel[r.win_type] || r.win_type}
                          </div>
                        )}
                      </div>

                      {/* Bleu */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 0 }}>
                        <div style={{ minWidth: 0, textAlign: 'right' }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: winnerIsBlue ? 700 : 400, color: winnerIsBlue ? 'var(--fg)' : 'var(--fg3)', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.blue_name || '—'}</span>
                            {winnerIsBlue && <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>🏆</span>}
                          </div>
                          {r.blue_club && <div style={{ fontSize: '0.7rem', color: 'var(--fg3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.blue_club}</div>}
                        </div>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                      </div>
                    </div>
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
