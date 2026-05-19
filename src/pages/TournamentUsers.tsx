import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { UserPlus, Trash2, Users, X } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

import React from 'react';

const ROLES = [
  { value: 'tournament_admin',  label: 'Admin tournoi',      color: '#f87171', bg: 'rgba(248,113,113,0.1)'  },
  { value: 'mat_manager',       label: 'Responsable tapis',  color: '#c084fc', bg: 'rgba(192,132,252,0.1)'  },
  { value: 'referee',           label: 'Arbitre',            color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'   },
  { value: 'weigh_in_manager',  label: 'Responsable pesée',  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'   },
  { value: 'viewer',            label: 'Lecture seule',      color: '#6b7280', bg: 'rgba(107,114,128,0.1)'  },
];

const LABEL: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 };
const INPUT: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#fff', outline: 'none' };

export default function TournamentUsers() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'referee' });

  const { data: users = [] } = useQuery({ queryKey: ['tournament-users', id], queryFn: () => api.get(`/api/tournaments/${id}/users`).then(r => r.data) });
  const { data: allUsers = [] } = useQuery({ queryKey: ['all-users'], queryFn: () => api.get('/api/users').then(r => r.data).catch(() => []) });

  const createAndAdd = useMutation({
    mutationFn: async (data: any) => {
      const existing = allUsers.find((u: any) => u.email === data.email);
      const userId = existing
        ? existing.id
        : (await api.post('/api/users', { email: data.email, password: data.password, name: data.name })).data.id;
      return api.post(`/api/tournaments/${id}/users`, { user_id: userId, role: data.role });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tournament-users', id] }); qc.invalidateQueries({ queryKey: ['all-users'] }); toast.success('Utilisateur ajouté'); setModal(false); setForm({ email: '', password: '', name: '', role: 'referee' }); },
    onError: () => toast.error('Erreur'),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => api.delete(`/api/tournaments/${id}/users/${userId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tournament-users', id] }); toast.success('Utilisateur retiré'); },
  });

  const f = (key: string) => ({ value: (form as any)[key], onChange: (e: any) => setForm(p => ({ ...p, [key]: e.target.value })) });

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Utilisateurs"
        subtitle="Gérer les accès au tournoi"
        actions={
          <button onClick={() => setModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
            <UserPlus size={14} /> Ajouter
          </button>
        }
      />

      <div style={{ padding: '20px 24px' }}>
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          {users.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', textAlign: 'center' }}>
              <Users size={28} color="#374151" style={{ marginBottom: 10 }} />
              <div style={{ color: '#4b5563', fontSize: 13 }}>Aucun utilisateur</div>
            </div>
          ) : (
            users.map((u: any, i: number) => {
              const role = ROLES.find(r => r.value === u.role) || { label: u.role, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
              const initials = u.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#9ca3af', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{u.email}</div>
                  </div>
                  <span style={{ background: role.bg, color: role.color, borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                    {role.label}
                  </span>
                  <button
                    onClick={() => remove.mutate(u.user_id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', display: 'flex', padding: 4, flexShrink: 0, borderRadius: 6 }}
                  >
                    <Trash2 size={14} color="#6b7280" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 40px 120px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>Ajouter un utilisateur</div>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={LABEL}>Nom complet</label><input style={INPUT} {...f('name')} /></div>
              <div><label style={LABEL}>Email</label><input type="email" style={INPUT} {...f('email')} /></div>
              <div><label style={LABEL}>Mot de passe (si nouveau compte)</label><input type="password" style={INPUT} {...f('password')} /></div>
              <div>
                <label style={LABEL}>Rôle</label>
                <select style={{ ...INPUT, appearance: 'none' as const, cursor: 'pointer' }} {...f('role')}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button onClick={() => setModal(false)} style={{ padding: '8px 16px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Annuler</button>
                <button
                  onClick={() => createAndAdd.mutate(form)}
                  disabled={!form.email || !form.name || createAndAdd.isPending}
                  style={{ padding: '8px 18px', borderRadius: 9, background: form.email && form.name ? '#dc2626' : '#7f1d1d', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: form.email && form.name ? 'pointer' : 'not-allowed' }}
                >
                  {createAndAdd.isPending ? 'Ajout…' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
