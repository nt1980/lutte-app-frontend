import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Zap, Trophy, ChevronRight, RefreshCw, Medal } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const statusColor: Record<string, string> = {
  waiting: 'bg-gray-700 text-gray-400',
  ready: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  on_mat: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50',
  finished: 'bg-green-900/50 text-green-300 border border-green-700/50',
  blocked: 'bg-gray-800 text-gray-600',
};

const formatLabel: Record<string, string> = {
  nordic: 'Nordique',
  pools_finals: 'Poules + Finales',
  bracket_repechage: 'Tableau + Repêchage',
};

function MatchCard({ match }: { match: any }) {
  const isFinished = match.status === 'finished';
  const winnerIsRed = match.winner_color === 'red';

  return (
    <div className={`rounded-lg p-2 text-xs min-w-[160px] ${statusColor[match.status] || 'bg-gray-800'}`}>
      <div className={`flex items-center gap-1 mb-1 ${isFinished && winnerIsRed ? 'font-bold' : ''}`}>
        <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        <span className={`truncate ${isFinished && winnerIsRed ? 'text-white' : 'text-red-300'}`}>
          {match.red_name || (match.is_bye ? 'BYE' : '?')}
        </span>
        {isFinished && <span className="ml-auto font-mono">{match.score_red ?? ''}</span>}
      </div>
      <div className={`flex items-center gap-1 ${isFinished && !winnerIsRed ? 'font-bold' : ''}`}>
        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
        <span className={`truncate ${isFinished && !winnerIsRed ? 'text-white' : 'text-blue-300'}`}>
          {match.blue_name || (match.is_bye ? 'BYE' : '?')}
        </span>
        {isFinished && <span className="ml-auto font-mono">{match.score_blue ?? ''}</span>}
      </div>
      {match.status === 'on_mat' && (
        <div className="mt-1 text-[10px] text-yellow-400">En cours</div>
      )}
      {isFinished && match.win_type && (
        <div className="mt-1 text-[10px] text-gray-500 capitalize">{match.win_type}</div>
      )}
      {match.match_id && (
        <Link to={`/ref/${match.match_id}`} target="_blank"
          className="mt-1.5 block text-center text-[10px] bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded px-1 py-0.5 transition-colors">
          Arbitrer →
        </Link>
      )}
    </div>
  );
}

