import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Upload, Search, Users, X, FileText, AlertCircle } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const WEIGH_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  done:       { label: '',             color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  no_show:    { label: 'Absent',       color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  overweight: { label: 'Hors cat.',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  pending:    { label: 'En attente',  color: '#6b7280', bg: 'rgba(107,114,128,0.1)'  },
};

const TH: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const TD: React.CSSProperties = { padding: '11px 16px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' };

import React from 'react';

export default function Registrations() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [search,     setSearch]     = useState('');
  const [showImport, setShowImport] = useState(false);
  const [csvText,    setCsvText]    = useState('');

  const { data: regs = [], isLoading } = useQuery({
    queryKey: ['registrations', id],
    queryFn: () => api.get(`/api/tournaments/${id}/registrations`).then(r => r.data),
  });

  const importMutation = useMutation({
    mutationFn: (csv: string) => api.post(`/api/tournaments/${id}/registrations/import`, { csv_data: csv }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['registrations', id] });
      toast.success(`${r.data.registered} combattants inscrits`);
      if (r.data.errors?.length) toast.error(`${r.data.errors.length} erreur(s) ignorée(s)`);
      setShowImport(false); setCsvText('');
    },
    onError: () => toast.error('Erreur lors de l\'import'),
  });

  const filtered = regs.filter((r: any) =>
    !search || `${r.last_name} ${r.first_name} ${r.license_number} ${r.club_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const byCategory = regs.reduce((acc: any, r: any) => {
    const k = r.final_age_category || 'N/A';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const done = regs.filter((r: any) => r.weigh_in_status === 'done').length;

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Inscriptions"
        subtitle={`${regs.length} combattants · ${done} pesées validées`}
        actions={
          <button onClick={() => setShowImport(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
            <Upload size={14} /> Importer CSV FFLDA
          </button>
        }
      />

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Category pills */}
        {Object.keys(byCategory).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b)).map(([cat, count]: any) => (
              <button key={cat} onClick={() => setSearch(cat)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#60a5fa', cursor: 'pointer' }}>
                {cat} <span style={{ fontWeight: 900 }}>{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 340 }}>
          <Search size={14} color="#4b5563" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 36px', fontSize: 13, color: '#fff', outline: 'none' }}
            placeholder="Nom, licence, club…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Combattant', 'Licence', 'Club', 'Catégorie', 'Style', 'Pesée'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', padding: '48px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#374151', animation: 'bounce 1s infinite', animationDelay: `${i * 150}ms` }} />)}
                  </div>
                </td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', padding: '64px 16px' }}>
                  <Users size={28} color="#374151" style={{ margin: '0 auto 10px' }} />
                  <div style={{ color: '#4b5563', fontWeight: 500 }}>{search ? 'Aucun résultat' : 'Aucun combattant inscrit'}</div>
                  {!search && <div style={{ color: '#374151', fontSize: 12, marginTop: 4 }}>Importez un fichier CSV FFLDA pour commencer</div>}
                </td></tr>
              )}
              {filtered.map((r: any) => {
                const w = WEIGH_STATUS[r.weigh_in_status] || WEIGH_STATUS.pending;
                return (
                  <tr key={r.id}>
                    <td style={TD}><span style={{ fontWeight: 600, color: '#fff' }}>{r.last_name} {r.first_name}</span></td>
                    <td style={TD}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 5 }}>{r.license_number || '—'}</span></td>
                    <td style={{ ...TD, color: '#6b7280' }}>{r.club_short || r.club_name || '—'}</td>
                    <td style={TD}>
                      {r.final_age_category
                        ? <span style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{r.final_age_category}</span>
                        : <span style={{ color: '#374151' }}>—</span>}
                    </td>
                    <td style={{ ...TD, color: '#4b5563', fontSize: 12, textTransform: 'capitalize' }}>{r.final_style || '—'}</td>
                    <td style={TD}>
                      {r.weigh_in_status === 'done'
                        ? <span style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{r.weigh_in_weight_kg} kg ✓</span>
                        : <span style={{ background: w.bg, color: w.color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{w.label}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 640, boxShadow: '0 40px 120px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} color="#60a5fa" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>Importer CSV FFLDA</div>
                  <div style={{ fontSize: 12, color: '#4b5563' }}>Séparateur point-virgule</div>
                </div>
              </div>
              <button onClick={() => { setShowImport(false); setCsvText(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#fbbf24' }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Collez le contenu exporté depuis le site FFLDA. Format : <code style={{ fontFamily: 'monospace', color: '#fcd34d' }}>"Style";"Catégorie d'âge";"Statut";"N° Licence"…</code></span>
              </div>
              <textarea
                style={{ width: '100%', height: 180, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, fontSize: 12, color: '#fff', fontFamily: 'monospace', resize: 'none', outline: 'none' }}
                placeholder={`"Lutte gréco-romaine";"U15";"Licencié";"123456";"DUPONT";"Pierre"…`}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowImport(false); setCsvText(''); }} style={{ padding: '8px 16px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Annuler</button>
                <button
                  onClick={() => importMutation.mutate(csvText)}
                  disabled={!csvText.trim() || importMutation.isPending}
                  style={{ padding: '8px 18px', borderRadius: 9, background: csvText.trim() ? '#dc2626' : '#7f1d1d', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: csvText.trim() ? 'pointer' : 'not-allowed' }}
                >
                  {importMutation.isPending ? 'Import en cours…' : <><Upload size={13} style={{ display: 'inline', marginRight: 6 }} />Importer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
