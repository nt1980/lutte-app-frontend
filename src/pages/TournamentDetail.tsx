import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Users, Grid3X3, Swords, CheckCircle, Activity, Scale, Settings, Trophy, ArrowRight } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';

const shortcuts = (id: string) => [
  {
    to: `/t/${id}/registrations`,
    label: 'Inscriptions',
    desc: 'Importer et gérer les combattants',
    icon: Users,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    to: `/t/${id}/weigh-in`,
    label: 'Pesée',
    desc: 'Interface de pesée rapide',
    icon: Scale,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    to: `/t/${id}/competitions`,
    label: 'Compétitions',
    desc: 'Générer les poules et tableaux',
    icon: Grid3X3,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    to: `/t/${id}/brackets`,
    label: 'Tableaux',
    desc: 'Visualiser et gérer les matchs',
    icon: Swords,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
  },
  {
    to: `/t/${id}/mats`,
    label: 'Tapis',
    desc: 'Affecter les combats aux tapis',
    icon: Activity,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    to: `/t/${id}/settings`,
    label: 'Paramètres',
    desc: 'Configuration du tournoi',
    icon: Settings,
    color: 'text-gray-400',
    bg: 'bg-white/5 border-white/10',
  },
];

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
    refetchInterval: 15000,
  });

  if (!tournament) return (
    <Layout tournamentId={id}>
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-1">
          {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-gray-700 animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />)}
        </div>
      </div>
    </Layout>
  );

  const matchesDone  = stats?.matches_done  ?? 0;
  const matchesTotal = stats?.matches_total ?? 0;
  const progress     = matchesTotal > 0 ? Math.round((matchesDone / matchesTotal) * 100) : 0;

  const statCards = [
    { label: 'Combattants', value: stats?.athletes ?? 0,     icon: Users,       color: 'text-blue-400',    glow: 'shadow-blue-900/30'   },
    { label: 'Clubs',       value: stats?.clubs ?? 0,        icon: Trophy,      color: 'text-amber-400',   glow: 'shadow-amber-900/30'  },
    { label: 'Compétitions',value: stats?.competitions ?? 0, icon: Grid3X3,     color: 'text-purple-400',  glow: 'shadow-purple-900/30' },
    { label: 'Combats',     value: matchesTotal > 0 ? `${matchesDone}/${matchesTotal}` : '—',
                                                             icon: CheckCircle, color: 'text-emerald-400' },
  ];

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title={tournament.name}
        subtitle={`${new Date(tournament.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · ${tournament.city}`}
        actions={
          <Link to={`/t/${id}/settings`} className="btn-secondary"><Settings size={15} /> Paramètres</Link>
        }
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#141414] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">{label}</span>
                <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center`}>
                  <Icon size={16} className={color} />
                </div>
              </div>
              <span className="text-3xl font-black text-white tracking-tight">{value}</span>
            </div>
          ))}
        </div>

        {/* Progress */}
        {matchesTotal > 0 && (
          <div className="bg-[#141414] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-white">Progression du tournoi</div>
                <div className="text-xs text-gray-500 mt-0.5">{matchesDone} combats terminés sur {matchesTotal}</div>
              </div>
              <div className="text-2xl font-black text-red-500">{progress}%</div>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && (
              <div className="flex items-center gap-2 mt-3 text-xs text-emerald-400">
                <CheckCircle size={12} /> Tournoi terminé — tous les combats sont joués
              </div>
            )}
          </div>
        )}

        {/* Shortcuts */}
        <div>
          <div className="section-title mb-4">Accès rapide</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 stagger">
            {shortcuts(id!).map(({ to, label, desc, icon: Icon, color, bg }) => (
              <Link
                key={to}
                to={to}
                className="group bg-[#141414] hover:bg-[#1c1c1c] border border-white/[0.06] hover:border-red-600/25 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40 animate-fade-in"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 transition-transform group-hover:scale-110 duration-200 ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-red-300 transition-colors">{label}</div>
                    <div className="text-xs text-gray-600 mt-0.5 leading-tight">{desc}</div>
                  </div>
                  <ArrowRight size={14} className="text-gray-700 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