function NordicView({ matches, pools }: { matches: any[]; pools: any[] }) {
  if (pools.length === 0) return <div className="text-gray-500 text-sm">Aucune poule</div>;

  return (
    <div className="space-y-6">
      {pools.map((pool: any) => {
        const poolMatches = matches.filter((m: any) => m.pool_id === pool.id);
        return (
          <div key={pool.id} className="card p-4">
            <h4 className="text-sm font-bold text-gray-300 mb-3">{pool.name}</h4>
            <div className="space-y-2">
              {poolMatches.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 bg-[#242424] rounded-lg px-3 py-2">
                  <span className="text-red-400 font-semibold text-sm flex-1">{m.red_name || '?'}</span>
                  <span className={`font-mono font-bold text-sm ${m.status === 'finished' ? 'text-white' : 'text-gray-600'}`}>
                    {m.status === 'finished' ? `${m.score_red} – ${m.score_blue}` : 'vs'}
                  </span>
                  <span className="text-blue-400 font-semibold text-sm flex-1 text-right">{m.blue_name || '?'}</span>
                  {m.match_id && (
                    <Link to={`/ref/${m.match_id}`} target="_blank" className="btn-ghost btn-sm text-xs ml-2">
                      <ChevronRight size={12} />
                    </Link>
                  )}
                </div>
              ))}
              {poolMatches.length === 0 && (
                <div className="text-gray-600 text-xs py-2">Tableau non généré</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BracketColumn({ matches, label, className = '' }: { matches: any[]; label: string; className?: string }) {
  if (matches.length === 0) return null;
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="text-[10px] text-gray-600 uppercase tracking-widest text-center font-semibold">{label}</div>
      <div className="flex flex-col justify-around flex-1 gap-2">
        {matches.map((m: any) => <MatchCard key={m.id} match={m} />)}
      </div>
    </div>
  );
}

function BracketView({ matches }: { matches: any[] }) {
  const mainMatches = matches.filter((m: any) => m.bracket === 'main' || !m.bracket);
  const repechageMatches = matches.filter((m: any) => m.bracket === 'repechage');

  const rounds = mainMatches.reduce((acc: any, m: any) => {
    const r = m.round ?? 0;
    if (!acc[r]) acc[r] = [];
    acc[r].push(m);
    return acc;
  }, {});

  const sortedRounds = Object.entries(rounds).sort(([a], [b]) => Number(a) - Number(b));
  const totalRounds = sortedRounds.length;

  const roundLabel = (idx: number) => {
    const fromEnd = totalRounds - 1 - idx;
    if (fromEnd === 0) return 'Finale';
    if (fromEnd === 1) return 'Demi-finales';
    if (fromEnd === 2) return 'Quarts';
    return `Tour ${idx + 1}`;
  };

  const repRounds = repechageMatches.reduce((acc: any, m: any) => {
    const r = m.round ?? 0;
    if (!acc[r]) acc[r] = [];
    acc[r].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Main bracket */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={14} className="text-yellow-500" />
          <span className="text-sm font-bold text-gray-300">Tableau principal</span>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-max pb-4">
            {sortedRounds.map(([round, rMatches]: [string, any], idx) => (
              <BracketColumn key={round} matches={rMatches} label={roundLabel(idx)} />
            ))}
          </div>
        </div>
      </div>

      {/* Repechage */}
      {repechageMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Medal size={14} className="text-orange-500" />
            <span className="text-sm font-bold text-gray-300">Repêchage (2× Bronze)</span>
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-6 min-w-max pb-4">
              {Object.entries(repRounds).sort(([a], [b]) => Number(a) - Number(b)).map(([round, rMatches]: [string, any], idx) => (
                <BracketColumn key={round} matches={rMatches} label={`Repêchage T${idx + 1}`} className="opacity-80" />
              ))}
            </div>
          </div>
        </div>
      )}

      {mainMatches.length === 0 && (
        <div className="text-gray-500 text-sm">Tableau non encore généré</div>
      )}
    </div>
  );
}

function PoolsFinalsView({ matches, pools }: { matches: any[]; pools: any[] }) {
  const poolMatches = matches.filter((m: any) => m.match_type === 'pool' || m.pool_id);
  const finalMatches = matches.filter((m: any) => m.match_type === 'semifinal' || m.match_type === 'final' || m.match_type === 'bronze');

  return (
    <div className="space-y-6">
      <NordicView matches={poolMatches} pools={pools} />
      {finalMatches.length > 0 && (
        <div>
          <div className="text-sm font-bold text-gray-300 mb-3">Phase finale</div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {['semifinal', 'final', 'bronze'].map(type => {
              const typeMatches = finalMatches.filter((m: any) => m.match_type === type);
              if (typeMatches.length === 0) return null;
              const labels: Record<string, string> = { semifinal: 'Demi-finales', final: 'Finale', bronze: 'Bronze' };
              return <BracketColumn key={type} matches={typeMatches} label={labels[type]} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Brackets() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [selectedComp, setSelectedComp] = useState<string | null>(null);

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions', id],
    queryFn: () => api.get(`/api/tournaments/${id}/competitions`).then(r => r.data),
  });

  const { data: bracketData, isLoading: bracketLoading } = useQuery({
    queryKey: ['bracket', selectedComp],
    queryFn: () => api.get(`/api/competitions/${selectedComp}/bracket`).then(r => r.data),
    enabled: !!selectedComp,
  });

  const { data: rankings = [] } = useQuery({
    queryKey: ['rankings', selectedComp],
    queryFn: () => api.get(`/api/competitions/${selectedComp}/rankings`).then(r => r.data).catch(() => []),
    enabled: !!selectedComp,
  });

  const generateBracket = useMutation({
    mutationFn: (compId: string) => api.post(`/api/competitions/${compId}/generate-bracket`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bracket', selectedComp] });
      toast.success('Tableau généré');
    },
    onError: () => toast.error('Erreur lors de la génération du tableau'),
  });

  const activeComp = selectedComp
    ? competitions.find((c: any) => c.id === selectedComp)
    : competitions[0];

  const comp = selectedComp ? activeComp : (competitions[0] || null);

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Tableaux"
        subtitle="Visualisation et gestion des tableaux de compétition"
        actions={
          selectedComp && (
            <button
              className="btn-primary"
              onClick={() => generateBracket.mutate(selectedComp)}
              disabled={generateBracket.isPending}
            >
              <RefreshCw size={16} className={generateBracket.isPending ? 'animate-spin' : ''} />
              {generateBracket.isPending ? 'Génération…' : 'Générer le tableau'}
            </button>
          )
        }
      />

      <div className="p-6 space-y-6">
        {competitions.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <Zap size={40} className="text-gray-600 mb-3" />
            <p className="text-gray-400 font-medium">Aucune compétition</p>
            <p className="text-gray-600 text-sm mt-1">Générez les compétitions depuis l'onglet Compétitions</p>
          </div>
        ) : (
          <>
            {/* Competition selector */}
            <div className="flex gap-2 flex-wrap">
              {competitions.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedComp(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    (selectedComp === c.id || (!selectedComp && competitions[0]?.id === c.id))
                      ? 'bg-red-600 text-white'
                      : 'bg-[#242424] text-gray-400 hover:text-white'
                  }`}
                >
                  {c.age_category} • {c.weight_category}kg {c.gender === 'M' ? '♂' : '♀'}
                </button>
              ))}
            </div>

            {(selectedComp || competitions[0]) && (
              <div className="space-y-6">
                {/* Competition info */}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{formatLabel[comp?.format_type] || comp?.format_type}</span>
                  <span>•</span>
                  <span>{comp?.athlete_count ?? 0} athlètes</span>
                  <span>•</span>
                  <span className="capitalize">{comp?.style}</span>
                </div>

                {bracketLoading ? (
                  <div className="text-gray-500 text-sm">Chargement…</div>
                ) : (
                  <>
                    {/* Bracket view */}
                    {comp?.format_type === 'nordic' && (
                      <NordicView
                        matches={bracketData?.matches || []}
                        pools={bracketData?.pools || []}
                      />
                    )}
                    {comp?.format_type === 'pools_finals' && (
                      <PoolsFinalsView
                        matches={bracketData?.matches || []}
                        pools={bracketData?.pools || []}
                      />
                    )}
                    {comp?.format_type === 'bracket_repechage' && (
                      <BracketView matches={bracketData?.matches || []} />
                    )}

                    {/* Rankings */}
                    {rankings.length > 0 && (
                      <div className="card p-4">
                        <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                          <Trophy size={14} className="text-yellow-500" />
                          Classement
                        </h3>
                        <div className="space-y-2">
                          {rankings.map((r: any, i: number) => (
                            <div key={r.athlete_id || i} className="flex items-center gap-3 bg-[#242424] rounded-lg px-3 py-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                i === 0 ? 'bg-yellow-500 text-black' :
                                i === 1 ? 'bg-gray-400 text-black' :
                                i === 2 ? 'bg-orange-600 text-white' :
                                'bg-[#333] text-gray-400'
                              }`}>
                                {r.rank ?? i + 1}
                              </div>
                              <span className="font-semibold text-sm text-white flex-1">{r.athlete_name || r.name}</span>
                              <span className="text-xs text-gray-500">{r.club_name || r.club}</span>
                              {r.points !== undefined && (
                                <span className="text-xs font-mono text-gray-400">{r.points} pts</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
