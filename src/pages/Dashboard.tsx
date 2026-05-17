import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trophy, Plus, Calendar, MapPin, ChevronRight } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';

const statusLabel: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Brouillon', cls: 'badge-gray' },
  registrations_open: { label: 'Inscriptions', cls: 'badge-blue' },
  weigh_in: { label: 'Pesée', cls: 'badge-yellow' },
  running: { label: 'En cours', cls: 'badge-green' },
  finished: { label: 'Terminé', cls: 'badge-gray' },
};

export default function Dashboard() {
  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => api.get('/api/tournaments').then(r => r.data),
  });

  return (
    <Layout>
      <PageHeader
        title="Tableau de bord"
        subtitle="Gestion des tournois FFLDA / UWW"
        actions={
          <Link to="/tournaments/new" className="btn-primary">
            <Plus size={16} /> Nouveau tournoi
          </Link>
        }
      />
      <div className="p-6">
        <div className="grid gap-4">
          {tournaments.length === 0 && (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Trophy size={40} className="text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium">Aucun tournoi pour l'instant</p>
              <p className="text-gray-600 text-sm mt-1">Créez votre premier tournoi pour commencer</p>
              <Link to="/tournaments/new" className="btn-primary mt-4"><Plus size={16} /> Créer un tournoi</Link>
            </div>
          )}
          {tournaments.map((t: any) => {
            const s = statusLabel[t.status] || statusLabel.draft;
            return (
              <Link key={t.id} to={`/t/${t.id}`} className="card hover:border-red-600/40 transition-all group flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
                  <Trophy size={22} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{t.name}</span>
                    <span className={s.cls}>{s.label}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={11} />{new Date(t.event_date).toLocaleDateString('fr-FR')}</span>
                    <span className="flex items-center gap-1"><MapPin size={11} />{t.city}</span>
                    {t.organizer_club_name && <span>{t.organizer_club_short || t.organizer_club_name}</span>}
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
