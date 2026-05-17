import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function TournamentNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', event_date: '', city: '', organizer_club_id: '', number_of_mats: 2 });

  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => api.get('/api/clubs').then(r => r.data),
  });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/api/tournaments', data),
    onSuccess: (r) => { toast.success('Tournoi créé !'); navigate(`/t/${r.data.id}`); },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const f = (key: string) => ({
    value: (form as any)[key],
    onChange: (e: any) => setForm(p => ({ ...p, [key]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value })),
  });

  return (
    <Layout>
      <PageHeader title="Nouveau tournoi" subtitle="Créer un tournoi FFLDA / UWW" />
      <div className="p-6 max-w-lg">
        <div className="card space-y-4">
          <div><label className="label">Nom du tournoi *</label><input className="input" placeholder="Championnat AURA U15 2026" {...f('name')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date *</label><input type="date" className="input" {...f('event_date')} /></div>
            <div><label className="label">Ville *</label><input className="input" placeholder="Lyon" {...f('city')} /></div>
          </div>
          <div>
            <label className="label">Club organisateur</label>
            <select className="select" {...f('organizer_club_id')}>
              <option value="">— Sélectionner un club —</option>
              {clubs.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.short_name})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Nombre de tapis</label>
            <input type="number" className="input" min={1} max={16} {...f('number_of_mats')} />
            <p className="text-xs text-gray-500 mt-1">Les tapis seront créés automatiquement (A, B, C…)</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Annuler</button>
            <button
              className="btn-primary flex-1"
              onClick={() => create.mutate(form)}
              disabled={!form.name || !form.event_date || !form.city || create.isPending}
            >
              {create.isPending ? 'Création…' : 'Créer le tournoi'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
