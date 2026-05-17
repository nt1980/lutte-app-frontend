import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trophy, Plus, Calendar, MapPin, ChevronRight, Swords } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';

const statusMap: Record<string, { label: string; dot: string; badge: string }> = {
  draft:              { label: 'Brouillon',    dot: 'bg-gray-500',    badge: 'badge-gray'   },
  registrations_open: { label: 'Inscriptions', dot: 'bg-blue-500',    badge: 'badge-blue'   },
  weigh_in:           { label: 'Pesée',        dot: 'bg-amber-500',   badge: 'badge-yellow' },
  running:            { label: 'En cours',     dot: 'bg-emerald-500', badge: 'badge-green'  },
  finished:           { label: 'Terminé',      dot: 'bg-gray-600',    badge: 'badge-gray'   },
};

export default function Dashboard() {
  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => api.get('/api/tournaments').then(r => r.data),
  });

  const running  = tournaments.filter((t: any) => t.status === 'running');
  const upcoming = tournaments.filter((t: any) => t.status !== 'running' && t.status !== 'finished');
  const past     = tournaments.filter((t: any) => t.status === 'finished');

  return (
    <Layout>
      <PageHeader
        title="Tableau de bord"
        subtitle="Gestion des tournois FFLDA / UWW"
        actions={
          <Link to="/tournaments/new" className="btn-primary">
            <Plus size={15} /> Nouveau tournoi
          </Link>
        }
      />

      <div className="p-6 space-y-8 animate-fade-in">
        {tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center mb-5">
              <Swords size={36} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Aucun tournoi</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs">Créez votre premier tournoi pour commencer à gérer vos compétitions.</p>
            <Link to="/tournaments/new" className="btn-primary btn-lg">
              <Plus size={16} /> Créer un tournoi
            </Link>
          </div>
        ) : (
          <>
            {/* En cours */}
            {running.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="section-title text-emerald-600">En cours</span>
                </div>
                <div className="grid gap-3">
                  {running.map((t: any, i: number) => (
                    <TournamentCard key={t.id} t={t} highlight i={i} />
                  ))}
                </div>
              </section>
            )}

            {/* À venir */}
            {upcoming.length > 0 && (
              <section>
                <div className="section-title mb-4">À venir · {upcoming.length}</div>
                <div className="grid gap-3">
                  {upcoming.map((t: any, i: number) => (
                    <TournamentCard key={t.id} t={t} i={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Passés */}
            {past.length > 0 && (
              <section>
                <div className="section-title mb-4">Terminés · {past.length}</div>
                <div className="grid gap-3 opacity-60">
                  {past.map((t: any, i: number) => (
                    <TournamentCard key={t.id} t={t} i={i} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function TournamentCard({ t, highlight, i }: { t: any; highlight?: boolean; i: number }) {
  const s = statusMap[t.status] || statusMap.draft;

  return (
    <Link
      to={`/t/${t.id}`}
      className="group flex items-center gap-4 bg-[#141414] hover:bg-[#1a1a1a] border border-white/[0.06] hover:border-red-600/25 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40"
      style={{ animationDelay: `${i * 50}ms` }}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
        highlight ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-600/10 border border-red-600/20'
      }`}>
        <Trophy size={20} className={highlight ? 'text-emerald-400' : 'text-red-500'} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-white text-[15px] leading-tight">{t.name}</span>
          <span className={s.badge}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.dot} mr-1`} />
            {s.label}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Calendar size={11} />
            {new Date(t.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={11} />
            {t.city}
          </span>
          {t.organizer_club_name && (
            <span className="hidden sm:block text-gray-600">
              {t.organizer_club_short || t.organizer_club_name}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight size={16} className="text-gray-700 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}
