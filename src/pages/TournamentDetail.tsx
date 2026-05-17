import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Users, Grid3X3, Swords, CheckCircle, Activity, Scale, Trophy } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: tournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.get(`/api/tournaments/${id}`).then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['tournament-stats', id],
    queryFn: () => api.get(`/api/tournaments/${id}/dashboard`).then(r => r.data),
    enabled: !!id,
  });

  if (!tournament) return <Layout tournamentId={id}><div className="p-6 text-gray-500">Chargement…</div></Layout>;

  const statCards = [
    { label: 'Combattants', value: stats?.athletes ?? 0, icon: Users, color: 'text-blue-400' },
    { label: 'Clubs', value: stats?.clubs ?? 0, icon: Trophy, color: 'text-yellow-400' },
    { label: 'Compétitions', value: stats?.competitions ?? 0, icon: Grid3X3, color: 'text-purple-400' },
    { label: 'Combats terminés', value: stats ? `${stats.matches_done}/${stats.matches_total}` : '—', icon: CheckCircle, color: 'text-green-400' },
  ];

  const progress = stats?.matches_total > 0 ? Math.round((stats.matches_done / stats.matches_total) * 100) : 0;

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title={tournament.name}
        subtitle={`${new Date(tournament.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} • ${tournament.city}`}
        actions={
          <Link to={`/t/${id}/settings`} className="btn-secondary">Paramètres</Link>
        }
      />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <div className="flex items-center justify-between">
                <span className="stat-label">{label}</span>
                <Icon size={18} className={color} />
              </div>
              <span className="stat-value">{value}</span>
            </div>
          ))}
        </div>

        {/* Progression */}
        {stats?.matches_total > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white">Progression du tournoi</span>
              <span className="text-sm font-bold text-red-400">{progress}%</span>
            </div>
            <div className="h-2 bg-[#2E2E2E] rounded-full overflow-hidden">
              <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{stats.matches_done} combats terminés</span>
              <span>{stats.matches_total - stats.matches_done} restants</span>
            </div>
          </div>
        )}

        {/* Raccourcis */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { to: `/t/${id}/registrations`, label: 'Gérer les inscriptions', icon: Users, desc: 'Importer, ajouter des combattants' },
            { to: `/t/${id}/weigh-in`, label: 'Pesée', icon: Scale, desc: 'Interface de pesée rapide' },
            { to: `/t/${id}/competitions`, label: 'Générer compétitions', icon: Grid3X3, desc: 'Créer les poules et tableaux' },
            { to: `/t/${id}/brackets`, label: 'Tableaux & Repêchages', icon: Swords, desc: 'Visualiser et gérer les matchs' },
            { to: `/t/${id}/mats`, label: 'Gestion des tapis', icon: Activity, desc: 'Affecter les combats aux tapis' },
          ].map(({ to, label, icon: Icon, desc }) => (
            <Link key={to} to={to} className="card hover:border-red-600/40 transition-all group">
              <Icon size={20} className="text-red-500 mb-2" />
              <div className="text-sm font-semibold text-white group-hover:text-red-300 transition-colors">{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
