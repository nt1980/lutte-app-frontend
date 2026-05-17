import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';

const WIN_TYPES = [
  { value: 'points', label: 'Aux points' },
  { value: 'superiority', label: 'Supériorité (+8/+10)' },
  { value: 'fall', label: 'Tombé' },
  { value: 'forfeit', label: 'Forfait' },
  { value: 'abandon', label: 'Abandon' },
  { value: 'dq', label: 'Disqualification' },
];

const DURATIONS: Record<string, number> = {
  U7: 60, U9: 90, U11: 90, U13: 120, U15: 120, default: 180,
};

export default function RefView() {
  const { matchId } = useParams<{ matchId: string }>();
  const qc = useQueryClient();

  const [scoreRed, setScoreRed] = useState(0);
  const [scoreBlue, setScoreBlue] = useState(0);
  const [winType, setWinType] = useState('points');
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [period, setPeriod] = useState(1);

  const { data: match } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => api.get(`/api/matches/${matchId}`).then(r => r.data),
    refetchInterval: running ? false : 5000,
  });

  const totalDuration = DURATIONS[match?.age_category] ?? DURATIONS.default;

  useEffect(() => {
    if (!running) return;
    if (timer >= totalDuration) { setRunning(false); return; }
    const t = setInterval(() => setTimer(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [running, timer, totalDuration]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const remaining = Math.max(0, totalDuration - timer);

  const addPoint = useCallback((side: 'red' | 'blue', pts: number) => {
    if (side === 'red') setScoreRed(p => Math.max(0, p + pts));
    else setScoreBlue(p => Math.max(0, p + pts));
  }, []);

  const mutation = useMutation({
    mutationFn: ({ winner_id, loser_id }: any) =>
      api.put(`/api/matches/${matchId}/result`, { winner_id, loser_id, score_red: scoreRed, score_blue: scoreBlue, win_type: winType }),
    onSuccess: () => { toast.success('Résultat enregistré'); qc.invalidateQueries({ queryKey: ['match', matchId] }); },
    onError: () => toast.error('Erreur'),
  });

  const finish = (winnerId: string, loserId: string) => {
    if (!winnerId) return toast.error('Sélectionne un vainqueur');
    mutation.mutate({ winner_id: winnerId, loser_id: loserId });
  };

  if (!match) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Chargement…</div>;

  const finished = match.status === 'finished';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col select-none">
      {/* Header */}
      <div className="bg-[#111] border-b border-[#222] px-4 py-2 flex items-center justify-between text-xs text-gray-500">
        <span>{match.age_category} • {match.weight_category}kg • {match.style}</span>
        <span className={`font-bold ${finished ? 'text-green-400' : 'text-yellow-400'}`}>{finished ? 'TERMINÉ' : 'EN COURS'}</span>
        <span>Période {period}/2</span>
      </div>

      {/* Scores */}
      <div className="flex flex-1">
        {/* Rouge */}
        <div className="flex-1 bg-red-900/40 border-r border-[#222] flex flex-col items-center justify-between p-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{match.red_name || 'ROUGE'}</div>
            <div className="text-gray-400 text-sm">{match.red_club}</div>
          </div>
          <div className="text-[120px] font-black leading-none text-red-400">{scoreRed}</div>
          {!finished && (
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
              {[1, 2, 3].map(p => (
                <button key={p} onClick={() => addPoint('red', p)} className="bg-red-700 hover:bg-red-600 text-white font-bold py-4 rounded-xl text-lg">+{p}</button>
              ))}
              <button onClick={() => addPoint('red', -1)} className="bg-[#333] hover:bg-[#444] text-gray-400 font-bold py-3 rounded-xl col-span-3 text-sm">-1 (correction)</button>
            </div>
          )}
        </div>

        {/* Centre */}
        <div className="w-52 flex flex-col items-center justify-between py-6 gap-4 shrink-0">
          {/* Chrono */}
          <div className="text-center">
            <div className={`text-5xl font-mono font-black ${remaining < 30 && running ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {fmt(remaining)}
            </div>
            <div className="flex gap-2 mt-3 justify-center">
              <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-bold text-sm ${running ? 'bg-yellow-500 text-black' : 'bg-green-600 text-white'}`}>
                {running ? '⏸ PAUSE' : '▶ START'}
              </button>
              <button onClick={() => { setTimer(0); setRunning(false); }} className="px-3 py-2 rounded-lg bg-[#333] text-xs">↺</button>
            </div>
            {period === 1 && !running && timer > 0 && (
              <button onClick={() => { setTimer(0); setPeriod(2); }} className="mt-2 text-xs text-blue-400 underline">Période 2</button>
            )}
          </div>

          {/* Type de victoire */}
          <div className="w-full">
            <div className="text-xs text-gray-500 text-center mb-2">Type de victoire</div>
            <div className="space-y-1">
              {WIN_TYPES.map(w => (
                <button key={w.value} onClick={() => setWinType(w.value)}
                  className={`w-full text-xs py-2 px-3 rounded-lg text-left transition-all ${winType === w.value ? 'bg-white/20 text-white font-semibold' : 'text-gray-500 hover:text-gray-300'}`}>
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Boutons victoire */}
          {!finished && (
            <div className="w-full space-y-2">
              <button onClick={() => finish(match.red_athlete_id, match.blue_athlete_id)}
                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm">
                🏆 Victoire ROUGE
              </button>
              <button onClick={() => finish(match.blue_athlete_id, match.red_athlete_id)}
                className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm">
                🏆 Victoire BLEU
              </button>
            </div>
          )}

          {finished && (
            <div className="text-center">
              <div className="text-green-400 font-bold">✓ Résultat enregistré</div>
              <div className="text-sm text-gray-400 mt-1">{match.winner_name} gagne</div>
            </div>
          )}
        </div>

        {/* Bleu */}
        <div className="flex-1 bg-blue-900/40 border-l border-[#222] flex flex-col items-center justify-between p-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{match.blue_name || 'BLEU'}</div>
            <div className="text-gray-400 text-sm">{match.blue_club}</div>
          </div>
          <div className="text-[120px] font-black leading-none text-blue-400">{scoreBlue}</div>
          {!finished && (
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
              {[1, 2, 3].map(p => (
                <button key={p} onClick={() => addPoint('blue', p)} className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-4 rounded-xl text-lg">+{p}</button>
              ))}
              <button onClick={() => addPoint('blue', -1)} className="bg-[#333] hover:bg-[#444] text-gray-400 font-bold py-3 rounded-xl col-span-3 text-sm">-1 (correction)</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
