import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Upload, Search, Users, X, FileText, AlertCircle, Plus, Trash2, Pencil } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────

const AGE_CATEGORIES = ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U20', 'U23', 'Senior', 'Vétéran'];
const STYLES = ['Libre', 'Gréco-romaine', 'Féminin', 'Jeune'];

const WEIGH_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  done:       { label: '',            color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  no_show:    { label: 'Absent',      color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  overweight: { label: 'Hors cat.',  color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  pending:    { label: 'En attente', color: 'var(--fg3)', bg: 'var(--inp)'          },
};

const TH: React.CSSProperties = {
  padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
  color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em',
  background: 'var(--inp)', borderBottom: '1px solid var(--b2)',
};
const TD: React.CSSProperties = {
  padding: '11px 16px', fontSize: 13, borderBottom: '1px solid var(--b1)',
  verticalAlign: 'middle', color: 'var(--fg)',
};
const inp: React.CSSProperties = {
  width: '100%', background: 'var(--inp)', border: '1px solid var(--b3)',
  borderRadius: 10, padding: '8px 12px', fontSize: 13, color: 'var(--fg)', outline: 'none',
  boxSizing: 'border-box',
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg2)', marginBottom: 6,
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = 'new' | 'existing';

interface AddForm {
  mode: Mode;
  // New athlete
  first_name: string; last_name: string; gender: string;
  license_number: string; club_id: string;
  // Existing
  athlete_id: string;
  // Registration (both modes)
  final_age_category: string; final_style: string;
}

interface EditForm {
  reg_id: string; athlete_id: string;
  first_name: string; last_name: string; gender: string;
  license_number: string; club_id: string;
  final_age_category: string; final_style: string;
}

const EMPTY_ADD: AddForm = {
  mode: 'new', first_name: '', last_name: '', gender: 'M',
  license_number: '', club_id: '', athlete_id: '',
  final_age_category: '', final_style: '',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function GBadge({ g }: { g: string }) {
  const cfg = g === 'M'
    ? { text: 'M', bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' }
    : g === 'F'
    ? { text: 'F', bg: 'rgba(236,72,153,0.12)', color: '#f472b6', border: 'rgba(236,72,153,0.25)' }
    : { text: '?', bg: 'rgba(107,114,128,0.1)',  color: '#9ca3af', border: 'rgba(107,114,128,0.2)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 5px', height: 17, borderRadius: 4, fontSize: 10, fontWeight: 800,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0 }}>
      {cfg.text}
    </span>
  );
}

function SexeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[{ v: 'M', label: 'Masculin', color: '#60a5fa' }, { v: 'F', label: 'Féminin', color: '#f472b6' }].map(opt => (
        <button key={opt.v} type="button" onClick={() => onChange(opt.v)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: `1px solid ${value === opt.v ? opt.color : 'var(--b3)'}`,
            background: value === opt.v ? `rgba(${opt.v === 'M' ? '96,165,250' : '244,114,182'},0.1)` : 'var(--inp)',
            color: value === opt.v ? opt.color : 'var(--fg3)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface FieldsProps {
  values: { first_name: string; last_name: string; gender: string; license_number: string; club_id: string; final_age_category: string; final_style: string };
  clubs: any[];
  onChange: (key: string, value: string) => void;
}

function AthleteFields({ values, clubs, onChange }: FieldsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Nom / Prénom côte-à-côte */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={lbl}>Nom *</label>
          <input style={inp} placeholder="DUPONT" value={values.last_name}
            onChange={e => onChange('last_name', e.target.value.toUpperCase())} />
        </div>
        <div>
          <label style={lbl}>Prénom *</label>
          <input style={inp} placeholder="Pierre" value={values.first_name}
            onChange={e => onChange('first_name', e.target.value)} />
        </div>
      </div>

      {/* Sexe */}
      <div>
        <label style={lbl}>Sexe *</label>
        <SexeSelect value={values.gender} onChange={v => onChange('gender', v)} />
      </div>

      {/* Licence */}
      <div>
        <label style={lbl}>N° Licence</label>
        <input style={inp} placeholder="123456" value={values.license_number}
          onChange={e => onChange('license_number', e.target.value)} />
      </div>

      {/* Club */}
      <div>
        <label style={lbl}>Club</label>
        <select style={inp} value={values.club_id} onChange={e => onChange('club_id', e.target.value)}>
          <option value="">— Sélectionner un club —</option>
          {clubs.map((c: any) => (
            <option key={c.id} value={c.id}>{c.short_name ? `${c.short_name} – ` : ''}{c.name}</option>
          ))}
        </select>
      </div>

      {/* Catégorie + Style côte-à-côte */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={lbl}>Catégorie d'âge</label>
          <select style={inp} value={values.final_age_category} onChange={e => onChange('final_age_category', e.target.value)}>
            <option value="">—</option>
            {AGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Style</label>
          <select style={inp} value={values.final_style} onChange={e => onChange('final_style', e.target.value)}>
            <option value="">—</option>
            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function RegFields({ values, onChange }: { values: { final_age_category: string; final_style: string }; onChange: (k: string, v: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div>
        <label style={lbl}>Catégorie d'âge</label>
        <select style={inp} value={values.final_age_category} onChange={e => onChange('final_age_category', e.target.value)}>
          <option value="">—</option>
          {AGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label style={lbl}>Style</label>
        <select style={inp} value={values.final_style} onChange={e => onChange('final_style', e.target.value)}>
          <option value="">—</option>
          {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}

interface ModalProps {
  title: string; subtitle: string;
  icon: React.ReactNode; iconBg: string; iconBorder: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}
function Modal({ title, subtitle, icon, iconBg, iconBorder, onClose, children, wide }: ModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--ovl)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--b3)', borderRadius: 20,
        width: '100%', maxWidth: wide ? 620 : 520, boxShadow: '0 40px 120px rgba(0,0,0,0.4)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--b2)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg,
              border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--fg)', fontSize: 15 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--fg3)' }}>{subtitle}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg3)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
        {/* Scrollable body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

interface FooterProps { onCancel: () => void; onConfirm: () => void; confirmLabel: string; disabled: boolean; confirmColor: string; }
function ModalFooter({ onCancel, onConfirm, confirmLabel, disabled, confirmColor }: FooterProps) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 20, borderTop: '1px solid var(--b2)', marginTop: 20 }}>
      <button onClick={onCancel}
        style={{ padding: '8px 16px', borderRadius: 9, background: 'var(--inp)', border: '1px solid var(--b3)', color: 'var(--fg2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
        Annuler
      </button>
      <button onClick={onConfirm} disabled={disabled}
        style={{ padding: '8px 20px', borderRadius: 9, background: disabled ? 'var(--dim)' : confirmColor,
          color: '#fff', fontSize: 13, fontWeight: 600, border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}>
        {confirmLabel}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Registrations() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const [search,       setSearch]       = useState('');
  const [showImport,   setShowImport]   = useState(false);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [csvText,      setCsvText]      = useState('');
  const [addForm,      setAddForm]      = useState<AddForm>(EMPTY_ADD);
  const [editForm,     setEditForm]     = useState<EditForm | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: regs = [], isLoading } = useQuery({
    queryKey: ['registrations', id],
    queryFn: () => api.get(`/api/tournaments/${id}/registrations`).then(r => r.data),
  });

  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => api.get('/api/clubs').then(r => r.data),
  });

  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes'],
    queryFn: () => api.get('/api/athletes').then(r => r.data),
    enabled: showAddForm && addForm.mode === 'existing',
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addNewMutation = useMutation({
    mutationFn: async (form: AddForm) => {
      const athleteRes = await api.post('/api/athletes', {
        first_name: form.first_name,
        last_name: form.last_name,
        gender: form.gender,
        license_number: form.license_number || `TMP-${Date.now()}`,
        club_id: form.club_id || null,
      });
      await api.post(`/api/tournaments/${id}/registrations`, {
        athlete_id: athleteRes.data.id,
        final_age_category: form.final_age_category || null,
        final_style: form.final_style || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registrations', id] });
      toast.success('Combattant inscrit');
      setShowAddForm(false); setAddForm(EMPTY_ADD);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Erreur lors de l\'inscription'),
  });

  const addExistingMutation = useMutation({
    mutationFn: (form: AddForm) => api.post(`/api/tournaments/${id}/registrations`, {
      athlete_id: form.athlete_id,
      final_age_category: form.final_age_category || null,
      final_style: form.final_style || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registrations', id] });
      toast.success('Combattant inscrit');
      setShowAddForm(false); setAddForm(EMPTY_ADD);
    },
    onError: () => toast.error('Erreur lors de l\'inscription'),
  });

  const editMutation = useMutation({
    mutationFn: (form: EditForm) => api.put(`/api/tournaments/${id}/registrations/${form.reg_id}`, {
      first_name: form.first_name,
      last_name: form.last_name,
      gender: form.gender,
      license_number: form.license_number || null,
      club_id: form.club_id || null,
      final_age_category: form.final_age_category || null,
      final_style: form.final_style || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registrations', id] });
      toast.success('Combattant modifié');
      setShowEditForm(false); setEditForm(null);
    },
    onError: () => toast.error('Erreur lors de la modification'),
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

  const deleteRegMutation = useMutation({
    mutationFn: (regId: string) => api.delete(`/api/tournaments/${id}/registrations/${regId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['registrations', id] }); toast.success('Inscription supprimée'); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => api.delete(`/api/tournaments/${id}/registrations`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['registrations', id] }); toast.success('Toutes les inscriptions supprimées'); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openEdit = (r: any) => {
    setEditForm({
      reg_id: r.id,
      athlete_id: r.athlete_id,
      first_name: r.first_name || '',
      last_name: r.last_name || '',
      gender: r.gender || 'M',
      license_number: r.license_number || '',
      club_id: r.club_id || '',
      final_age_category: r.final_age_category || '',
      final_style: r.final_style || '',
    });
    setShowEditForm(true);
  };

  const handleAdd = () => {
    if (addForm.mode === 'new') {
      if (!addForm.first_name || !addForm.last_name) { toast.error('Prénom et nom sont requis'); return; }
      addNewMutation.mutate(addForm);
    } else {
      if (!addForm.athlete_id) { toast.error('Sélectionnez un athlète'); return; }
      addExistingMutation.mutate(addForm);
    }
  };

  const isAddPending = addNewMutation.isPending || addExistingMutation.isPending;

  // ── Derived ─────────────────────────────────────────────────────────────────

  const filtered = regs.filter((r: any) =>
    !search || `${r.last_name} ${r.first_name} ${r.license_number} ${r.club_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const byCategory = regs.reduce((acc: any, r: any) => {
    const k = r.final_age_category || 'N/A'; acc[k] = (acc[k] || 0) + 1; return acc;
  }, {});

  const done = regs.filter((r: any) => r.weigh_in_status === 'done').length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Inscriptions"
        subtitle={`${regs.length} combattants · ${done} pesées validées`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => { setAddForm(EMPTY_ADD); setShowAddForm(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#10b981', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
              <Plus size={14} /> Ajouter
            </button>
            <button onClick={() => setShowImport(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <Upload size={14} /> Importer CSV
            </button>
            {regs.length > 0 && (
              <button onClick={() => { if (confirm('⚠️ Supprimer toutes les inscriptions ?')) deleteAllMutation.mutate(); }}
                disabled={deleteAllMutation.isPending}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ef4444', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: deleteAllMutation.isPending ? 'not-allowed' : 'pointer', opacity: deleteAllMutation.isPending ? 0.5 : 1, boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
                <Trash2 size={14} /> {deleteAllMutation.isPending ? 'Suppression…' : 'Tout effacer'}
              </button>
            )}
          </div>
        }
      />

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Category chips */}
        {Object.keys(byCategory).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b)).map(([cat, count]: any) => (
              <button key={cat} onClick={() => setSearch(prev => prev === cat ? '' : cat)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: search === cat ? 'rgba(96,165,250,0.2)' : 'rgba(96,165,250,0.1)', border: `1px solid ${search === cat ? 'rgba(96,165,250,0.5)' : 'rgba(96,165,250,0.2)'}`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#60a5fa', cursor: 'pointer' }}>
                {cat} <span style={{ fontWeight: 900 }}>{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 340 }}>
          <Search size={14} color="var(--faint)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input style={{ width: '100%', background: 'var(--inp)', border: '1px solid var(--b3)', borderRadius: 10, padding: '8px 36px', fontSize: 13, color: 'var(--fg)', outline: 'none' }}
            placeholder="Nom, licence, club…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg3)', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Combattant', 'Sexe', 'Licence', 'Club', 'Catégorie', 'Style', 'Pesée', 'Actions'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} style={{ ...TD, textAlign: 'center', padding: '48px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--dim)', animation: 'bounce 1s infinite', animationDelay: `${i * 150}ms` }} />)}
                  </div>
                </td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} style={{ ...TD, textAlign: 'center', padding: '64px 16px' }}>
                  <Users size={28} color="var(--dim)" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <div style={{ color: 'var(--fg3)', fontWeight: 500 }}>{search ? 'Aucun résultat' : 'Aucun combattant inscrit'}</div>
                  {!search && <div style={{ color: 'var(--faint)', fontSize: 12, marginTop: 4 }}>Importez un CSV ou ajoutez manuellement</div>}
                </td></tr>
              )}
              {filtered.map((r: any) => {
                const w = WEIGH_STATUS[r.weigh_in_status] || WEIGH_STATUS.pending;
                return (
                  <tr key={r.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={TD}><span style={{ fontWeight: 600 }}>{r.last_name} {r.first_name}</span></td>
                    <td style={{ ...TD, textAlign: 'center', width: 52 }}><GBadge g={r.gender} /></td>
                    <td style={TD}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--fg3)', background: 'var(--inp)', padding: '2px 6px', borderRadius: 5 }}>
                        {r.license_number || '—'}
                      </span>
                    </td>
                    <td style={{ ...TD, color: 'var(--fg3)' }}>{r.club_short || r.club_name || '—'}</td>
                    <td style={TD}>
                      {r.final_age_category
                        ? <span style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{r.final_age_category}</span>
                        : <span style={{ color: 'var(--faint)' }}>—</span>}
                    </td>
                    <td style={{ ...TD, color: 'var(--fg3)', fontSize: 12 }}>{r.final_style || '—'}</td>
                    <td style={TD}>
                      {r.weigh_in_status === 'done'
                        ? <span style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{r.weigh_in_weight_kg} kg ✓</span>
                        : <span style={{ background: w.bg, color: w.color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{w.label || 'En attente'}</span>}
                    </td>
                    <td style={{ ...TD }}>
                      <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                        <button onClick={() => openEdit(r)}
                          style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500 }}>
                          <Pencil size={11} /> Modifier
                        </button>
                        <button onClick={() => { if (confirm(`Supprimer ${r.last_name} ${r.first_name} ?`)) deleteRegMutation.mutate(r.id); }}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500 }}>
                          <Trash2 size={11} /> Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Modal ─────────────────────────────────────────────────────────── */}
      {showAddForm && (
        <Modal
          title="Inscrire un combattant"
          subtitle={addForm.mode === 'new' ? 'Création d\'un nouvel athlète' : 'Athlète existant dans la base'}
          icon={<Plus size={16} color="#10b981" />}
          iconBg="rgba(16,185,129,0.1)" iconBorder="rgba(16,185,129,0.2)"
          onClose={() => { setShowAddForm(false); setAddForm(EMPTY_ADD); }}>

          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--b1)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
            {(['new', 'existing'] as Mode[]).map(m => (
              <button key={m} type="button" onClick={() => setAddForm(f => ({ ...f, mode: m }))}
                style={{ flex: 1, padding: '7px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  background: addForm.mode === m ? 'var(--card)' : 'transparent',
                  color: addForm.mode === m ? 'var(--fg)' : 'var(--fg3)',
                  boxShadow: addForm.mode === m ? '0 1px 4px rgba(0,0,0,0.3)' : 'none' }}>
                {m === 'new' ? '✦ Nouvel athlète' : '⊕ Athlète existant'}
              </button>
            ))}
          </div>

          {addForm.mode === 'new' ? (
            <AthleteFields
              values={addForm}
              clubs={clubs}
              onChange={(k, v) => setAddForm(f => ({ ...f, [k]: v }))}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Combattant *</label>
                <select style={inp} value={addForm.athlete_id} onChange={e => setAddForm(f => ({ ...f, athlete_id: e.target.value }))}>
                  <option value="">— Sélectionner un athlète —</option>
                  {athletes.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.last_name} {a.first_name} · {a.license_number || 'sans licence'}
                    </option>
                  ))}
                </select>
              </div>
              <RegFields values={addForm} onChange={(k, v) => setAddForm(f => ({ ...f, [k]: v }))} />
            </div>
          )}

          <ModalFooter
            onCancel={() => { setShowAddForm(false); setAddForm(EMPTY_ADD); }}
            onConfirm={handleAdd}
            confirmLabel={isAddPending ? 'Inscription…' : 'Inscrire'}
            disabled={isAddPending || (addForm.mode === 'new' ? (!addForm.first_name || !addForm.last_name) : !addForm.athlete_id)}
            confirmColor="#10b981"
          />
        </Modal>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      {showEditForm && editForm && (
        <Modal
          title={`Modifier · ${editForm.last_name} ${editForm.first_name}`}
          subtitle="Informations du combattant et de l'inscription"
          icon={<Pencil size={16} color="#60a5fa" />}
          iconBg="rgba(96,165,250,0.1)" iconBorder="rgba(96,165,250,0.2)"
          onClose={() => { setShowEditForm(false); setEditForm(null); }}>

          <AthleteFields
            values={editForm}
            clubs={clubs}
            onChange={(k, v) => setEditForm(f => f ? { ...f, [k]: v } : f)}
          />

          <ModalFooter
            onCancel={() => { setShowEditForm(false); setEditForm(null); }}
            onConfirm={() => editMutation.mutate(editForm)}
            confirmLabel={editMutation.isPending ? 'Sauvegarde…' : 'Sauvegarder'}
            disabled={editMutation.isPending}
            confirmColor="#60a5fa"
          />
        </Modal>
      )}

      {/* ── Import Modal ──────────────────────────────────────────────────────── */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--ovl)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--b3)', borderRadius: 20,
            width: '100%', maxWidth: 640, boxShadow: '0 40px 120px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--b2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} color="#60a5fa" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--fg)', fontSize: 15 }}>Importer CSV FFLDA</div>
                  <div style={{ fontSize: 12, color: 'var(--fg3)' }}>Détection automatique du séparateur</div>
                </div>
              </div>
              <button onClick={() => { setShowImport(false); setCsvText(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg3)', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.18)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#60a5fa' }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Collez le CSV exporté depuis FFLDA. La détection du séparateur est automatique (virgule ou point-virgule).</span>
              </div>
              <textarea
                style={{ width: '100%', height: 180, background: 'var(--inp)', border: '1px solid var(--b3)', borderRadius: 10, padding: 12, fontSize: 12, color: 'var(--fg)', fontFamily: 'monospace', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                placeholder={`"Lutte gréco-romaine";"U15";"Licencié";"123456";"DUPONT";"Pierre"…`}
                value={csvText} onChange={e => setCsvText(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowImport(false); setCsvText(''); }}
                  style={{ padding: '8px 16px', borderRadius: 9, background: 'var(--inp)', border: '1px solid var(--b3)', color: 'var(--fg2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={() => importMutation.mutate(csvText)} disabled={!csvText.trim() || importMutation.isPending}
                  style={{ padding: '8px 18px', borderRadius: 9, background: csvText.trim() ? '#dc2626' : '#7f1d1d', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: csvText.trim() ? 'pointer' : 'not-allowed', opacity: !csvText.trim() ? 0.6 : 1 }}>
                  {importMutation.isPending ? 'Import en cours…' : 'Importer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
