import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Globe, Settings2, Copy, Check, ExternalLink, Activity, Plus, Trash2, Pencil, X, ToggleLeft, ToggleRight } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const LABEL: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 };
const INPUT: React.CSSProperties = { width: '100%', background: 'var(--inp)', border: '1px solid var(--b3)', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: 'var(--fg)', outline: 'none', boxSizing: 'border-box' as const };
const SELECT: React.CSSProperties = { width: '100%', background: 'var(--inp)', border: '1px solid var(--b3)', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: 'var(--fg)', outline: 'none', appearance: 'none' as const, cursor: 'pointer' };

const publicToggles = [
  { key: 'public_page_enabled',         label: 'Page publique',   desc: 'Active la page d\'accueil publique du tournoi',  path: (slug: string) => `/tournoi/${slug}` },
  { key: 'public_program_enabled',      label: 'Programme',       desc: 'Programme des combats par catégorie',            path: (slug: string) => `/tournoi/${slug}/programme` },
  { key: 'public_results_enabled',      label: 'Résultats',       desc: 'Résultats en direct par catégorie',              path: (slug: string) => `/tournoi/${slug}/resultats` },
  { key: 'public_live_matches_enabled', label: 'Combats live',    desc: 'Liens vers les tapis en direct',                 path: (_slug: string) => null },
  { key: 'public_rankings_enabled',     label: 'Classements',     desc: 'Classements finaux par catégorie',               path: (_slug: string) => null },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} title="Copier l'URL" style={{
      background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#4ade80' : 'var(--fg3)',
      display: 'flex', alignItems: 'center', padding: '2px 4px', borderRadius: 4, transition: 'color 0.15s',
    }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export default function TournamentSettings() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: t } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.get(`/api/tournaments/${id}`).then(r => r.data),
  });

  const [form, setForm] = useState<any>({});
  const initialized = useRef(false);

  // ── État gestion des tapis ──
  const [newMatName, setNewMatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingSlugId, setEditingSlugId] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState('');

  const { data: allMats = [] } = useQuery({
    queryKey: ['mats', id],
    queryFn: () => api.get(`/api/tournaments/${id}/mats`).then(r => r.data),
  });

  const addMat = useMutation({
    mutationFn: (name: string) => api.post(`/api/tournaments/${id}/mats`, { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mats', id] }); setNewMatName(''); toast.success('Tapis ajouté'); },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Erreur'),
  });

  const updateMat = useMutation({
    mutationFn: (data: { matId: string; name?: string; is_active?: boolean; is_jeune?: boolean; slug?: string }) =>
      api.put(`/api/mats/${data.matId}`, { name: data.name, is_active: data.is_active, is_jeune: data.is_jeune, slug: data.slug }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mats', id] }); setEditingId(null); setEditingSlugId(null); },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Ce slug est déjà utilisé ou invalide'),
  });

  const deleteMat = useMutation({
    mutationFn: (matId: string) => api.delete(`/api/mats/${matId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mats', id] });
      setConfirmDeleteId(null);
      toast.success('Tapis supprimé');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Erreur', { duration: 6000 }),
  });

  // Initialiser le formulaire UNE SEULE FOIS depuis les données du serveur
  useEffect(() => {
    if (t && !initialized.current) {
      setForm(t);
      initialized.current = true;
    }
  }, [t]);

  const update = useMutation({
    mutationFn: (data: any) => api.put(`/api/tournaments/${id}`, data),
    onSuccess: (resp) => {
      setForm(resp.data);
      qc.setQueryData(['tournament', id], resp.data);
      toast.success('Paramètres sauvegardés');
      // Si le slug a changé, naviguer vers la nouvelle URL
      const newSlug = resp.data.slug;
      if (newSlug && newSlug !== id) {
        navigate(`/t/${newSlug}/settings`, { replace: true });
      }
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  const f = (key: string) => ({
    value: form[key] ?? '',
    onChange: (e: any) => setForm((p: any) => ({ ...p, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })),
  });

  const toggle = (key: string) => ({
    checked: form[key] === true,
    onChange: (e: any) => setForm((p: any) => ({ ...p, [key]: e.target.checked })),
  });

  // Formater la date pour l'input (YYYY-MM-DD)
  const dateValue = form.event_date
    ? (form.event_date.includes('T') ? form.event_date.split('T')[0] : form.event_date)
    : '';

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const slug = form.slug || '';

  return (
    <Layout tournamentId={id}>
      <PageHeader title="Paramètres" subtitle="Configuration du tournoi" />

      <div style={{ padding: '20px 24px', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Informations générales ── */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--b2)' }}>
            <Settings2 size={14} color="var(--fg3)" />
            <span style={{ fontWeight: 700, color: 'var(--fg)', fontSize: 14 }}>Informations générales</span>
          </div>
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={LABEL}>Nom du tournoi</label>
              <input style={INPUT} {...f('name')} placeholder="Ex: Tournoi Régional U15" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL}>Date</label>
                <input
                  type="date"
                  style={INPUT}
                  value={dateValue}
                  onChange={e => setForm((p: any) => ({ ...p, event_date: e.target.value }))}
                />
              </div>
              <div>
                <label style={LABEL}>Ville</label>
                <input style={INPUT} {...f('city')} placeholder="Paris" />
              </div>
            </div>
            {/* Slug URL du tournoi */}
            <div>
              <label style={LABEL}>Identifiant URL (slug)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--fg3)', flexShrink: 0 }}>/t/</span>
                <input
                  style={{ ...INPUT, fontFamily: 'monospace', fontSize: 12 }}
                  value={form.slug ?? ''}
                  onChange={e => setForm((p: any) => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  placeholder="voiron-2026"
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 4 }}>
                Utilisé dans toutes les URLs du tournoi. Lettres minuscules, chiffres et tirets uniquement.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL}>Statut</label>
                <select style={SELECT} {...f('status')}>
                  <option value="draft">Brouillon</option>
                  <option value="registrations_open">Inscriptions ouvertes</option>
                  <option value="weigh_in">Pesée en cours</option>
                  <option value="running">En cours</option>
                  <option value="finished">Terminé</option>
                </select>
              </div>
              <div>
                <label style={LABEL}>Mode repêchage</label>
                <select style={SELECT} {...f('repechage_mode')}>
                  <option value="official_uww">Officiel UWW (2 bronzes)</option>
                  <option value="simplified_bronze">Petite finale unique</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Visibilité publique ── */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--b2)' }}>
            <Globe size={14} color="var(--fg3)" />
            <span style={{ fontWeight: 700, color: 'var(--fg)', fontSize: 14 }}>Visibilité publique</span>
          </div>

          {publicToggles.map(({ key, label, desc, path }) => {
            const isEnabled   = form[key] === true;
            const pagePath    = slug ? path(slug) : null;
            const fullUrl     = pagePath ? `${origin}${pagePath}` : null;

            return (
              <div key={key} style={{ borderBottom: '1px solid var(--b1)' }}>
                {/* Ligne toggle */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', cursor: 'pointer' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg2)' }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 1 }}>{desc}</div>
                  </div>
                  <div style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, background: isEnabled ? '#dc2626' : 'var(--b4)', transition: 'background 0.2s ease', flexShrink: 0, marginLeft: 16 }}>
                    <input type="checkbox" style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} {...toggle(key)} />
                    <div style={{ position: 'absolute', top: 2, left: isEnabled ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'left 0.2s ease' }} />
                  </div>
                </label>

                {/* URL associée */}
                {fullUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 20px 10px', marginTop: -4 }}>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                      background: isEnabled ? 'rgba(96,165,250,0.06)' : 'var(--inp)',
                      border: `1px solid ${isEnabled ? 'rgba(96,165,250,0.2)' : 'var(--b2)'}`,
                      borderRadius: 7, padding: '5px 10px',
                    }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: isEnabled ? '#60a5fa' : 'var(--fg3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pagePath}
                      </span>
                      <CopyButton text={fullUrl} />
                      {isEnabled && (
                        <a href={pagePath!} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', display: 'flex', alignItems: 'center' }}>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    {!isEnabled && (
                      <span style={{ fontSize: 10, color: 'var(--dim)', whiteSpace: 'nowrap' }}>désactivée</span>
                    )}
                  </div>
                )}

                {/* Pas d'URL (combats live, classements) — message d'info */}
                {!pagePath && isEnabled && (
                  <div style={{ padding: '4px 20px 10px', fontSize: 11, color: 'var(--fg3)' }}>
                    Les liens vers les tapis apparaîtront dans la page publique du tournoi.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Gestion des tapis ── */}
        <div style={{ background: 'var(--card2)', border: '1px solid var(--b3)', borderRadius: 16, overflow: 'hidden' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid var(--b2)', background: 'var(--inp)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--b3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={13} color="var(--fg3)" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>Gestion des tapis</div>
              <div style={{ fontSize: 10, color: 'var(--fg3)', marginTop: 1 }}>Ajouter, renommer, activer ou supprimer — disponible même en cours de compétition</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--dim)', background: 'var(--inp)', padding: '2px 8px', borderRadius: 5, fontWeight: 600 }}>
              {allMats.length} tapis
            </span>
          </div>

          <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allMats.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--dim)', textAlign: 'center', padding: '12px 0' }}>Aucun tapis — ajoutez-en ci-dessous</div>
            )}

            {allMats.map((mat: any) => {
              const isActive = mat.is_active !== false;

              if (editingId === mat.id) {
                return (
                  <div key={mat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--inp)', border: '1px solid var(--b4)', borderRadius: 10, padding: '10px 12px' }}>
                    <input
                      autoFocus
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && editingName.trim()) updateMat.mutate({ matId: mat.id, name: editingName.trim() });
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      style={{ flex: 1, background: 'var(--b3)', border: '1px solid var(--b4)', borderRadius: 7, padding: '6px 10px', fontSize: 13, color: 'var(--fg)', outline: 'none' }}
                    />
                    <button onClick={() => editingName.trim() && updateMat.mutate({ matId: mat.id, name: editingName.trim() })} disabled={updateMat.isPending}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', cursor: 'pointer', padding: 0 }}>
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'var(--inp)', border: '1px solid var(--b3)', color: 'var(--fg3)', cursor: 'pointer', padding: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                );
              }

              if (confirmDeleteId === mat.id) {
                return (
                  <div key={mat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px' }}>
                    <span style={{ flex: 1, fontSize: 12, color: '#f87171', fontWeight: 600 }}>Supprimer «&nbsp;{mat.name}&nbsp;» ? Les combats en attente seront désaffectés.</span>
                    <button onClick={() => deleteMat.mutate(mat.id)} disabled={deleteMat.isPending}
                      style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 7, background: '#dc2626', border: 'none', color: '#fff', cursor: 'pointer' }}>
                      {deleteMat.isPending ? '…' : 'Supprimer'}
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'var(--inp)', border: '1px solid var(--b3)', color: 'var(--fg3)', cursor: 'pointer', padding: 0 }}>
                      <X size={13} />
                    </button>
                  </div>
                );
              }

              const matLivePath = mat.slug
                ? (slug ? `/t/${slug}/mat/${mat.slug}` : `/mat/${mat.slug}`)
                : null;
              const matLiveUrl  = matLivePath ? `${origin}${matLivePath}` : null;
              const isEditingSlug = editingSlugId === mat.id;

              return (
                <div key={mat.id} style={{ background: 'var(--inp)', border: `1px solid ${isActive ? 'var(--b2)' : 'var(--b1)'}`, borderRadius: 10, padding: '10px 14px', opacity: isActive ? 1 : 0.5 }}>
                  {/* ── Ligne nom + boutons ── */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#22c55e' : 'var(--dim)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: isActive ? 'var(--fg2)' : 'var(--fg3)' }}>{mat.name}</span>
                    {!isActive && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--fg3)', background: 'var(--inp)', border: '1px solid var(--b2)', borderRadius: 5, padding: '1px 7px' }}>Inactif</span>
                    )}
                    <button
                      onClick={() => updateMat.mutate({ matId: mat.id, is_active: !isActive })}
                      disabled={updateMat.isPending}
                      title={isActive ? 'Désactiver ce tapis' : 'Réactiver ce tapis'}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 7, background: isActive ? 'rgba(34,197,94,0.1)' : 'var(--inp)', border: `1px solid ${isActive ? 'rgba(34,197,94,0.25)' : 'var(--b2)'}`, color: isActive ? '#4ade80' : 'var(--fg3)', cursor: 'pointer' }}
                    >
                      {isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {isActive ? 'Actif' : 'Inactif'}
                    </button>
                    <button
                      onClick={() => updateMat.mutate({ matId: mat.id, is_jeune: !mat.is_jeune })}
                      disabled={updateMat.isPending}
                      title={mat.is_jeune ? 'Tapis Jeunes (cliquer pour passer en tapis standard)' : 'Tapis standard (cliquer pour passer en tapis Jeunes)'}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 7, background: mat.is_jeune ? 'rgba(167,139,250,0.12)' : 'var(--inp)', border: `1px solid ${mat.is_jeune ? 'rgba(167,139,250,0.35)' : 'var(--b2)'}`, color: mat.is_jeune ? '#a78bfa' : 'var(--fg3)', cursor: 'pointer' }}
                    >
                      {mat.is_jeune ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {mat.is_jeune ? 'Jeunes' : 'Standard'}
                    </button>
                    <button
                      onClick={() => { setEditingId(mat.id); setEditingName(mat.name); setConfirmDeleteId(null); setEditingSlugId(null); }}
                      title="Renommer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'var(--inp)', border: '1px solid var(--b2)', color: 'var(--fg3)', cursor: 'pointer', padding: 0 }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => { setConfirmDeleteId(mat.id); setEditingId(null); setEditingSlugId(null); }}
                      title="Supprimer définitivement"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', padding: 0 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* ── Ligne URL live — normale ou en édition ── */}
                  {isEditingSlug ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, paddingLeft: 18 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--fg3)', flexShrink: 0 }}>/mat/</span>
                      <input
                        autoFocus
                        value={editingSlug}
                        onChange={e => setEditingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && editingSlug.trim()) updateMat.mutate({ matId: mat.id, slug: editingSlug.trim() });
                          if (e.key === 'Escape') setEditingSlugId(null);
                        }}
                        placeholder="ex : tapisa"
                        style={{ flex: 1, fontFamily: 'monospace', fontSize: 11, background: 'var(--b3)', border: '1px solid var(--b4)', borderRadius: 6, padding: '4px 8px', color: 'var(--fg)', outline: 'none' }}
                      />
                      <button
                        onClick={() => editingSlug.trim() && updateMat.mutate({ matId: mat.id, slug: editingSlug.trim() })}
                        disabled={!editingSlug.trim() || updateMat.isPending}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', cursor: 'pointer', padding: 0 }}
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setEditingSlugId(null)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, background: 'var(--inp)', border: '1px solid var(--b3)', color: 'var(--fg3)', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, paddingLeft: 18 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#60a5fa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {matLivePath ?? '—'}
                      </span>
                      {matLiveUrl && matLivePath && (
                        <>
                          <CopyButton text={matLiveUrl} />
                          <a href={matLivePath} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--fg3)', display: 'flex', alignItems: 'center' }}>
                            <ExternalLink size={10} />
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => { setEditingSlugId(mat.id); setEditingSlug(mat.slug ?? ''); setEditingId(null); setConfirmDeleteId(null); }}
                        title="Modifier l'URL"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, background: 'transparent', border: '1px solid var(--b2)', color: 'var(--fg3)', cursor: 'pointer', padding: 0 }}
                      >
                        <Pencil size={10} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ajouter un tapis */}
            <div style={{ display: 'flex', gap: 8, paddingTop: allMats.length > 0 ? 4 : 0 }}>
              <input
                value={newMatName}
                onChange={e => setNewMatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newMatName.trim()) addMat.mutate(newMatName.trim()); }}
                placeholder="Nom du nouveau tapis (ex : Tapis E)"
                style={{ flex: 1, background: 'var(--inp)', border: '1px solid var(--b3)', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: 'var(--fg)', outline: 'none' }}
              />
              <button
                onClick={() => { if (newMatName.trim()) addMat.mutate(newMatName.trim()); }}
                disabled={!newMatName.trim() || addMat.isPending}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: newMatName.trim() ? '#dc2626' : 'var(--inp)', color: newMatName.trim() ? '#fff' : 'var(--dim)', padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: newMatName.trim() ? 'pointer' : 'default', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
              >
                <Plus size={14} />
                {addMat.isPending ? 'Ajout…' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Gestion des combats ── */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--b2)' }}>
            <Activity size={14} color="var(--fg3)" />
            <span style={{ fontWeight: 700, color: 'var(--fg)', fontSize: 14 }}>Gestion des combats</span>
          </div>
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={LABEL}>Temps de repos minimum entre 2 combats (minutes)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="number" min="0" max="120" step="1"
                  style={{ ...INPUT, maxWidth: 100 }}
                  value={form.min_rest_minutes ?? 5}
                  onChange={e => setForm((p: any) => ({ ...p, min_rest_minutes: parseInt(e.target.value) || 0 }))}
                />
                <span style={{ fontSize: 12, color: 'var(--fg3)' }}>
                  Si un combattant n'a pas respecté ce délai, la ligne est bloquée en jaune dans la file des combats.
                </span>
              </div>
            </div>
            <div>
              <label style={LABEL}>Tolérance de poids Jeunes U9/U11 (%)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="number" min="1" max="30" step="0.5"
                  style={{ ...INPUT, maxWidth: 100 }}
                  value={form.jeunes_weight_tolerance ?? 10}
                  onChange={e => setForm((p: any) => ({ ...p, jeunes_weight_tolerance: parseFloat(e.target.value) || 10 }))}
                />
                <span style={{ fontSize: 12, color: 'var(--fg3)' }}>
                  Écart maximum autorisé entre le plus léger et le plus lourd dans une poule Jeunes (par défaut 10 %).
                </span>
              </div>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg2)' }}>Lancement automatique du combat suivant</div>
                  <div style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 2 }}>
                    Le prochain combat sur le tapis se lance automatiquement dès que le résultat du combat précédent est enregistré.
                  </div>
                </div>
                <div style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, background: form.auto_launch_next ? '#dc2626' : 'var(--b4)', transition: 'background 0.2s ease', flexShrink: 0 }}>
                  <input type="checkbox" style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} {...toggle('auto_launch_next')} />
                  <div style={{ position: 'absolute', top: 2, left: form.auto_launch_next ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'left 0.2s ease' }} />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ── Sauvegarder ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => update.mutate(form)}
            disabled={update.isPending}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#dc2626', color: '#fff', padding: '11px 24px', borderRadius: 9, fontSize: 14, fontWeight: 700, border: 'none', cursor: update.isPending ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.3)', opacity: update.isPending ? 0.7 : 1 }}
          >
            <Save size={15} /> {update.isPending ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>

      </div>
    </Layout>
  );
}
