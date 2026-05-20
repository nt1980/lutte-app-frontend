import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';

const WIN_TYPES = [
  { value: 'points',      label: 'Aux points',       short: 'PTS' },
  { value: 'superiority', label: 'Supériorité',       short: 'SUP' },
  { value: 'fall',        label: 'Tombé',             short: 'TOM' },
  { value: 'forfeit',     label: 'Forfait',           short: 'FOR' },
  { value: 'abandon',     label: 'Abandon',           short: 'ABA' },
  { value: 'dq',          label: 'Disqualif.',        short: 'DQ'  },
];

const DURATIONS: Record<string, number> = {
  U7: 60, U9: 90, U11: 90, U13: 120, U15: 120, default: 180,
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

export default function RefView() {
  const { matchId } = useParams<{ matchId: string }>();
  const qc = useQueryClient();
  const isMobile = useIsMobile();

  const [scoreRed,  setScoreRed]  = useState(0);
  const [scoreBlue, setScoreBlue] = useState(0);
  const [winType,   setWinType]   = useState('points');
  const [timer,     setTimer]     = useState(0);
  const [running,   setRunning]   = useState(false);
  const [period,    setPeriod]    = useState(1);

  const { data: match } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => api.get(`/api/matches/${matchId}`).then(r => r.data),
    refetchInterval: running ? false : 8000,
  });

  const totalDuration = DURATIONS[match?.age_category] ?? DURATIONS.default;
  const remaining = Math.max(0, totalDuration - timer);
  const pct = totalDuration > 0 ? (timer / totalDuration) * 100 : 0;

  useEffect(() => {
    if (!running) return;
    if (timer >= totalDuration) { setRunning(false); return; }
    const t = setInterval(() => setTimer(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [running, timer, totalDuration]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const addPoint = useCallback((side: 'red' | 'blue', pts: number) => {
    if (side === 'red')  setScoreRed(p  => Math.max(0, p + pts));
    else                 setScoreBlue(p => Math.max(0, p + pts));
  }, []);

  const mutation = useMutation({
    mutationFn: ({ winner_id, loser_id }: any) =>
      api.put(`/api/matches/${matchId}/result`, {
        winner_id, loser_id,
        score_red: scoreRed, score_blue: scoreBlue, win_type: winType,
      }),
    onSuccess: () => {
      toast.success('Résultat enregistré');
      qc.invalidateQueries({ queryKey: ['match', matchId] });
    },
    onError: () => toast.error('Erreur lors de l\'enregistrement'),
  });

  const finish = (winnerId: string, loserId: string) => {
    if (!winnerId) return toast.error('Athlete introuvable');
    mutation.mutate({ winner_id: winnerId, loser_id: loserId });
  };

  if (!match) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-gray-700 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
    </div>
  );

  const finished = match.status === 'finished';
  const isUrgent = remaining < 30 && remaining > 0 && running;

  /* ════════════════════════════════════════════════
     VUE MOBILE — optimisée smartphone (portrait)
  ════════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div className="h-screen bg-[#050505] text-white flex flex-col select-none overflow-hidden">

        {/* Top bar */}
        <div className="bg-black/70 border-b border-white/[0.06] px-4 py-2 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="font-semibold text-gray-300">{match.age_category}</span>
            <span>·</span>
            <span>{match.weight_category} kg</span>
          </div>
          <div className={`font-black text-xs uppercase tracking-widest px-3 py-1 rounded-full ${
            finished ? 'bg-emerald-500/15 text-emerald-400' :
            running  ? 'bg-red-500/15 text-red-400 animate-pulse' :
                       'bg-white/5 text-gray-500'
          }`}>
            {finished ? '✓ Fin' : running ? '● En jeu' : `P${period}/2`}
          </div>
        </div>

        {/* Scores côte à côte */}
        <div className="flex shrink-0" style={{ height: '28vh' }}>
          {/* Rouge */}
          <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-red-950/80 to-red-900/40" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
            <div className="relative z-10 text-center px-3">
              <div className="text-[4.5rem] font-black leading-none tabular-nums text-red-400">{scoreRed}</div>
              <div className="text-sm font-black uppercase tracking-tight text-white/80 mt-1 truncate max-w-[120px]">{match.red_name || 'ROUGE'}</div>
            </div>
          </div>

          {/* Chrono central */}
          <div className="flex flex-col items-center justify-center bg-black/60 border-x border-white/[0.06] px-3 shrink-0" style={{ minWidth: 90 }}>
            <div className={`text-2xl font-black font-mono tabular-nums tracking-tighter ${isUrgent ? 'text-red-400' : 'text-white'}`}>
              {fmt(remaining)}
            </div>
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={() => setRunning(r => !r)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${running ? 'bg-amber-500 text-black' : 'bg-emerald-600 text-white'}`}
              >
                {running ? '⏸' : '▶'}
              </button>
              <button
                onClick={() => { setTimer(0); setRunning(false); }}
                className="px-2 py-1.5 rounded-lg bg-white/[0.06] text-gray-400 text-xs"
              >
                ↺
              </button>
            </div>
            {/* Barre de temps */}
            <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${100 - pct}%` }}
              />
            </div>
          </div>

          {/* Bleu */}
          <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 to-blue-900/40" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
            <div className="relative z-10 text-center px-3">
              <div className="text-[4.5rem] font-black leading-none tabular-nums text-blue-400">{scoreBlue}</div>
              <div className="text-sm font-black uppercase tracking-tight text-white/80 mt-1 truncate max-w-[120px]">{match.blue_name || 'BLEU'}</div>
            </div>
          </div>
        </div>

        {/* Boutons de points */}
        {!finished && (
          <div className="flex gap-3 p-3 shrink-0">
            {/* Rouge */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map(p => (
                  <button
                    key={p}
                    onClick={() => addPoint('red', p)}
                    className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black py-4 rounded-xl text-xl transition-all"
                  >
                    +{p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => addPoint('red', -1)}
                className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-500 text-sm transition-all"
              >
                −1
              </button>
            </div>

            {/* Bleu */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map(p => (
                  <button
                    key={p}
                    onClick={() => addPoint('blue', p)}
                    className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black py-4 rounded-xl text-xl transition-all"
                  >
                    +{p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => addPoint('blue', -1)}
                className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-500 text-sm transition-all"
              >
                −1
              </button>
            </div>
          </div>
        )}

        {/* Barre période + type victoire */}
        {!finished && (
          <div className="px-3 pb-3 shrink-0 flex flex-col gap-2">
            {period === 1 && !running && timer > 0 && (
              <button
                onClick={() => { setTimer(0); setPeriod(2); }}
                className="w-full text-xs text-blue-400 hover:text-blue-300 py-2 bg-blue-500/10 rounded-xl"
              >
                → Passer à la Période 2
              </button>
            )}

            {/* Type de victoire (compact) */}
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-[10px] text-gray-600 uppercase tracking-widest self-center mr-1">Victoire par :</span>
              {WIN_TYPES.map(w => (
                <button
                  key={w.value}
                  onClick={() => setWinType(w.value)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg transition-all font-bold ${
                    winType === w.value
                      ? 'bg-white/15 text-white'
                      : 'text-gray-600 bg-white/[0.03] hover:text-gray-300'
                  }`}
                >
                  {w.short}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Boutons de victoire */}
        {!finished && (
          <div className="flex gap-3 px-3 pb-4 shrink-0">
            <button
              onClick={() => finish(match.red_athlete_id, match.blue_athlete_id)}
              disabled={mutation.isPending}
              className="flex-1 bg-red-700 hover:bg-red-600 active:scale-95 text-white font-black py-4 rounded-2xl text-base transition-all"
            >
              🏆 ROUGE gagne
            </button>
            <button
              onClick={() => finish(match.blue_athlete_id, match.red_athlete_id)}
              disabled={mutation.isPending}
              className="flex-1 bg-blue-700 hover:bg-blue-600 active:scale-95 text-white font-black py-4 rounded-2xl text-base transition-all"
            >
              🏆 BLEU gagne
            </button>
          </div>
        )}

        {/* Finished state */}
        {finished && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-emerald-400 text-2xl">✓</span>
            </div>
            <div className="text-emerald-400 font-bold text-lg">Combat terminé</div>
            <div className="text-gray-500 text-sm">{match.winner_name} gagne</div>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════
     VUE DESKTOP — layout horizontal original
  ════════════════════════════════════════════════ */
  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col select-none overflow-hidden">

      {/* Top bar */}
      <div className="bg-black/60 border-b border-white/[0.06] px-5 py-2.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-3 text-gray-500">
          <span className="font-semibold text-gray-300">{match.age_category}</span>
          <span>·</span>
          <span>{match.weight_category} kg</span>
          <span>·</span>
          <span className="capitalize">{match.style}</span>
        </div>
        <div className={`font-black text-xs uppercase tracking-widest px-3 py-1 rounded-full ${
          finished ? 'bg-emerald-500/15 text-emerald-400' :
          running  ? 'bg-red-500/15 text-red-400 animate-pulse' :
                     'bg-white/5 text-gray-500'
        }`}>
          {finished ? '✓ Terminé' : running ? '● En jeu' : `Période ${period}/2`}
        </div>
        <div className="text-gray-700 text-[10px] font-mono">{matchId?.slice(0, 8)}</div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">

        {/* RED SIDE */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/60 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-600" />

          <div className="px-8 pt-6 pb-3 relative">
            <div className="text-2xl font-black uppercase tracking-tight text-white">{match.red_name || 'ROUGE'}</div>
            <div className="text-sm text-red-400/70 mt-0.5">{match.red_club || ''}</div>
          </div>

          <div className="flex-1 flex items-center justify-center relative">
            <div className="text-[140px] font-black leading-none text-red-400 tabular-nums drop-shadow-2xl">{scoreRed}</div>
          </div>

          {!finished && (
            <div className="p-6 pt-0 relative">
              <div className="grid grid-cols-3 gap-2 max-w-xs">
                {[1, 2, 3].map(p => (
                  <button key={p} onClick={() => addPoint('red', p)}
                    className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black py-5 rounded-2xl text-2xl transition-all shadow-lg shadow-red-900/30">
                    +{p}
                  </button>
                ))}
              </div>
              <button onClick={() => addPoint('red', -1)}
                className="mt-2 w-full max-w-xs py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-500 hover:text-gray-300 text-sm transition-all">
                −1 correction
              </button>
            </div>
          )}

          {!finished && (
            <div className="px-6 pb-5 relative">
              <button
                onClick={() => finish(match.red_athlete_id, match.blue_athlete_id)}
                disabled={mutation.isPending}
                className="w-full max-w-xs bg-red-700 hover:bg-red-600 active:scale-95 text-white font-black py-4 rounded-2xl text-base transition-all shadow-xl shadow-red-900/40">
                🏆 Victoire ROUGE
              </button>
            </div>
          )}
        </div>

        {/* CENTER */}
        <div className="w-56 flex flex-col items-center justify-between py-6 bg-[#080808] border-x border-white/[0.06] shrink-0">

          <div className="text-center w-full px-4">
            <div className={`text-6xl font-black font-mono tabular-nums tracking-tighter transition-colors ${isUrgent ? 'text-red-400' : 'text-white'}`}>
              {fmt(remaining)}
            </div>
            <div className="mt-3 mx-auto w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${100 - pct}%` }}
              />
            </div>
            <div className="flex gap-1.5 mt-4 justify-center">
              <button
                onClick={() => setRunning(r => !r)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${running ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
              >
                {running ? '⏸' : '▶'}
              </button>
              <button
                onClick={() => { setTimer(0); setRunning(false); }}
                className="px-3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-gray-400 text-sm transition-all">
                ↺
              </button>
            </div>
            {period === 1 && !running && timer > 0 && (
              <button
                onClick={() => { setTimer(0); setPeriod(2); }}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                → Période 2
              </button>
            )}
          </div>

          <div className="w-full px-3">
            <div className="text-[10px] text-gray-600 text-center uppercase tracking-widest mb-2 font-semibold">Victoire par</div>
            <div className="space-y-1">
              {WIN_TYPES.map(w => (
                <button key={w.value} onClick={() => setWinType(w.value)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all ${winType === w.value ? 'bg-white/10 text-white font-bold' : 'text-gray-600 hover:text-gray-300 hover:bg-white/[0.04]'}`}>
                  <span className="font-mono text-[10px] text-gray-500 mr-2">{w.short}</span>
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {finished && (
            <div className="text-center px-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                <span className="text-emerald-400">✓</span>
              </div>
              <div className="text-emerald-400 font-bold text-sm">Enregistré</div>
              <div className="text-gray-500 text-xs mt-1">{match.winner_name} gagne</div>
            </div>
          )}
        </div>

        {/* BLUE SIDE */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/60 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-600" />

          <div className="px-8 pt-6 pb-3 relative text-right">
            <div className="text-2xl font-black uppercase tracking-tight text-white">{match.blue_name || 'BLEU'}</div>
            <div className="text-sm text-blue-400/70 mt-0.5">{match.blue_club || ''}</div>
          </div>

          <div className="flex-1 flex items-center justify-center relative">
            <div className="text-[140px] font-black leading-none text-blue-400 tabular-nums drop-shadow-2xl">{scoreBlue}</div>
          </div>

          {!finished && (
            <div className="p-6 pt-0 relative flex flex-col items-end">
              <div className="grid grid-cols-3 gap-2 max-w-xs">
                {[1, 2, 3].map(p => (
                  <button key={p} onClick={() => addPoint('blue', p)}
                    className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black py-5 rounded-2xl text-2xl transition-all shadow-lg shadow-blue-900/30">
                    +{p}
                  </button>
                ))}
              </div>
              <button onClick={() => addPoint('blue', -1)}
                className="mt-2 w-full max-w-xs py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-500 hover:text-gray-300 text-sm transition-all">
                −1 correction
              </button>
            </div>
          )}

          {!finished && (
            <div className="px-6 pb-5 relative flex flex-col items-end">
              <button
                onClick={() => finish(match.blue_athlete_id, match.red_athlete_id)}
                disabled={mutation.isPending}
                className="w-full max-w-xs bg-blue-700 hover:bg-blue-600 active:scale-95 text-white font-black py-4 rounded-2xl text-base transition-all shadow-xl shadow-blue-900/40">
                🏆 Victoire BLEU
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
