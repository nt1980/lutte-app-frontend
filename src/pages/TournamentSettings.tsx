import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function TournamentSettings() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: t } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.get(`/api/tournaments/${id}`).then(r => r.data),
  });

  const [form, setForm] = useState<any>({});
  useEffect(() => { if (t) setForm(t); }, [t]);

  const update = useMutation({
    mutationFn: (data: any) => api.put(`/api/tournaments/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tournament', id] }); toast.success('Paramètres sauvegardés'); },
    onError: () => toast.error('Erreur'),
  });

  const f = (key: string) => ({
    value: form[key] ?? '',
    onChange: (e: any) => setForm((p: any) => ({ ...p, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })),
  });

  const toggle = (key: string) => ({
    checked: !!form[key],
    onChange: (e: any) => setForm((p: any) => ({ ...p, [key]: e.target.checked })),
  });

  return (
    <Layout tournamentId={id}>
      <PageHeader title="Paramètres du tournoi" />
      <div className="p-6 max-w-2xl space-y-6">
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Informations générales</h3>
          <div><label className="label">Nom du tournoi</label><input className="input" {...f('name')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date</label><input type="date" className="input" {...f('event_date')} /></div>
            <div><label className="label">Ville</label><input className="input" {...f('city')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Statut</label>
              <select className="select" {...f('status')}>
                <option value="draft">Brouillon</option>
                <option value="registrations_open">Inscriptions ouvertes</option>
                <option value="weigh_in">Pesée</option>
                <option value="running">En cours</option>
                <option value="finished">Terminé</option>
              </select>
            </div>
            <div>
              <label className="label">Mode repêchage</label>
              <select className="select" {...f('repechage_mode')}>
                <option value="official_uww">Officiel UWW/FFLDA (2 bronzes)</option>
                <option value="simplified_bronze">Simplifié (petite finale)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <h3 className="font-semibold text-white">Visibilité publique</h3>
          {[
            { key: 'public_page_enabled', label: 'Page publique activée' },
            { key: 'public_program_enabled', label: 'Programme visible' },
            { key: 'public_results_enabled', label: 'Résultats visibles' },
            { key: 'public_live_matches_enabled', label: 'Combats live visibles' },
            { key: 'public_rankings_enabled', label: 'Classements visibles' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-red-600" {...toggle(key)} />
              <span className="text-sm text-gray-300">{label}</span>
            </label>
          ))}
        </div>

        <button className="btn-primary btn-lg" onClick={() => update.mutate(form)} disabled={update.isPending}>
          {update.isPending ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>
    </Layout>
  );
}
