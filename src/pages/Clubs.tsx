import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Clubs() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ fflda_number: '', short_name: '', name: '', city: '', regional_committee: '', coach_name: '' });

  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs', search],
    queryFn: () => api.get('/api/clubs', { params: { search } }).then(r => r.data),
  });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/api/clubs', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clubs'] }); toast.success('Club créé'); setModal(false); setForm({ fflda_number: '', short_name: '', name: '', city: '', regional_committee: '', coach_name: '' }); },
    onError: () => toast.error('Erreur'),
  });

  const f = (key: string) => ({ value: (form as any)[key], onChange: (e: any) => setForm(p => ({ ...p, [key]: e.target.value })) });

  return (
    <Layout>
      <PageHeader title="Clubs" subtitle={`${clubs.length} clubs`} actions={<button className="btn-primary" onClick={() => setModal(true)}><Plus size={16} />Ajouter un club</button>} />
      <div className="p-6 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9" placeholder="Rechercher un club…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="card p-0 overflow-hidden">
          <table className="table-dark w-full">
            <thead><tr><th>Club</th><th>N° FFLDA</th><th>Ville</th><th>Comité</th><th>Coach</th></tr></thead>
            <tbody>
              {clubs.map((c: any) => (
                <tr key={c.id}>
                  <td><div className="font-semibold">{c.name}</div><div className="text-xs text-gray-500">{c.short_name}</div></td>
                  <td className="font-mono text-xs text-gray-400">{c.fflda_number || '—'}</td>
                  <td className="text-gray-400">{c.city || '—'}</td>
                  <td className="text-gray-400 text-xs">{c.regional_committee || '—'}</td>
                  <td className="text-gray-400">{c.coach_name || '—'}</td>
                </tr>
              ))}
              {clubs.length === 0 && <tr><td colSpan={5} className="text-center text-gray-500 py-8">Aucun club</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Nouveau club</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">N° FFLDA</label><input className="input" {...f('fflda_number')} /></div>
              <div><label className="label">Sigle *</label><input className="input" {...f('short_name')} /></div>
            </div>
            <div><label className="label">Nom complet *</label><input className="input" {...f('name')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Ville</label><input className="input" {...f('city')} /></div>
              <div><label className="label">Comité régional</label><input className="input" {...f('regional_committee')} /></div>
            </div>
            <div><label className="label">Coach</label><input className="input" {...f('coach_name')} /></div>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={() => create.mutate(form)} disabled={!form.short_name || !form.name || create.isPending}>
                {create.isPending ? 'Création…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
