import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Search, X, Scale } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:    { label: 'En attente',     color: '#6b7280', bg: 'rgba(107,114,128,0.1)',  dot: '#4b5563'  },
  done:       { label: 'Pesé',           color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  dot: '#22c55e'  },
  overweight: { label: 'Hors catégorie', color: '#f87171', bg: 'rgba(248,113,113,0.12)', dot: '#ef4444'  },
  no_show:    { label: 'Absent',         color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  dot: '#f59e0b'  },
};

export default function WeighIn() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [weight,   setWeight]   = useState('');
  const [status,   setStatus]   = useState('done');
  const [filter,   setFilter]   = useState('all');

  const { data: regs = [] } = useQuery({
    queryKey: ['registrations', id],
    queryFn: () => api.get(`/api/tournaments/${id}/registrations`).then(r => r.data),
    refetchInterval: 5000,
  });

  const mutation = useMutation({
    mutationFn: ({ regId, data }: any) => api.put(`/api/tournaments/${id}/registrations/${regId}/weigh-in`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registrations', id] });
      toast.success('Pesée enregistrée');
      setSelected(null); setWeight(''); setStatus('done');
    },
    onError: () => toast.error('Erreur lors de la pesée'),
  });

  const pending    = regs.filter((r: any) => r.weigh_in_status === 'pending').length;
  const done       = regs.filter((r: any) => r.weigh_in_status === 'done').length;
  const overweight = regs.filter((r: any) => r.weigh_in_status === 'overweight').length;
  const noShow     = regs.filter((r: any) => r.weigh_in_status === 'no_show').length;
  const progress   = regs.length > 0 ? Math.round(((done + overweight + noShow) / regs.length) * 100) : 0;

  const filtered = regs.filter((r: any) => {
    const matchSearch = !search || `${r.last_name} ${r.first_name} ${r.license_number}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || r.weigh_in_status === filter;
    return matchSearch && matchFilter;
  });

  const openSelected = (reg: any) => {
    setSelected(reg);
    setWeight(reg.weigh_in_weight_kg || '');
    setStatus(reg.weigh_in_status === 'pending' ? 'done' : (reg.weigh_in_status || 'done'));
  };

  const statusActions = [
    { v: 'done',       l: '✓ Pesé',       color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.3)'  },
    { v: 'overweight', l: '↑ Hors cat.',   color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
    { v: 'no_show',    l: '— Absent',      color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)'  },
    { v: 'pending',    l: '⏳ Attente',     color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' },
  ];

  return (
    <Layout tournamentId={id}>
      <PageHeader title="Pesée" subtitle={`${done} / ${regs.length} validés · ${pending} en attente`} />

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Progress */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: `Pesés: ${done}`,          color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.2)'  },
                { label: `Attente: ${pending}`,      color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.15)'},
                ...(overweight > 0 ? [{ label: `Hors cat.: ${overweight}`, color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.2)' }] : []),
                ...(noShow > 0 ? [{ label: `Absents: ${noShow}`, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.2)' }] : []),
              ].map(({ label, color, bg, border }) => (
                <span key={label} style={{ background: bg, border: `1px solid ${border}`, color, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{label}</span>
              ))}
            </div>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{progress}%</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#16a34a,#4ade80)', borderRadius: 3, transition: 'width 0.7s ease' }} />
          </div>
        </div>

        {/* Split layout */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* Left: list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} color="#4b5563" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px 8px 36px', fontSize: 13, color: '#fff', outline: 'none' }}
                  placeholder="Nom, prénom, numéro de licence…"
                  value={search} onChange={e => setSearch(e.target.value)} autoFocus
                />
              </div>
              <select
                value={filter} onChange={e => setFilter(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#d1d5db', outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">Tous</option>
                <option value="pending">En attente</option>
                <option value="done">Pesés</option>
                <option value="overweight">Hors cat.</option>
                <option value="no_show">Absents</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
              {filtered.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px', textAlign: 'center' }}>
                  <Scale size={28} color="#374151" style={{ marginBottom: 10 }} />
                  <div style={{ color: '#4b5563', fontSize: 13 }}>Aucun résultat</div>
                </div>
              )}
              {filtered.map((reg: any) => {
                const s = STATUS_INFO[reg.weigh_in_status] || STATUS_INFO.pending;
                const isSel = selected?.id === reg.id;
                return (
                  <button key={reg.id} onClick={() => openSelected(reg)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10,
                    background: isSel ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${isSel ? 'rgba(220,38,38,0.35)' : 'rgba(255,255,255,0.06)'}`,
                    cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.1s',
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{reg.last_name} <span style={{ fontWeight: 400 }}>{reg.first_name}</span></div>
                      <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>
                        <span style={{ fontFamily: 'monospace' }}>{reg.license_number}</span>
                        {(reg.club_short || reg.club_name) && <> · {reg.club_short || reg.club_name}</>}
                        {reg.final_age_category && <> · <span style={{ color: '#6b7280' }}>{reg.final_age_category}</span></>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {reg.weigh_in_weight_kg && <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{reg.weigh_in_weight_kg} kg</span>}
                      <span style={{ background: s.bg, color: s.color, borderRadius: 5, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{s.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: weighin panel */}
          {selected ? (
            <div style={{ width: 280, flexShrink: 0, position: 'sticky', top: 20 }}>
              <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Athlete info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{selected.last_name} {selected.first_name}</div>
                    <div style={{ fontSize: 11, color: '#4b5563', fontFamily: 'monospace', marginTop: 3 }}>{selected.license_number}</div>
                    <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>{selected.club_name}</div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', display: 'flex', padding: 2 }}><X size={15} /></button>
                </div>

                {selected.default_weight_kg && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Poids licence</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{selected.default_weight_kg} kg</span>
                  </div>
                )}

                {/* Weight input */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Poids relevé (kg)</label>
                  <input
                    type="number" step="0.1" min="0" max="200"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px', fontSize: 28, fontWeight: 900, color: '#fff', textAlign: 'center', outline: 'none', letterSpacing: '-1px' }}
                    value={weight} onChange={e => setWeight(e.target.value)} placeholder="0.0" autoFocus
                  />
                </div>

                {/* Status buttons */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Statut</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {statusActions.map(({ v, l, color, bg, border }) => (
                      <button key={v} onClick={() => setStatus(v)} style={{
                        padding: '9px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: status === v ? bg : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${status === v ? border : 'rgba(255,255,255,0.07)'}`,
                        color: status === v ? color : '#4b5563',
                        transition: 'all 0.1s',
                      }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={() => mutation.mutate({ regId: selected.id, data: { weigh_in_weight_kg: parseFloat(weight) || null, weigh_in_status: status } })}
                  disabled={mutation.isPending}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(220,38,38,0.3)' }}
                >
                  {mutation.isPending ? 'Enregistrement…' : 'Valider la pesée'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ width: 280, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: '#374151', textAlign: 'center' }}>
              <div>
                <Scale size={32} color="#374151" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13 }}>Sélectionner un combattant</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
