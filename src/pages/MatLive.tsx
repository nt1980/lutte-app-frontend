import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';

export default function MatLive() {
  const { matId } = useParams<{ matId: string }>();
  const [data, setData] = useState<any>(null);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const fetch = () => api.get(`/api/mats/${matId}/live`).then(r => setData(r.data)).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 3000);
    return () => clearInterval(interval);
  }, [matId]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTimer(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const current = data?.current;
  const next = data?.next || [];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Combat actuel */}
      <div className="flex-1 flex">
        {/* Rouge */}
        <div className="flex-1 bg-red-700 flex flex-col items-center justify-center p-8">
          <div className="text-8xl font-black">{current?.score_red ?? 0}</div>
          <div className="text-3xl font-bold mt-4 uppercase tracking-wide text-center">{current?.red_name || '—'}</div>
          <div className="text-xl text-red-200 mt-2">{current?.red_club || ''}</div>
        </div>

        {/* Centre */}
        <div className="w-48 bg-[#111] flex flex-col items-center justify-center gap-4 shrink-0">
          <div className="text-gray-400 text-sm uppercase tracking-widest">{current?.age_category} • {current?.weight_category}kg</div>
          <div className="text-5xl font-mono font-black text-white">{fmt(timer)}</div>
          <div className="flex gap-2">
            <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-bold text-sm ${running ? 'bg-yellow-500 text-black' : 'bg-green-600 text-white'}`}>
              {running ? 'PAUSE' : 'START'}
            </button>
            <button onClick={() => { setTimer(0); setRunning(false); }} className="px-3 py-2 rounded-lg bg-[#333] text-gray-300 text-sm">↺</button>
          </div>
          {current?.style && <div className="text-gray-500 text-xs uppercase">{current.style}</div>}
        </div>

        {/* Bleu */}
        <div className="flex-1 bg-blue-700 flex flex-col items-center justify-center p-8">
          <div className="text-8xl font-black">{current?.score_blue ?? 0}</div>
          <div className="text-3xl font-bold mt-4 uppercase tracking-wide text-center">{current?.blue_name || '—'}</div>
          <div className="text-xl text-blue-200 mt-2">{current?.blue_club || ''}</div>
        </div>
      </div>

      {/* Prochains combats */}
      {next.length > 0 && (
        <div className="bg-[#0A0A0A] border-t border-[#222] px-6 py-3">
          <div className="text-xs text-gray-600 uppercase tracking-widest mb-2">Prochains combats</div>
          <div className="flex gap-4 overflow-x-auto">
            {next.map((m: any, i: number) => (
              <div key={m.id} className="shrink-0 bg-[#1A1A1A] rounded-lg px-4 py-2 flex items-center gap-3 border border-[#2E2E2E]">
                <span className="text-gray-600 text-xs">#{i + 1}</span>
                <span className="text-sm font-semibold text-red-400">{m.red_name || '?'}</span>
                <span className="text-gray-600 text-xs">vs</span>
                <span className="text-sm font-semibold text-blue-400">{m.blue_name || '?'}</span>
                <span className="text-xs text-gray-600 ml-2">{m.age_category} {m.weight_category}kg</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
