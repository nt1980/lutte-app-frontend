import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Search, X, Scale } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const statusInfo: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'En attente',     cls: 'badge-gray'   },
  done:       { label: 'Pesé',           cls: 'badge-green'  },
  overweight: { label: 'Hors catégorie', cls: 'badge-red'    },
  no_show:    { label: 'Absent',         cls: 'badge-yellow' },
};

export default function WeighIn() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [weight,   setWeight]   = useState('');
  const [status,   setStatus]   = useState('done');
  const [filter,   setFilter]   = useState<string>('all');

  const { data: regs = [] } = useQuery({
    queryKey: ['registrations', id],
    queryFn: () => api.get(`/api/tournaments/${id}/registrations`).then(r => r.data),
    refetchInterval: 5000,
  });

  const mutation = useMutation({
    mutationFn: ({ regId, data }: any) =>
      api.put(`/api/tournaments/${id}/registrations/${regId}/weigh-in`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registrations', id] });
      toast.success('Pesée enregistrée');
      setSelected(null);
      setWeight('');
      setStatus('done');
    },
    onError: () => toast.error('Erreur lors de la pesée'),
  });

  const pending    = regs.filter((r: any) => r.weigh_in_status === 'pending').length;
  const done       = regs.filter((r: any) => r.weigh_in_status === 'done').length;
  const overweight = regs.filter((r: any) => r.weigh_in_status === 'overweight').length;
  const noShow     = regs.filter((r: any) => r.weigh_in_status === 'no_show').length;
  const progress   = regs.length > 0 ? Math.round(((done + overweight + noShow) / regs.length) * 100) : 0;

  const filtered = regs.filter((r: any) => {
    const matchSearch = !search ||
      `${r.last_name} ${r.first_name} ${r.license_number}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || r.weigh_in_status === filter;
    return matchSearch && matchFilter;
  });

  const openSelected = (reg: any) => {
    setSelected(reg);
    setWeight(reg.weigh_in_weight_kg || '');
    setStatus(reg.weigh_in_status === 'pending' ? 'done' : (reg.weigh_in_status || 'done'));
  };

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Pesée"
        subtitle={`${done} / ${regs.length} validés · ${pending} en attente`}
      />

      <div className="p-6 space-y-4 animate-fade-in">
        {/* Progress */}
        <div className="bg-[#141414] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-3 text-xs">
              <span className="badge-green">Pesés: {done}</span>
              <span className="badge-gray">Attente: {pending}</span>
              {overweight > 0 && <span className="badge-red">Hors cat.: {overweight}</span>}
              {noShow > 0 && <span className="badge-yellow">Absents: {noShow}</span>}
            </div>
            <span className="text-sm font-black text-white">{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex gap-5">
          {/* List */}
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  className="input pl-10"
                  placeholder="Nom, prénom, numéro de licence…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <select className="select w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="all">Tous</option>
                <option value="pending">En attente</option>
                <option value="done">Pesés</option>
                <option value="overweight">Hors cat.</option>
                <option value="no_show">Absents</option>
              </select>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <Scale size={28} className="text-gray-700 mb-3" />
                  <div className="text-gray-500">Aucun résultat</div>
                </div>
              )}
              {filtered.map((reg: any) => {
                const s = statusInfo[reg.weigh_in_status] || statusInfo.pending;
                const isSelected = selected?.id === reg.id;
                return (
                  <button
                    key={reg.id}
                    onClick={() => openSelected(reg)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150
                      ${isSelected
                        ? 'bg-red-600/10 border-red-600/40'
                        : 'bg-[#141414] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#1a1a1a]'
                      }`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      reg.weigh_in_status === 'done' ? 'bg-emerald-500' :
                      reg.weigh_in_status === 'overweight' ? 'bg-red-500' :
                      reg.weigh_in_status === 'no_show' ? 'bg-amber-500' :
                      'bg-gray-600'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">
                        {reg.last_name} <span className="font-medium">{reg.first_name}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono">{reg.license_number}</span>
                        {reg.club_short || reg.club_name ? <><span>·</span><span>{reg.club_short || reg.club_name}</span></> : null}
                        {reg.final_age_category ? <><span>·</span><span className="text-gray-400">{reg.final_age_category}</span></> : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {reg.weigh_in_weight_kg && (
                        <span className="text-sm font-bold text-white tabular-nums">{reg.weigh_in_weight_kg} kg</span>
                      )}
                      <span className={s.cls}>{s.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weigh-in panel */}
          {selected ? (
            <div className="w-72 shrink-0">
              <div className="bg-[#141414] border border-white/[0.06] rounded-2xl p-5 sticky top-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-black text-white">{selected.last_name} {selected.first_name}</div>
                    <div className="text-xs text-gray-500 mt-1 font-mono">{selected.license_number}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{selected.club_name}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="btn-ghost btn-sm">
                    <X size={14} />
                  </button>
                </div>

                {selected.default_weight_kg && (
                  <div className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3 py-2.5 text-sm">
                    <span className="text-gray-500">Poids licence</span>
                    <span className="font-bold text-white">{selected.default_weight_kg} kg</span>
                  </div>
                )}

                <div>
                  <label className="label">Poids relevé (kg)</label>
                  <input
                    type="number" step="0.1" min="0" max="200"
                    className="input text-3xl font-black text-center tracking-tight py-4"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="0.0"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label">Statut</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { v: 'done',       l: '✓ Pesé',          cls: 'border-emerald-600/40 bg-emerald-600/10 text-emerald-400' },
                      { v: 'overweight', l: '↑ Hors cat.',      cls: 'border-red-600/40 bg-red-600/10 text-red-400' },
                      { v: 'no_show',    l: '— Absent',         cls: 'border-amber-600/40 bg-amber-600/10 text-amber-400' },
                      { v: 'pending',    l: '⏳ Attente',        cls: 'border-white/10 bg-white/5 text-gray-400' },
                    ].map(({ v, l, cls }) => (
                      <button
                        key={v}
                        onClick={() => setStatus(v)}
                        className={`text-xs font-semibold py-2.5 rounded-xl border transition-all ${
                          status === v ? cls : 'border-white/[0.06] text-gray-600 hover:text-gray-400'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    className="btn-primary flex-1"
                    onClick={() => mutation.mutate({
                      regId: selected.id,
                      data: { weigh_in_weight_kg: parseFloat(weight) || null, weigh_in_status: status },
                    })}
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? 'Enregistrement…' : 'Valider la pesée'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-72 shrink-0 flex items-center justify-center py-16">
              <div className="text-center text-gray-700">
                <Scale size={32} className="mx-auto mb-3" />
                <div className="text-sm">Sélectionner un combattant</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
