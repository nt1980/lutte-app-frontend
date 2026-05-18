import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Search, Users, X, FileText, AlertCircle } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const TH: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const TD: React.CSSProperties = { padding: '11px 16px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' };

import React from 'react';

export default function Athletes() {
  const qc = useQueryClient();
  const [search,     setSearch]     = useState('');
  const [showImport, setShowImport] = useState(false);
  const [csvText,    setCsvText]    = useState('');

  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ['athletes', search],
    queryFn: () => api.get('/api/athletes', { params: { search } }).then(r => r.data),
  });

  const importMutation = useMutation({
    mutationFn: (csv: string) => api.post('/api/import/athletes', { csv_data: csv }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['athletes'] });
      toast.success(`${r.data.created} créés · ${r.data.updated} mis à jour`);
      if (r.data.errors?.length) toast.error(`${r.data.errors.length} erreur(s)`);
      setShowImport(false); setCsvText('');
    },
    onError: () => toast.error('Erreur lors de l\'import'),
  });

  return (
    <Layout>
      <PageHeader
        title="Licenciés FFLDA"
        subtitle={`${athletes.length} athlètes dans la base`}
        actions={
          <button onClick={() => setShowImport(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
            <Upload size={14} /> Importer CSV
          </button>
        }
      />

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 340 }}>
          <Search size={14} color="#4b5563" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 36px', fontSize: 13, color: '#fff', outline: 'none' }}
            placeholder="Nom, prénom, numéro de licence…"
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
              <tr>{['Combattant', 'Licence', 'Club', 'Catégorie', 'Style', 'Poids', 'Naissance'].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} style={{ ...TD, textAlign: 'center', padding: '48px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#374151', animation: 'bounce 1s infinite', animationDelay: `${i * 150}ms` }} />)}
                  </div>
                </td></tr>
              )}
              {!isLoading && athletes.length === 0 && (
                <tr><td colSpan={7} style={{ ...TD, textAlign: 'center', padding: '64px 16px' }}>
                  <Users size={28} color="#374151" style={{ margin: '0 auto 10px' }} />
                  <div style={{ color: '#4b5563', fontWeight: 500 }}>{search ? 'Aucun résultat' : 'Aucun licencié'}</div>
                  {!search && <div style={{ color: '#374151', fontSize: 12, marginTop: 4 }}>Importez un fichier CSV FFLDA pour peupler la base</div>}
                </td></tr>
              )}
              {athletes.map((a: any) => (
                <tr key={a.id}>
                  <td style={TD}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{a.last_name} {a.first_name}</div>
                    <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>
                      {a.gender === 'M' ? '♂ Masculin' : '♀ Féminin'}{a.nationality ? ` · ${a.nationality}` : ''}
                    </div>
                  </td>
                  <td style={TD}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 5 }}>{a.license_number || '—'}</span></td>
                  <td style={{ ...TD, color: '#6b7280' }}>{a.club_short || a.club_name || '—'}</td>
                  <td style={TD}>
                    {(a.age_category_imported || a.licensed_age_category)
                      ? <span style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{a.age_category_imported || a.licensed_age_category}</span>
                      : <span style={{ color: '#374151' }}>—</span>}
                  </td>
                  <td style={{ ...TD, color: '#4b5563', fontSize: 12, textTransform: 'capitalize' }}>{a.style || '—'}</td>
                  <td style={{ ...TD, color: '#d1d5db', fontSize: 13 }}>{a.default_weight_kg ? `${a.default_weight_kg} kg` : '—'}</td>
                  <td style={{ ...TD, color: '#4b5563', fontSize: 12, fontFamily: 'monospace' }}>{a.birth_date ? new Date(a.birth_date).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
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
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} color="#f87171" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>Importer licenciés FFLDA</div>
                  <div style={{ fontSize: 12, color: '#4b5563' }}>Format CSV point-virgule</div>
                </div>
              </div>
              <button onClick={() => { setShowImport(false); setCsvText(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#6b7280' }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Les données sont mises à jour si le licencié existe déjà (via le numéro de licence). Les informations sensibles sont ignorées.</span>
              </div>
              <textarea
                style={{ width: '100%', height: 180, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, fontSize: 12, color: '#fff', fontFamily: 'monospace', resize: 'none', outline: 'none' }}
                placeholder={`"Style";"Catégorie d'âge";"Statut";"N° Licence";"Nom";"Prénom"…`}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowImport(false); setCsvText(''); }} style={{ padding: '8px 16px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Annuler</button>
                <button onClick={() => importMutation.mutate(csvText)} disabled={!csvText.trim() || importMutation.isPending}
                  style={{ padding: '8px 18px', borderRadius: 9, background: csvText.trim() ? '#dc2626' : '#7f1d1d', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: csvText.trim() ? 'pointer' : 'not-allowed' }}>
                  {importMutation.isPending ? 'Import…' : 'Importer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
