import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Save, Globe, Settings2, Eye } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function TournamentSettings() {
  const { id } = useParams<{ id: string }>();
  const qc     = useQueryClient();

  const { data: t } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.get(`/api/tournaments/${id}`).then(r => r.data),
  });

  const [form, setForm] = useState<any>({});
  useEffect(() => { if (t) setForm(t); }, [t]);

  const update = useMutation({
    mutationFn: (data: any) => api.put(`/api/tournaments/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournament', id] });
      toast.success('Paramètres sauvegardés');
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  const f = (key: string) => ({
    value: form[key] ?? '',
    onChange: (e: any) => setForm((p: any) => ({
      ...p, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    })),
  });

  const toggle = (key: string) => ({
    checked: !!form[key],
    onChange: (e: any) => setForm((p: any) => ({ ...p, [key]: e.target.checked })),
  });

  const publicToggles = [
    { key: 'public_page_enabled',          label: 'Page publique',          desc: 'Activer la page /tournoi/slug' },
    { key: 'public_program_enabled',       label: 'Programme',              desc: 'Afficher le programme des combats' },
    { key: 'public_results_enabled',       label: 'Résultats',              desc: 'Afficher les résultats en direct' },
    { key: 'public_live_matches_enabled',  label: 'Combats live',           desc: 'Liens vers les tapis en direct' },
    { key: 'public_rankings_enabled',      label: 'Classements',            desc: 'Afficher les classements finals' },
  ];

  return (
    <Layout tournamentId={id}>
      <PageHeader title="Paramètres" subtitle="Configuration du tournoi" />

      <div className="p-6 max-w-xl space-y-5 animate-fade-in">

        {/* General info */}
        <section className="bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.06]">
            <Settings2 size={15} className="text-gray-500" />
            <span className="font-bold text-white text-sm">Informations générales</span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="label">Nom du tournoi</label>
              <input className="input" {...f('name')} placeholder="Ex: Tournoi Régional U15" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date de l'événement</label>
                <input type="date" className="input" {...f('event_date')} />
              </div>
              <div>
                <label className="label">Ville</label>
                <input className="input" {...f('city')} placeholder="Paris" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Statut</label>
                <select className="select" {...f('status')}>
                  <option value="draft">Brouillon</option>
                  <option value="registrations_open">Inscriptions ouvertes</option>
                  <option value="weigh_in">Pesée en cours</option>
                  <option value="running">En cours</option>
                  <option value="finished">Terminé</option>
                </select>
              </div>
              <div>
                <label className="label">Mode repêchage</label>
                <select className="select" {...f('repechage_mode')}>
                  <option value="official_uww">Officiel UWW (2 bronzes)</option>
                  <option value="simplified_bronze">Petite finale unique</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Public visibility */}
        <section className="bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.06]">
            <Globe size={15} className="text-gray-500" />
            <span className="font-bold text-white text-sm">Visibilité publique</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {publicToggles.map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                <div>
                  <div className="text-sm font-medium text-gray-200">{label}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{desc}</div>
                </div>
                <div className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${form[key] ? 'bg-red-600' : 'bg-white/10'}`}
                  style={{ height: 22, width: 40 }}>
                  <input type="checkbox" className="sr-only" {...toggle(key)} />
                  <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200 ${form[key] ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
                    style={{ width: 18, height: 18 }} />
                </div>
              </label>
            ))}
          </div>

          {form.slug && form.public_page_enabled && (
            <div className="px-5 py-4 border-t border-white/[0.04]">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Eye size={12} />
                <span>Page publique :</span>
                <a
                  href={`/tournoi/${form.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono underline underline-offset-2"
                >
                  /tournoi/{form.slug}
                </a>
              </div>
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <button
            className="btn-primary btn-lg"
            onClick={() => update.mutate(form)}
            disabled={update.isPending}
          >
            {update.isPending ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Sauvegarde…
              </>
            ) : (
              <><Save size={15} /> Sauvegarder</>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}
