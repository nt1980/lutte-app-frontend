import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { UserPlus, Trash2 } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'tournament_admin', label: 'Admin tournoi' },
  { value: 'mat_manager', label: 'Responsable tapis' },
  { value: 'referee', label: 'Arbitre' },
  { value: 'weigh_in_manager', label: 'Responsable pesée' },
  { value: 'viewer', label: 'Lecture seule' },
];

export default function TournamentUsers() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'referee' });

  const { data: users = [] } = useQuery({
    queryKey: ['tournament-users', id],
    queryFn: () => api.get(`/api/tournaments/${id}/users`).then(r => r.data),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.get('/api/users').then(r => r.data).catch(() => []),
  });

  const createAndAdd = useMutation({
    mutationFn: async (data: any) => {
      let userId;
      const existing = allUsers.find((u: any) => u.email === data.email);
      if (existing) {
        userId = existing.id;
      } else {
        const r = await api.post('/api/users', { email: data.email, password: data.password, name: data.name });
        userId = r.data.id;
      }
      return api.post(`/api/tournaments/${id}/users`, { user_id: userId, role: data.role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournament-users', id] });
      qc.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('Utilisateur ajouté');
      setModal(false);
      setForm({ email: '', password: '', name: '', role: 'referee' });
    },
    onError: () => toast.error('Erreur'),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => api.delete(`/api/tournaments/${id}/users/${userId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tournament-users', id] }); toast.success('Utilisateur retiré'); },
  });

  const f = (key: string) => ({ value: (form as any)[key], onChange: (e: any) => setForm(p => ({ ...p, [key]: e.target.value })) });

  return (
    <Layout tournamentId={id}>
      <PageHeader title="Utilisateurs" subtitle="Gérer les accès au tournoi"
        actions={<button className="btn-primary" onClick={() => setModal(true)}><UserPlus size={16} />Ajouter</button>} />
      <div className="p-6">
        <div className="card p-0 overflow-hidden">
          <table className="table-dark w-full">
            <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th></th></tr></thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={4} className="text-center text-gray-500 py-8">Aucun utilisateur</td></tr>}
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td className="font-semibold">{u.name}</td>
                  <td className="text-gray-400 text-xs">{u.email}</td>
                  <td><span className="badge-blue">{ROLES.find(r => r.value === u.role)?.label || u.role}</span></td>
                  <td>
                    <button onClick={() => remove.mutate(u.user_id)} className="btn-ghost btn-sm text-red-400 hover:text-red-300">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Ajouter un utilisateur</h3>
            <div><label className="label">Nom complet</label><input className="input" {...f('name')} /></div>
            <div><label className="label">Email</label><input type="email" className="input" {...f('email')} /></div>
            <div><label className="label">Mot de passe (si nouveau compte)</label><input type="password" className="input" {...f('password')} /></div>
            <div>
              <label className="label">Rôle</label>
              <select className="select" {...f('role')}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={() => createAndAdd.mutate(form)} disabled={!form.email || !form.name || createAndAdd.isPending}>
                {createAndAdd.isPending ? 'Ajout…' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
