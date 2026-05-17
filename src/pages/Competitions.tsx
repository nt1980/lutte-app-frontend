import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Zap, Grid3X3, RefreshCw } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const formatLabel: Record<string, string> = {
  nordic: 'Nordique (≤5)',
  pools_finals: 'Poules + Finales (6-8)',
  bracket_repechage: 'Tableau + Repêchage (9+)',
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
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['competitions', id] });
      toast.success(`${r.data.created} compétitions générées`);
    },
    onError: () => toast.error('Erreur lors de la génération'),
  });

  const grouped = competitions.reduce((acc: any, c: any) => {
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
          <button className="btn-primary" onClick={() => generate.mutate()} disabled={generate.isPending}>
            <RefreshCw size={16} className={generate.isPending ? 'animate-spin' : ''} />
            {generate.isPending ? 'Génération…' : 'Générer les compétitions'}
          </button>
        }
      />
      <div className="p-6 space-y-6">
        {competitions.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <Grid3X3 size={40} className="text-gray-600 mb-3" />
            <p className="text-gray-400 font-medium">Aucune compétition</p>
            <p className="text-gray-600 text-sm mt-1">Terminez la pesée puis générez les compétitions</p>
            <button className="btn-primary mt-4" onClick={() => generate.mutate()}>
              <Zap size={16} /> Générer maintenant
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, comps]: any) => (
            <div key={cat}>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">{cat}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {comps.map((c: any) => (
                  <div key={c.id} className="card-sm space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-white text-sm">
                          {c.weight_category} kg • {c.gender === 'M' ? 'Masculin' : 'Féminin'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 capitalize">{c.style}</div>
                      </div>
                      <span className="badge-blue text-[10px]">{c.athlete_count} athlètes</span>
                    </div>
                    <div className="text-xs text-gray-500 bg-[#242424] rounded px-2 py-1">
                      {formatLabel[c.format_type] || c.format_type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
