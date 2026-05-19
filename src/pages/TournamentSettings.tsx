import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Save, Globe, Settings2, Eye } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const LABEL: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 };
const INPUT: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#fff', outline: 'none' };
const SELECT: React.CSSProperties = { ...{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#fff', outline: 'none', appearance: 'none' as const, cursor: 'pointer' } };

import React from 'react';

const publicToggles = [
  { key: 'public_page_enabled',         label: 'Page publique',        desc: 'Activer la page /tournoi/slug'         },
  { key: 'public_program_enabled',      label: 'Programme',            desc: 'Afficher le programme des combats'     },
  { key: 'public_results_enabled',      label: 'Résultats',            desc: 'Afficher les résultats en direct'      },
  { key: 'public_live_matches_enabled', label: 'Combats live',         desc: 'Liens vers les tapis en direct'        },
  { key: 'public_rankings_enabled',     label: 'Classements',          desc: 'Afficher les classements finals'       },
];

export default function TournamentSettings() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: t } = useQuery({ queryKey: ['tournament', id], queryFn: () => api.get(`/api/tournaments/${id}`).then(r => r.data) });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (t) setForm(t); }, [t]);

  const update = useMutation({
    mutationFn: (data: any) => api.put(`/api/tournaments/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tournament', id] }); toast.success('Paramètres sauvegardés'); },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  const f = (key: string) => ({ value: form[key] ?? '', onChange: (e: any) => setForm((p: any) => ({ ...p, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })) });
  const toggle = (key: string) => ({ checked: !!form[key], onChange: (e: any) => setForm((p: any) => ({ ...p, [key]: e.target.checked })) });

  return (
    <Layout tournamentId={id}>
      <PageHeader title="Paramètres" subtitle="Configuration du tournoi" />

      <div style={{ padding: '24px', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* General info */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Settings2 size={15} color="#4b5563" />
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Informations générales</span>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={LABEL}>Nom du tournoi</label>
              <input style={INPUT} {...f('name')} placeholder="Ex: Tournoi Régional U15" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL}>Date de l'événement</label>
                <input type="date" style={INPUT} {...f('event_date')} />
              </div>
              <div>
                <label style={LABEL}>Ville</label>
                <input style={INPUT} {...f('city')} placeholder="Paris" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL}>Statut</label>
                <select style={SELECT} {...f('status')}>
                  <option value="draft">Brouillon</option>
                  <option value="registrations_open">Inscriptions ouvertes</option>
                  <option value="weigh_in">Pesée en cours</option>
                  <option value="running">En cours</option>
                  <option value="finished">Terminé</option>
                </select>
              </div>
              <div>
                <label style={LABEL}>Mode repêchage</label>
                <select style={SELECT} {...f('repechage_mode')}>
                  <option value="official_uww">Officiel UWW (2 bronzes)</option>
                  <option value="simplified_bronze">Petite finale unique</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Public visibility */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Globe size={15} color="#4b5563" />
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Visibilité publique</span>
          </div>

          {publicToggles.map(({ key, label, desc }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#e5e7eb' }}>{label}</div>
                <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{desc}</div>
              </div>
              <div style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, background: form[key] ? '#dc2626' : 'rgba(255,255,255,0.1)', transition: 'background 0.2s ease', flexShrink: 0 }}>
                <input type="checkbox" style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} {...toggle(key)} />
                <div style={{ position: 'absolute', top: 2, left: form[key] ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'left 0.2s ease' }} />
              </div>
            </label>
          ))}

          {form.slug && form.public_page_enabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#4b5563' }}>
              <Eye size={12} />
              <span>Page publique :</span>
              <a href={`/tournoi/${form.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontFamily: 'monospace', textDecoration: 'underline' }}>
                /tournoi/{form.slug}
              </a>
            </div>
          )}
        </div>

        {/* Save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => update.mutate(form)}
            disabled={update.isPending}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#dc2626', color: '#fff', padding: '10px 22px', borderRadius: 9, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.3)' }}
          >
            <Save size={15} /> {update.isPending ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
