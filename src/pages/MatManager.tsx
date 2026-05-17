import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Activity, ChevronRight, Tv } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const statusColor: Record<string, string> = {
  ready: 'badge-green', on_mat: 'badge-yellow', waiting: 'badge-gray', finished: 'badge-gray', blocked: 'badge-red',
};

export default function MatManager() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: mats = [] } = useQuery({ queryKey: ['mats', id], queryFn: () => api.get(`/api/tournaments/${id}/mats`).then(r => r.data) });
  const { data: queue = [] } = useQuery({ queryKey: ['queue', id], queryFn: () => api.get(`/api/tournaments/${id}/queue`).then(r => r.data), refetchInterval: 5000 });

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

  return (
    <Layout tournamentId={id}>
      <PageHeader title="Gestion des tapis" subtitle={`${mats.length} tapis • ${queue.filter((q: any) => q.status === 'on_mat').length} en cours`} />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tapis */}
        {Object.values(byMat).map(({ mat, matches }: any) => {
          const current = matches.find((m: any) => m.status === 'on_mat');
          const next = matches.filter((m: any) => m.status === 'ready');
          return (
            <div key={mat.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-red-500" />
                  <span className="font-bold text-white">{mat.name}</span>
                  {current && <span className="badge-yellow">EN COURS</span>}
                </div>
                <Link to={`/mat/${mat.id}`} target="_blank" className="btn-ghost btn-sm">
                  <Tv size={14} /> Live
                </Link>
              </div>

              {current ? (
                <div className="bg-[#242424] rounded-lg p-3 space-y-1">
                  <div className="text-xs text-gray-500 uppercase">Combat en cours</div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-semibold text-sm">{current.red_name || '?'}</span>
                    <span className="text-gray-600 text-xs">vs</span>
                    <span className="text-blue-400 font-semibold text-sm">{current.blue_name || '?'}</span>
                  </div>
                  <div className="text-xs text-gray-500">{current.age_category} • {current.weight_category}kg • {current.style}</div>
                  {current.match_id && (
                    <Link to={`/ref/${current.match_id}`} target="_blank" className="btn-primary btn-sm w-full mt-2 flex justify-center">Vue arbitre</Link>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-600 text-sm py-2">Tapis libre</div>
              )}

              {next.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 uppercase">Prochains</div>
                  {next.slice(0, 3).map((q: any) => (
                    <div key={q.id} className="flex items-center gap-2 text-xs bg-[#1A1A1A] rounded px-2 py-1.5">
                      <span className="text-red-400">{q.red_name || '?'}</span>
                      <span className="text-gray-600">vs</span>
                      <span className="text-blue-400">{q.blue_name || '?'}</span>
                      <span className="text-gray-600 ml-auto">{q.age_category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Non affectés */}
        {unassigned.length > 0 && (
          <div className="card space-y-3 lg:col-span-3">
            <div className="font-bold text-white">Combats prêts — à affecter ({unassigned.length})</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {unassigned.map((q: any) => (
                <div key={q.id} className="bg-[#242424] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-semibold text-sm">{q.red_name || '?'}</span>
                    <span className="text-gray-600 text-xs">vs</span>
                    <span className="text-blue-400 font-semibold text-sm">{q.blue_name || '?'}</span>
                  </div>
                  <div className="text-xs text-gray-500">{q.age_category} • {q.weight_category}kg</div>
                  <div className="flex gap-1 flex-wrap">
                    {mats.map((mat: any) => (
                      <button key={mat.id} onClick={() => assign.mutate({ queueId: q.id, matId: mat.id })}
                        className="btn-secondary btn-sm text-xs">
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
          <div className="lg:col-span-3 card flex flex-col items-center py-12 text-center">
            <Activity size={32} className="text-gray-600 mb-3" />
            <p className="text-gray-400">Aucun combat dans la file</p>
            <p className="text-gray-600 text-sm mt-1">Générez les compétitions et les tableaux pour commencer</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
