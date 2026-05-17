import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Tv, BarChart3, ExternalLink } from 'lucide-react';
import api from '../../lib/api';

export default function PublicTournament() {
  const { slug } = useParams<{ slug: string }>();

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['public-tournament', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}`).then(r => r.data),
  });

  const { data: mats = [] } = useQuery({
    queryKey: ['public-mats', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}/mats`).then(r => r.data),
    enabled: !!tournament?.public_live_matches_enabled,
    refetchInterval: 10000,
  });

  const { data: results = [] } = useQuery({
    queryKey: ['public-results', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}/results`).then(r => r.data).catch(() => []),
    enabled: !!tournament?.public_results_enabled,
    refetchInterval: 15000,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-gray-700 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
    </div>
  );

  if (!tournament || !tournament.public_page_enabled) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center text-center p-8">
      <div>
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
          <Trophy size={24} className="text-gray-600" />
        </div>
        <div className="text-white font-bold text-xl mb-2">Tournoi non disponible</div>
        <p className="text-gray-600 text-sm">Cette page n'est pas accessible pour le moment.</p>
      </div>
    </div>
  );

  const activeMats = mats.filter((m: any) => m.is_active);

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/[0.05] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative border-b border-white/[0.06] px-6 py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-red-900/50">
          <Trophy size={26} />
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-3">{tournament.name}</h1>
        <div className="flex items-center justify-center flex-wrap gap-5 text-sm text-gray-400">
          <span className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-600" />
            {new Date(tournament.event_date).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-600" />
            {tournament.city}
          </span>
          {tournament.organizer_club_name && (
            <span className="text-gray-500">{tournament.organizer_club_name}</span>
          )}
        </div>

        {activeMats.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 text-sm font-semibold">{activeMats.length} tapis en direct</span>
          </div>
        )}
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Live mats */}
        {tournament.public_live_matches_enabled && activeMats.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Tv size={16} className="text-red-500" />
              <h2 className="text-base font-bold">Tapis en direct</h2>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-1" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {activeMats.map((mat: any) => (
                <Link
                  key={mat.id}
                  to={`/mat/${mat.id}`}
                  target="_blank"
                  className="group bg-[#141414] hover:bg-[#1c1c1c] border border-white/[0.06] hover:border-red-600/30 rounded-2xl p-5 text-center transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center mx-auto mb-3">
                    <Tv size={18} className="text-red-400" />
                  </div>
                  <div className="font-bold text-white">{mat.name}</div>
                  <div className="flex items-center justify-center gap-1 text-xs text-red-400/70 mt-1.5 group-hover:text-red-400 transition-colors">
                    Voir le live <ExternalLink size={11} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent results */}
        {tournament.public_results_enabled && results.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 size={16} className="text-blue-500" />
              <h2 className="text-base font-bold">Résultats récents</h2>
            </div>
            <div className="bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-4 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Catégorie</th>
                    <th className="px-4 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Rouge</th>
                    <th className="px-4 py-3 text-center text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Score</th>
                    <th className="px-4 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Bleu</th>
                    <th className="px-4 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Vainqueur</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 20).map((r: any) => (
                    <tr key={r.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {r.age_category} · {r.weight_category}kg
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-400">{r.red_name}</td>
                      <td className="px-4 py-3 text-center font-black text-white tabular-nums">
                        {r.score_red} – {r.score_blue}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-400">{r.blue_name}</td>
                      <td className="px-4 py-3">
                        <span className="badge-green">{r.winner_name}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Empty state */}
        {!tournament.public_live_matches_enabled && !tournament.public_results_enabled && (
          <div className="text-center py-16">
            <Trophy size={32} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">Aucune information disponible pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
