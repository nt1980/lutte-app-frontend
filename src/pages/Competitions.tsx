import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Zap, Grid3X3, RefreshCw, Users } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const FORMAT: Record<string, { label: string; color: string; bg: string }> = {
  nordic:             { label: 'Nordique (≤5)',          color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  pools_finals:       { label: 'Poules + Finales (6-8)', color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
  bracket_repechage:  { label: 'Tableau + Repêchage',    color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

export default function Competitions() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions', id],
    queryFn: () => api.get(`/api/tournaments/${id}/competitions`).then(r => r.data),
  });

  const generate = useMutation({
    mutationFn: () => api.post(`/api/tournaments/${id}/competitions/generate`),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['competitions', id] }); toast.success(`${r.data.created} compétitions générées`); },
    onError: () => toast.error('Erreur lors de la génération'),
  });

  const grouped: Record<string, any[]> = competitions.reduce((acc: any, c: any) => {
    const key = c.age_category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Compétitions"
        subtitle={`${competitions.length} compétitions générées`}
        actions={
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}
          >
            <RefreshCw size={14} style={{ animation: generate.isPending ? 'spin 1s linear infinite' : 'none' }} />
            {generate.isPending ? 'Génération…' : 'Générer les compétitions'}
          </button>
        }
      />

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
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
        ) : (
          Object.entries(grouped).map(([cat, comps]) => (
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
                          <div style={{ fontSize: 12, color: '#4b5563', marginTop: 3, textTransform: 'capitalize' }}>{c.style}</div>
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
