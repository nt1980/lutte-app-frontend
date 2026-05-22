import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Search, Users, X, FileText, AlertCircle, Plus, Trash2 } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const TH: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const TD: React.CSSProperties = { padding: '11px 16px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' };

import React from 'react';

interface FormData {
  license_number: string;
  first_name: string;
  last_name: string;
  gender: string;
  nationality: string;
  birth_date: string;
  style: string;
  age_category_imported: string;
  default_weight_kg: string;
}

function GBadge({ g }: { g: string }) {
  const cfg = g === 'M'
    ? { text: 'M',   bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.25)' }
    : g === 'F'
    ? { text: 'F',   bg: 'rgba(236,72,153,0.12)',  color: '#f472b6', border: 'rgba(236,72,153,0.25)' }
    : { text: '?',   bg: 'rgba(107,114,128,0.1)',  color: '#9ca3af', border: 'rgba(107,114,128,0.2)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', height: 17, borderRadius: 4, fontSize: 10, fontWeight: 800, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.text}
    </span>
  );
}

export default function Athletes() {
  const qc = useQueryClient();
  const [search,       setSearch]       = useState('');
  const [filterGender, setFilterGender] = useState<string | null>(null);
  const [showImport,   setShowImport]   = useState(false);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [csvText,      setCsvText]      = useState('');
  const [formData,     setFormData]     = useState<FormData>({
    license_number: '',
    first_name: '',
    last_name: '',
    gender: 'M',
    nationality: 'France',
    birth_date: '',
    style: '',
    age_category_imported: '',
    default_weight_kg: '',
  });

  const { data: athletesRaw = [], isLoading } = useQuery({
    queryKey: ['athletes', search],
    queryFn: () => api.get('/api/athletes', { params: { search } }).then(r => r.data),
  });
  const athletes = filterGender
    ? athletesRaw.filter((a: any) => a.gender === filterGender)
    : athletesRaw;

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

  const addAthlMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/api/athletes', {
      license_number: data.license_number,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender,
      nationality: data.nationality || 'France',
      birth_date: data.birth_date || null,
      style: data.style || null,
      age_category_imported: data.age_category_imported || null,
      default_weight_kg: data.default_weight_kg ? parseFloat(data.default_weight_kg) : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athletes'] });
      toast.success('Athlète ajouté');
      setShowAddForm(false);
      setFormData({
        license_number: '', first_name: '', last_name: '', gender: 'M',
        nationality: 'France', birth_date: '', style: '', age_category_imported: '', default_weight_kg: '',
      });
    },
    onError: () => toast.error('Erreur lors de l\'ajout'),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => api.delete('/api/athletes'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athletes'] });
      toast.success('Tous les athlètes supprimés');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleDeleteAll = () => {
    if (confirm('⚠️ Êtes-vous sûr ? Cette action est irréversible.')) {
      deleteAllMutation.mutate();
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Licenciés FFLDA"
        subtitle={`${athletesRaw.length} athlètes dans la base`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setShowAddForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#10b981', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
              <Plus size={14} /> Ajouter
            </button>
            <button onClick={() => setShowImport(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <Upload size={14} /> Importer CSV
            </button>
            {athletes.length > 0 && (
              <button onClick={handleDeleteAll} disabled={deleteAllMutation.isPending} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ef4444', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: deleteAllMutation.isPending ? 'not-allowed' : 'pointer', opacity: deleteAllMutation.isPending ? 0.5 : 1, boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
                <Trash2 size={14} /> {deleteAllMutation.isPending ? 'Suppression…' : 'Tout effacer'}
              </button>
            )}
          </div>
        }
      />

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Gender filter + Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Gender pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ label: 'Tous', val: null }, { label: 'M', val: 'M' }, { label: 'F', val: 'F' }].map(({ label, val }) => {
              const active = filterGender === val;
              const isM = val === 'M', isF = val === 'F';
              return (
                <button key={label} onClick={() => setFilterGender(val)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', border: 'none',
                    background: active
                      ? (isM ? 'rgba(59,130,246,0.25)' : isF ? 'rgba(236,72,153,0.25)' : 'rgba(255,255,255,0.1)')
                      : 'rgba(255,255,255,0.04)',
                    color: active
                      ? (isM ? '#60a5fa' : isF ? '#f472b6' : '#fff')
                      : '#6b7280',
                    boxShadow: active
                      ? (isM ? '0 0 0 1px rgba(59,130,246,0.4)' : isF ? '0 0 0 1px rgba(236,72,153,0.4)' : '0 0 0 1px rgba(255,255,255,0.15)')
                      : 'none',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 300, flex: 1 }}>
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
        </div>

        {/* Table */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Sexe', 'Combattant', 'Licence', 'Club', 'Catégorie', 'Style', 'Poids', 'Naissance'].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} style={{ ...TD, textAlign: 'center', padding: '48px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#374151', animation: 'bounce 1s infinite', animationDelay: `${i * 150}ms` }} />)}
                  </div>
                </td></tr>
              )}
              {!isLoading && athletes.length === 0 && (
                <tr><td colSpan={8} style={{ ...TD, textAlign: 'center', padding: '64px 16px' }}>
                  <Users size={28} color="#374151" style={{ margin: '0 auto 10px' }} />
                  <div style={{ color: '#4b5563', fontWeight: 500 }}>{search ? 'Aucun résultat' : 'Aucun licencié'}</div>
                  {!search && <div style={{ color: '#374151', fontSize: 12, marginTop: 4 }}>Importez un fichier CSV FFLDA pour peupler la base</div>}
                </td></tr>
              )}
              {athletes.map((a: any) => (
                <tr key={a.id}>
                  <td style={{ ...TD, textAlign: 'center', width: 52 }}><GBadge g={a.gender} /></td>
                  <td style={TD}>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{a.last_name} {a.first_name}</span>
                    {a.nationality && <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>{a.nationality}</div>}
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

      {/* Add Athlete Modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 600, boxShadow: '0 40px 120px rgba(0,0,0,0.8)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: '#121212' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={16} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>Ajouter un athlète</div>
                  <div style={{ fontSize: 12, color: '#4b5563' }}>Saisie manuelle</div>
                </div>
              </div>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* License Number */}
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#d1d5db', marginBottom: 6 }}>N° Licence *</label>
                <input type="text" value={formData.license_number} onChange={(e) => setFormData({...formData, license_number: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none' }} />
              </div>
              {/* Last Name */}
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#d1d5db', marginBottom: 6 }}>Nom *</label>
                <input type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none' }} />
              </div>
              {/* First Name */}
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#d1d5db', marginBottom: 6 }}>Prénom *</label>
                <input type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none' }} />
              </div>
              {/* Gender */}
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#d1d5db', marginBottom: 6 }}>Sexe *</label>
                <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none' }}>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              {/* Birth Date */}
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#d1d5db', marginBottom: 6 }}>Date de naissance</label>
                <input type="date" value={formData.birth_date} onChange={(e) => setFormData({...formData, birth_date: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none' }} />
              </div>
              {/* Nationality */}
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#d1d5db', marginBottom: 6 }}>Nationalité</label>
                <input type="text" value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none' }} />
              </div>
              {/* Style */}
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#d1d5db', marginBottom: 6 }}>Style</label>
                <select value={formData.style} onChange={(e) => setFormData({...formData, style: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none' }}>
                  <option value="">—</option>
                  <option value="libre">Libre</option>
                  <option value="greco">Gréco-romaine</option>
                  <option value="feminine">Féminin</option>
                </select>
              </div>
              {/* Weight */}
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#d1d5db', marginBottom: 6 }}>Poids (kg)</label>
                <input type="number" step="0.1" value={formData.default_weight_kg} onChange={(e) => setFormData({...formData, default_weight_kg: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none' }} />
              </div>
              {/* Age Category */}
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#d1d5db', marginBottom: 6 }}>Catégorie d'âge</label>
                <input type="text" value={formData.age_category_imported} onChange={(e) => setFormData({...formData, age_category_imported: e.target.value})} placeholder="ex: U13, U15..." style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setShowAddForm(false)} style={{ padding: '8px 16px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => addAthlMutation.mutate(formData)} disabled={!formData.license_number || !formData.first_name || !formData.last_name || addAthlMutation.isPending} style={{ padding: '8px 18px', borderRadius: 9, background: (formData.license_number && formData.first_name && formData.last_name) ? '#10b981' : '#065f46', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: (formData.license_number && formData.first_name && formData.last_name && !addAthlMutation.isPending) ? 'pointer' : 'not-allowed' }}>
                {addAthlMutation.isPending ? 'Ajout…' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

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
