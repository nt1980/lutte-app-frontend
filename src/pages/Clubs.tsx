import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building2, X, Trash2, Edit2 } from 'lucide-react';
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
  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [form,       setForm]       = useState({ fflda_number: '', short_name: '', name: '', city: '', regional_committee: '', coach_name: '' });

  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs', search],
    queryFn: () => api.get('/api/clubs', { params: { search } }).then(r => r.data),
  });

  const create = useMutation({
    mutationFn: (data: any) => editingId ? api.put(`/api/clubs/${editingId}`, data) : api.post('/api/clubs', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clubs'] });
      toast.success(editingId ? 'Club modifié' : 'Club créé');
      setModal(false);
      setEditingId(null);
      setForm({ fflda_number: '', short_name: '', name: '', city: '', regional_committee: '', coach_name: '' });
    },
    onError: () => toast.error('Erreur'),
  });

  const deleteClub = useMutation({
    mutationFn: (clubId: string) => api.delete(`/api/clubs/${clubId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clubs'] });
      toast.success('Club supprimé');
    },
    onError: () => toast.error('Erreur'),
  });

  const deleteAllClubs = useMutation({
    mutationFn: () => api.delete('/api/clubs'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clubs'] });
      toast.success('Tous les clubs supprimés');
    },
    onError: () => toast.error('Erreur'),
  });

  const handleEdit = (club: any) => {
    setEditingId(club.id);
    setForm({
      fflda_number: club.fflda_number || '',
      short_name: club.short_name || '',
      name: club.name || '',
      city: club.city || '',
      regional_committee: club.regional_committee || '',
      coach_name: club.coach_name || '',
    });
    setModal(true);
  };

  const handleDeleteClub = (clubId: string) => {
    if (confirm('⚠️ Supprimer ce club ?')) {
      deleteClub.mutate(clubId);
    }
  };

  const handleDeleteAll = () => {
    if (confirm('⚠️ Êtes-vous sûr ? Cette action est irréversible.')) {
      deleteAllClubs.mutate();
    }
  };

  const handleCloseModal = () => {
    setModal(false);
    setEditingId(null);
    setForm({ fflda_number: '', short_name: '', name: '', city: '', regional_committee: '', coach_name: '' });
  };

  const f = (key: string) => ({ value: (form as any)[key], onChange: (e: any) => setForm(p => ({ ...p, [key]: e.target.value })) });

  return (
    <Layout>
      <PageHeader
        title="Clubs"
        subtitle={`${clubs.length} clubs`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => { setEditingId(null); setForm({ fflda_number: '', short_name: '', name: '', city: '', regional_committee: '', coach_name: '' }); setModal(true); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#10b981', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
              <Plus size={14} /> Ajouter
            </button>
            {clubs.length > 0 && (
              <button onClick={handleDeleteAll} disabled={deleteAllClubs.isPending} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ef4444', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: deleteAllClubs.isPending ? 'not-allowed' : 'pointer', opacity: deleteAllClubs.isPending ? 0.5 : 1, boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
                <Trash2 size={14} /> {deleteAllClubs.isPending ? 'Suppression…' : 'Tout effacer'}
              </button>
            )}
          </div>
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
              <tr>{['Club', 'N° FFLDA', 'Ville', 'Comité', 'Coach', 'Actions'].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
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
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button onClick={() => handleEdit(c)} style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa', padding: '4px 8px', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <Edit2 size={12} /> Éditer
                      </button>
                      <button onClick={() => handleDeleteClub(c.id)} disabled={deleteClub.isPending} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '4px 8px', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, opacity: deleteClub.isPending ? 0.5 : 1 }}>
                        <Trash2 size={12} /> Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clubs.length === 0 && (
                <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', padding: '48px 16px', color: '#4b5563' }}>Aucun club</td></tr>
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
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>{editingId ? 'Modifier le club' : 'Nouveau club'}</div>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}><X size={18} /></button>
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
                <button onClick={handleCloseModal} style={{ padding: '8px 16px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Annuler</button>
                <button
                  onClick={() => create.mutate(form)}
                  disabled={!form.short_name || !form.name || create.isPending}
                  style={{ padding: '8px 18px', borderRadius: 9, background: form.short_name && form.name ? (editingId ? '#3b82f6' : '#10b981') : (editingId ? '#1e40af' : '#065f46'), color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: form.short_name && form.name ? 'pointer' : 'not-allowed' }}
                >
                  {create.isPending ? (editingId ? 'Modification…' : 'Création…') : (editingId ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
