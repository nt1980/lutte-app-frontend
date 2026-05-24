import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Trophy, Calendar, MapPin, Building2, Layers, ArrowLeft } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

import React from 'react';

const LABEL: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 };
const INPUT: React.CSSProperties = { width: '100%', background: 'var(--inp)', border: '1px solid var(--b3)', borderRadius: 10, padding: '9px 12px 9px 38px', fontSize: 13, color: 'var(--fg)', outline: 'none' };

function FieldIcon({ icon: Icon }: { icon: any }) {
  return <Icon size={14} color="var(--faint)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />;
}

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

  const canSubmit = form.name && form.event_date && form.city && !create.isPending;

  return (
    <Layout>
      <PageHeader
        title="Nouveau tournoi"
        subtitle="Créer un tournoi FFLDA / UWW"
        actions={
          <button onClick={() => navigate('/dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'var(--inp)', border: '1px solid var(--b3)', color: 'var(--fg2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <ArrowLeft size={14} color="var(--faint)" /> Retour
          </button>
        }
      />

      <div style={{ padding: '28px 24px' }}>
        <div style={{ maxWidth: 520 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 18, overflow: 'hidden' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', borderBottom: '1px solid var(--b2)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={18} color="#dc2626" strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--fg)', fontSize: 15 }}>Informations du tournoi</div>
                <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 2 }}>Les champs marqués * sont obligatoires</div>
              </div>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              <div>
                <label style={LABEL}>Nom du tournoi *</label>
                <div style={{ position: 'relative' }}>
                  <FieldIcon icon={Trophy} />
                  <input style={INPUT} placeholder="Championnat AURA U15 2026" {...f('name')} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LABEL}>Date *</label>
                  <div style={{ position: 'relative' }}>
                    <FieldIcon icon={Calendar} />
                    <input type="date" style={INPUT} {...f('event_date')} />
                  </div>
                </div>
                <div>
                  <label style={LABEL}>Ville *</label>
                  <div style={{ position: 'relative' }}>
                    <FieldIcon icon={MapPin} />
                    <input style={INPUT} placeholder="Lyon" {...f('city')} />
                  </div>
                </div>
              </div>

              <div>
                <label style={LABEL}>Club organisateur</label>
                <div style={{ position: 'relative' }}>
                  <FieldIcon icon={Building2} />
                  <select style={{ ...INPUT, appearance: 'none', cursor: 'pointer' }} {...f('organizer_club_id')}>
                    <option value="">— Sélectionner un club —</option>
                    {clubs.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.short_name})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={LABEL}>Nombre de tapis</label>
                <div style={{ position: 'relative' }}>
                  <FieldIcon icon={Layers} />
                  <input type="number" style={INPUT} min={1} max={16} {...f('number_of_mats')} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--dim)', marginTop: 6 }}>Les tapis seront nommés automatiquement (A, B, C…)</p>
              </div>

              {form.number_of_mats > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Array.from({ length: Math.min(form.number_of_mats, 16) }, (_, i) => (
                    <span key={i} style={{ background: 'var(--inp)', border: '1px solid var(--b3)', borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: 'var(--fg3)' }}>
                      Tapis {String.fromCharCode(65 + i)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, padding: '0 24px 24px' }}>
              <button onClick={() => navigate('/dashboard')} style={{ padding: '9px 18px', borderRadius: 9, background: 'var(--inp)', border: '1px solid var(--b3)', color: 'var(--fg2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                onClick={() => create.mutate(form)}
                disabled={!canSubmit}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 18px', borderRadius: 9, background: canSubmit ? '#dc2626' : '#7f1d1d', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed', boxShadow: canSubmit ? '0 4px 16px rgba(220,38,38,0.3)' : 'none' }}
              >
                {create.isPending ? 'Création en cours…' : <><Trophy size={14} /> Créer le tournoi</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
