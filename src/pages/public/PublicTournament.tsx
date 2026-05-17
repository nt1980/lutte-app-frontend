import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Tv, BarChart3 } from 'lucide-react';
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
  });

  const { data: results = [] } = useQuery({
    queryKey: ['public-results', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}/results`).then(r => r.data).catch(() => []),
    enabled: !!tournament?.public_results_enabled,
  });

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Chargement…</div>;
  if (!tournament || !tournament.public_page_enabled) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-center p-8">
      <div><Trophy size={48} className="mx-auto text-gray-700 mb-4" /><p className="text-gray-500">Tournoi non disponible</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-red-950/40 to-transparent border-b border-[#2E2E2E] px-6 py-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-4">
          <Trophy size={28} />
        </div>
        <h1 className="text-3xl font-black">{tournament.name}</h1>
        <div className="flex items-center justify-center gap-6 mt-3 text-gray-400 text-sm">
          <span className="flex items-center gap-1"><Calendar size={14} />{new Date(tournament.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="flex items-center gap-1"><MapPin size={14} />{tournament.city}</span>
          {tournament.organizer_club_name && <span>{tournament.organizer_club_name}</span>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Tapis live */}
        {tournament.public_live_matches_enabled && mats.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Tv size={18} className="text-red-500" />Tapis en direct</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {mats.filter((m: any) => m.is_active).map((mat: any) => (
                <Link key={mat.id} to={`/mat/${mat.id}`} target="_blank"
                  className="card hover:border-red-600/40 transition-all text-center py-6">
                  <Tv size={24} className="text-red-500 mx-auto mb-2" />
                  <div className="font-bold">{mat.name}</div>
                  <div className="text-xs text-gray-500 mt-1">Voir le live →</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Résultats récents */}
        {tournament.public_results_enabled && results.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-blue-500" />Résultats récents</h2>
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#242424]">
                    <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Catégorie</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Rouge</th>
                    <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">Score</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Bleu</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Vainqueur</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 20).map((r: any) => (
                    <tr key={r.id} className="border-t border-[#2E2E2E]">
                      <td className="px-4 py-2 text-xs text-gray-500">{r.age_category} {r.weight_category}kg</td>
                      <td className="px-4 py-2 text-sm text-red-400">{r.red_name}</td>
                      <td className="px-4 py-2 text-center font-bold">{r.score_red} – {r.score_blue}</td>
                      <td className="px-4 py-2 text-sm text-blue-400">{r.blue_name}</td>
                      <td className="px-4 py-2 text-sm font-semibold text-green-400">{r.winner_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
