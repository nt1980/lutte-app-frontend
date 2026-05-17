import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Search, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const statusInfo: Record<string, { label: string; cls: string; icon: any }> = {
  pending: { label: 'En attente', cls: 'badge-gray', icon: Clock },
  done: { label: 'Pesé', cls: 'badge-green', icon: CheckCircle },
  overweight: { label: 'Hors catégorie', cls: 'badge-red', icon: AlertTriangle },
  no_show: { label: 'Absent', cls: 'badge-yellow', icon: AlertTriangle },
};

export default function WeighIn() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [weight, setWeight] = useState('');
  const [status, setStatus] = useState('done');

  const { data: regs = [] } = useQuery({
    queryKey: ['registrations', id],
    queryFn: () => api.get(`/api/tournaments/${id}/registrations`).then(r => r.data),
    refetchInterval: 5000,
  });

  const mutation = useMutation({
    mutationFn: ({ regId, data }: any) => api.put(`/api/tournaments/${id}/registrations/${regId}/weigh-in`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registrations', id] });
      toast.success('Pesée enregistrée');
      setSelected(null);
      setWeight('');
    },
    onError: () => toast.error('Erreur lors de la pesée'),
  });

  const filtered = regs.filter((r: any) =>
    !search || `${r.last_name} ${r.first_name} ${r.license_number}`.toLowerCase().includes(search.toLowerCase())
  );

  const pending = regs.filter((r: any) => r.weigh_in_status === 'pending').length;
  const done = regs.filter((r: any) => r.weigh_in_status === 'done').length;

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Pesée"
        subtitle={`${done} / ${regs.length} pesés`}
      />
      <div className="p-6 flex gap-6">
        {/* Liste */}
        <div className="flex-1 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input className="input pl-9" placeholder="Rechercher par nom ou numéro de licence…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          </div>

          <div className="flex gap-2 text-xs">
            <span className="badge-gray">En attente: {pending}</span>
            <span className="badge-green">Pesés: {done}</span>
          </div>

          <div className="space-y-1">
            {filtered.map((reg: any) => {
              const s = statusInfo[reg.weigh_in_status] || statusInfo.pending;
              const Icon = s.icon;
              return (
                <button
                  key={reg.id}
                  onClick={() => { setSelected(reg); setWeight(reg.weigh_in_weight_kg || ''); setStatus(reg.weigh_in_status || 'done'); }}
                  className={`w-full text-left card-sm hover:border-red-600/40 transition-all flex items-center gap-3 ${selected?.id === reg.id ? 'border-red-600' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">{reg.last_name} {reg.first_name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>{reg.license_number}</span>
                      <span>•</span>
                      <span>{reg.club_short || reg.club_name || '—'}</span>
                      {reg.final_age_category && <><span>•</span><span>{reg.final_age_category}</span></>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {reg.weigh_in_weight_kg && <span className="text-sm font-bold text-white">{reg.weigh_in_weight_kg} kg</span>}
                    <span className={s.cls}><Icon size={11} className="inline mr-1" />{s.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panneau pesée */}
        {selected && (
          <div className="w-72 shrink-0">
            <div className="card sticky top-6 space-y-4">
              <div>
                <div className="text-lg font-bold text-white">{selected.last_name} {selected.first_name}</div>
                <div className="text-xs text-gray-500 mt-1">{selected.license_number} • {selected.club_name}</div>
                {selected.default_weight_kg && (
                  <div className="text-xs text-gray-500">Poids licence: <span className="text-white font-semibold">{selected.default_weight_kg} kg</span></div>
                )}
              </div>

              <div>
                <label className="label">Poids relevé (kg)</label>
                <input
                  type="number" step="0.1" min="0" max="200"
                  className="input text-2xl font-bold text-center"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="0.0"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Statut</label>
                <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="done">Pesé ✓</option>
                  <option value="overweight">Hors catégorie</option>
                  <option value="no_show">Absent</option>
                  <option value="pending">En attente</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  className="btn-primary flex-1"
                  onClick={() => mutation.mutate({ regId: selected.id, data: { weigh_in_weight_kg: parseFloat(weight) || null, weigh_in_status: status } })}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Enregistrement…' : 'Valider'}
                </button>
                <button className="btn-secondary" onClick={() => setSelected(null)}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
