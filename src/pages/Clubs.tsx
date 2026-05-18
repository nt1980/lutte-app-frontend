import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building2, X } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const TH: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const TD: React.CSSProperties = { padding: '11px 16px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' };

const LABEL: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 };
const INPUT: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none' };

import React from 'react';

export default function Clubs() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState({ fflda_number: '', short_name: '', name: '', city: '', regional_committee: '', coach_name: '' });

  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs', search],
    queryFn: () => api.get('/api/clubs', { params: { search } }).then(r => r.data),
  });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/api/clubs', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clubs'] });
      toast.success('Club créé');
      setModal(false);
      setForm({ fflda_number: '', short_name: '', name: '', city: '', regional_committee: '', coach_name: '' });
    },
    onError: () => toast.error('Erreur'),
  });

  const f = (key: string) => ({ value: (form as any)[key], onChange: (e: any) => setForm(p => ({ ...p, [key]: e.target.value })) });

  return (
    <Layout>
      <PageHeader
        title="Clubs"
        subtitle={`${clubs.length} clubs`}
        actions={
          <button onClick={() => setModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
            <Plus size={14} /> Ajouter un club
          </button>
        }
      />

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 340 }}>
          <Search size={14} color="#4b5563" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 36px', fontSize: 13, color: '#fff', outline: 'none' }}
            placeholder="Rechercher un club…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Club', 'N° FFLDA', 'Ville', 'Comité', 'Coach'].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {clubs.map((c: any) => (
                <tr key={c.id}>
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={14} color="#f87171" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#4b5563', marginTop: 1 }}>{c.short_name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={TD}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 5 }}>{c.fflda_number || '—'}</span></td>
                  <td style={{ ...TD, color: '#6b7280' }}>{c.city || '—'}</td>
                  <td style={{ ...TD, color: '#4b5563', fontSize: 12 }}>{c.regional_committee || '—'}</td>
                  <td style={{ ...TD, color: '#6b7280' }}>{c.coach_name || '—'}</td>
                </tr>
              ))}
              {clubs.length === 0 && (
                <tr><td colSpan={5} style={{ ...TD, textAlign: 'center', padding: '48px 16px', color: '#4b5563' }}>Aucun club</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 40px 120px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>Nouveau club</div>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={LABEL}>N° FFLDA</label><input style={INPUT} {...f('fflda_number')} /></div>
                <div><label style={LABEL}>Sigle *</label><input style={INPUT} {...f('short_name')} /></div>
              </div>
              <div><label style={LABEL}>Nom complet *</label><input style={INPUT} {...f('name')} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={LABEL}>Ville</label><input style={INPUT} {...f('city')} /></div>
                <div><label style={LABEL}>Comité régional</label><input style={INPUT} {...f('regional_committee')} /></div>
              </div>
              <div><label style={LABEL}>Coach</label><input style={INPUT} {...f('coach_name')} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button onClick={() => setModal(false)} style={{ padding: '8px 16px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Annuler</button>
                <button
                  onClick={() => create.mutate(form)}
                  disabled={!form.short_name || !form.name || create.isPending}
                  style={{ padding: '8px 18px', borderRadius: 9, background: form.short_name && form.name ? '#dc2626' : '#7f1d1d', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: form.short_name && form.name ? 'pointer' : 'not-allowed' }}
                >
                  {create.isPending ? 'Création…' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
