import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

export default function MatLive() {
  const { matId } = useParams<{ matId: string }>();
  const [data, setData]       = useState<any>(null);
  const [timer, setTimer]     = useState(0);
  const [running, setRunning] = useState(false);
  const isMobile              = useIsMobile();

  useEffect(() => {
    const doFetch = () => api.get(`/api/mats/${matId}/live`).then(r => setData(r.data)).catch(() => {});
    doFetch();
    const iv = setInterval(doFetch, 3000);
    return () => clearInterval(iv);
  }, [matId]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTimer(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const current = data?.current;
  const next    = data?.next || [];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col select-none">

      {/* Header */}
      <div className="bg-black/80 border-b border-white/10 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
          {data?.mat_name || 'Tapis'}
        </div>
        {current && (
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap justify-center">
            <span className="uppercase">{current.age_category}</span>
            <span className="text-gray-700">·</span>
            <span>{current.weight_category} kg</span>
            {!isMobile && <><span className="text-gray-700">·</span><span className="capitalize">{current.style}</span></>}
          </div>
        )}
        <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${running ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-gray-600'}`}>
          {running ? '● LIVE' : 'LIVE'}
        </div>
      </div>

      {/* ── Layout principal ── */}
      {isMobile ? (
        /* ═══ MOBILE : vertical ═══ */
        <div className="flex-1 flex flex-col min-h-0">

          {/* Rouge */}
          <div className="flex-1 relative flex items-center justify-between px-8 overflow-hidden" style={{ minHeight: '30vh' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/80 to-red-950/60" />
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-500" />
            <div className="relative z-10">
              <div className="text-base font-black uppercase tracking-tight text-white leading-tight">{current?.red_name || '—'}</div>
              <div className="text-xs text-red-300/60 mt-0.5">{current?.red_club || ''}</div>
            </div>
            <div className="relative z-10 text-7xl font-black tabular-nums text-red-400 drop-shadow-lg">
              {current?.score_red ?? 0}
            </div>
          </div>

          {/* Centre : chrono */}
          <div className="bg-[#050505] border-y border-white/[0.06] py-3 flex items-center justify-center gap-6 shrink-0">
            <div className="text-4xl font-black font-mono tabular-nums text-white tracking-tighter">
              {fmt(timer)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRunning(r => !r)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${running ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
              >
                {running ? '⏸ PAUSE' : '▶ START'}
              </button>
              <button
                onClick={() => { setTimer(0); setRunning(false); }}
                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm"
              >
                ↺
              </button>
            </div>
          </div>

          {/* Bleu */}
          <div className="flex-1 relative flex items-center justify-between px-8 overflow-hidden" style={{ minHeight: '30vh' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950/60 to-blue-900/80" />
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-500" />
            <div className="relative z-10">
              <div className="text-base font-black uppercase tracking-tight text-white leading-tight">{current?.blue_name || '—'}</div>
              <div className="text-xs text-blue-300/60 mt-0.5">{current?.blue_club || ''}</div>
            </div>
            <div className="relative z-10 text-7xl font-black tabular-nums text-blue-400 drop-shadow-lg">
              {current?.score_blue ?? 0}
            </div>
          </div>
        </div>
      ) : (
        /* ═══ DESKTOP : horizontal ═══ */
        <div className="flex-1 flex min-h-0">

          {/* Red side */}
          <div className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-800 to-red-950" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
            <div className="relative z-10 text-center">
              <div className="text-[7rem] font-black leading-none tabular-nums drop-shadow-lg">
                {current?.score_red ?? 0}
              </div>
              <div className="mt-4 text-2xl font-black uppercase tracking-wide text-white/90 drop-shadow">
                {current?.red_name || '—'}
              </div>
              <div className="mt-2 text-base text-red-300/70 font-medium">
                {current?.red_club || ''}
              </div>
            </div>
          </div>

          {/* Center panel */}
          <div className="w-52 bg-[#050505] flex flex-col items-center justify-center gap-6 shrink-0 border-x border-white/[0.06]">
            <div className="text-center">
              <div className="text-6xl font-black font-mono tabular-nums text-white tracking-tighter">
                {fmt(timer)}
              </div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-2">Chrono</div>
            </div>
            <div className="flex flex-col gap-2 w-full px-4">
              <button
                onClick={() => setRunning(r => !r)}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${running ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
              >
                {running ? '⏸ PAUSE' : '▶ START'}
              </button>
              <button
                onClick={() => { setTimer(0); setRunning(false); }}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors"
              >
                ↺ Reset
              </button>
            </div>
            {!current && <div className="text-gray-700 text-2xl font-black">VS</div>}
          </div>

          {/* Blue side */}
          <div className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-bl from-blue-900 via-blue-800 to-blue-950" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
            <div className="relative z-10 text-center">
              <div className="text-[7rem] font-black leading-none tabular-nums drop-shadow-lg">
                {current?.score_blue ?? 0}
              </div>
              <div className="mt-4 text-2xl font-black uppercase tracking-wide text-white/90 drop-shadow">
                {current?.blue_name || '—'}
              </div>
              <div className="mt-2 text-base text-blue-300/70 font-medium">
                {current?.blue_club || ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prochains combats */}
      {next.length > 0 && (
        <div className="bg-[#050505] border-t border-white/[0.06] px-4 py-3 shrink-0">
          <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-2 font-semibold">Prochains combats</div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {next.map((m: any, i: number) => (
              <div
                key={m.id}
                className="shrink-0 flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2"
              >
                <span className="text-gray-600 text-xs font-mono">#{i + 1}</span>
                <span className="text-sm font-bold text-red-400">{m.red_name || '?'}</span>
                <span className="text-gray-700 text-xs">vs</span>
                <span className="text-sm font-bold text-blue-400">{m.blue_name || '?'}</span>
                {!isMobile && (
                  <span className="text-xs text-gray-600 border-l border-white/10 pl-3 ml-1">
                    {m.age_category} · {m.weight_category}kg
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* État vide */}
      {!current && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-25">
            <div className="text-7xl font-black text-gray-700">—</div>
            <div className="text-gray-600 mt-3 uppercase tracking-widest text-sm">En attente d'un combat</div>
          </div>
        </div>
      )}
    </div>
  );
}
