import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Trophy, Calendar, MapPin, Building2, Layers, ArrowLeft } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function TournamentNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    event_date: '',
    city: '',
    organizer_club_id: '',
    number_of_mats: 2,
  });

  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => api.get('/api/clubs').then(r => r.data),
  });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/api/tournaments', data),
    onSuccess: (r) => {
      toast.success('Tournoi créé !');
      navigate(`/t/${r.data.id}`);
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const f = (key: string) => ({
    value: (form as any)[key],
    onChange: (e: any) => setForm(p => ({
      ...p,
      [key]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value,
    })),
  });

  const canSubmit = form.name && form.event_date && form.city && !create.isPending;

  return (
    <Layout>
      <PageHeader
        title="Nouveau tournoi"
        subtitle="Créer un tournoi FFLDA / UWW"
        actions={
          <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={15} /> Retour
          </button>
        }
      />

      <div className="p-6 animate-fade-in">
        <div className="max-w-lg">
          <div className="bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden">

            {/* Header */}
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                <Trophy size={18} className="text-red-500" />
              </div>
              <div>
                <div className="font-bold text-white">Informations du tournoi</div>
                <div className="text-xs text-gray-500">Les champs marqués * sont obligatoires</div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="label">Nom du tournoi *</label>
                <div className="relative">
                  <Trophy size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    className="input pl-10"
                    placeholder="Championnat AURA U15 2026"
                    {...f('name')}
                  />
                </div>
              </div>

              {/* Date + City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date *</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input type="date" className="input pl-10" {...f('event_date')} />
                  </div>
                </div>
                <div>
                  <label className="label">Ville *</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input className="input pl-10" placeholder="Lyon" {...f('city')} />
                  </div>
                </div>
              </div>

              {/* Club */}
              <div>
                <label className="label">Club organisateur</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                  <select className="select pl-10" {...f('organizer_club_id')}>
                    <option value="">— Sélectionner un club —</option>
                    {clubs.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.short_name})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mats */}
              <div>
                <label className="label">Nombre de tapis</label>
                <div className="relative">
                  <Layers size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input type="number" className="input pl-10" min={1} max={16} {...f('number_of_mats')} />
                </div>
                <p className="text-xs text-gray-600 mt-1.5">Les tapis seront nommés automatiquement (A, B, C…)</p>
              </div>

              {/* Mats preview */}
              {form.number_of_mats > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: Math.min(form.number_of_mats, 16) }, (_, i) => (
                    <span key={i} className="badge-gray text-xs">
                      Tapis {String.fromCharCode(65 + i)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 pb-6">
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                Annuler
              </button>
              <button
                className="btn-primary flex-1"
                onClick={() => create.mutate(form)}
                disabled={!canSubmit}
              >
                {create.isPending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Création en cours…
                  </>
                ) : (
                  <><Trophy size={15} /> Créer le tournoi</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
