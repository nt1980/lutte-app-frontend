import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Zap, Grid3X3, RefreshCw, Users, Filter } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { sortAgeCategories, sortGroupEntries } from '../lib/ageSort';

const FORMAT: Record<string, { label: string; color: string; bg: string }> = {
  nordic:             { label: 'Nordique (≤5)',          color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  pools_finals:       { label: 'Poules + Finales (6-8)', color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
  bracket_repechage:  { label: 'Tableau + Repêchage',    color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

const STYLE_LABELS: Record<string, string> = {
  libre:    'Lutte libre',
  greco:    'Gréco-romaine',
  feminine: 'Lutte féminine',
};

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 13px',
        borderRadius: 20,
        border: active ? '1px solid rgba(220,38,38,0.6)' : '1px solid rgba(255,255,255,0.1)',
        background: active ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.04)',
        color: active ? '#f87171' : '#6b7280',
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {label}
    </button>
  );
}

export default function Competitions() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const [filterStyle, setFilterStyle]   = useState<string | null>(null);
  const [filterAge,   setFilterAge]     = useState<string | null>(null);

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions', id],
    queryFn: () => api.get(`/api/tournaments/${id}/competitions`).then(r => r.data),
  });

  const { data: options } = useQuery({
    queryKey: ['competition-options', id],
    queryFn: () => api.get(`/api/tournaments/${id}/competitions/options`).then(r => r.data),
  });

  const styles: string[]        = options?.styles        ?? [];
  const ageCategories: string[] = sortAgeCategories(options?.age_categories ?? []);

  const generate = useMutation({
    mutationFn: () => api.post(`/api/tournaments/${id}/competitions/generate`, {
      style:        filterStyle ?? undefined,
      age_category: filterAge   ?? undefined,
    }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['competitions', id] });
      qc.invalidateQueries({ queryKey: ['competition-options', id] });
      const label = [filterStyle ? STYLE_LABELS[filterStyle] ?? filterStyle : null, filterAge].filter(Boolean).join(' · ');
      toast.success(`${r.data.created} compétitions générées${label ? ` (${label})` : ''}`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Erreur lors de la génération';
      toast.error(msg, { duration: 6000 });
    },
  });

  // Filtrer la liste affichée selon les chips sélectionnés
  const visible = competitions.filter((c: any) => {
    if (filterStyle && c.style !== filterStyle) return false;
    if (filterAge   && c.age_category !== filterAge) return false;
    return true;
  });

  const grouped: Record<string, any[]> = visible.reduce((acc: any, c: any) => {
    const key = c.age_category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const generateLabel = (() => {
    const parts = [];
    if (filterStyle) parts.push(STYLE_LABELS[filterStyle] ?? filterStyle);
    if (filterAge)   parts.push(filterAge);
    return parts.length ? `Générer — ${parts.join(' · ')}` : 'Générer les compétitions';
  })();

  const hasFilters = filterStyle !== null || filterAge !== null;

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Compétitions"
        subtitle={`${competitions.length} compétition${competitions.length !== 1 ? 's' : ''} générée${competitions.length !== 1 ? 's' : ''}`}
        actions={
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#dc2626', color: '#fff', padding: '8px 16px',
              borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none',
              cursor: generate.isPending ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
              opacity: generate.isPending ? 0.7 : 1,
            }}
          >
            <RefreshCw size={14} style={{ animation: generate.isPending ? 'spin 1s linear infinite' : 'none' }} />
            {generate.isPending ? 'Génération…' : generateLabel}
          </button>
        }
      />

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Filtres ── */}
        {(styles.length > 0 || ageCategories.length > 0) && (
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={12} color="#4b5563" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Filtrer par
              </span>
              {hasFilters && (
                <button
                  onClick={() => { setFilterStyle(null); setFilterAge(null); }}
                  style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Effacer
                </button>
              )}
            </div>

            {/* Styles */}
            {styles.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Style</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <Chip label="Tous" active={filterStyle === null} onClick={() => setFilterStyle(null)} />
                  {styles.map(s => (
                    <Chip
                      key={s}
                      label={STYLE_LABELS[s] ?? s}
                      active={filterStyle === s}
                      onClick={() => setFilterStyle(filterStyle === s ? null : s)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Catégories d'âge */}
            {ageCategories.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Catégorie d'âge</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <Chip label="Toutes" active={filterAge === null} onClick={() => setFilterAge(null)} />
                  {ageCategories.map(cat => (
                    <Chip
                      key={cat}
                      label={cat}
                      active={filterAge === cat}
                      onClick={() => setFilterAge(filterAge === cat ? null : cat)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Info résultat */}
            {hasFilters && (
              <div style={{ fontSize: 11, color: '#4b5563', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10, marginTop: 2 }}>
                {visible.length} compétition{visible.length !== 1 ? 's' : ''} affichée{visible.length !== 1 ? 's' : ''} · La génération ne créera que celles correspondant aux filtres
              </div>
            )}
          </div>
        )}

        {/* ── Liste des compétitions ── */}
        {competitions.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Grid3X3 size={28} color="#374151" strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Aucune compétition</div>
            <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 20 }}>Terminez la pesée puis générez les compétitions</div>
            <button onClick={() => generate.mutate()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#fff', padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              <Zap size={14} /> Générer maintenant
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', textAlign: 'center', background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
            <div style={{ fontSize: 13, color: '#4b5563' }}>Aucune compétition pour ce filtre</div>
            <div style={{ fontSize: 11, color: '#374151', marginTop: 4 }}>Modifiez les filtres ou cliquez sur Générer pour créer des compétitions dans cette sélection</div>
          </div>
        ) : (
          sortGroupEntries(Object.entries(grouped)).map(([cat, comps]) => (
            <section key={cat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{cat}</span>
                <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 5, padding: '1px 7px', fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{comps.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {comps.map((c: any) => {
                  const fmt = FORMAT[c.format_type] || { label: c.format_type, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
                  return (
                    <div key={c.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                            {c.weight_category} kg · {c.gender === 'M' ? '♂ Masculin' : '♀ Féminin'}
                          </div>
                          <div style={{ fontSize: 12, color: '#4b5563', marginTop: 3, textTransform: 'capitalize' }}>
                            {STYLE_LABELS[c.style] ?? c.style}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 6, padding: '2px 8px', flexShrink: 0 }}>
                          <Users size={10} color="#60a5fa" />
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa' }}>{c.athlete_count}</span>
                        </div>
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', background: fmt.bg, borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: fmt.color }}>
                        {fmt.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
