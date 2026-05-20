import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Save, Globe, Settings2, Copy, Check, ExternalLink } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const LABEL: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 };
const INPUT: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box' as const };
const SELECT: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#fff', outline: 'none', appearance: 'none' as const, cursor: 'pointer' };

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
      background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#4ade80' : '#4b5563',
      display: 'flex', alignItems: 'center', padding: '2px 4px', borderRadius: 4, transition: 'color 0.15s',
    }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export default function TournamentSettings() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: t } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.get(`/api/tournaments/${id}`).then(r => r.data),
  });

  const [form, setForm] = useState<any>({});
  const initialized = useRef(false);

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
      // Mettre à jour le form avec les données réelles retournées par le serveur
      setForm(resp.data);
      // Invalider aussi les autres queries qui utilisent ce tournoi
      qc.setQueryData(['tournament', id], resp.data);
      toast.success('Paramètres sauvegardés');
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
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Settings2 size={14} color="#4b5563" />
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Informations générales</span>
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
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Globe size={14} color="#4b5563" />
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Visibilité publique</span>
          </div>

          {publicToggles.map(({ key, label, desc, path }) => {
            const isEnabled   = form[key] === true;
            const pagePath    = slug ? path(slug) : null;
            const fullUrl     = pagePath ? `${origin}${pagePath}` : null;

            return (
              <div key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {/* Ligne toggle */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', cursor: 'pointer' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#4b5563', marginTop: 1 }}>{desc}</div>
                  </div>
                  <div style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, background: isEnabled ? '#dc2626' : 'rgba(255,255,255,0.1)', transition: 'background 0.2s ease', flexShrink: 0, marginLeft: 16 }}>
                    <input type="checkbox" style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} {...toggle(key)} />
                    <div style={{ position: 'absolute', top: 2, left: isEnabled ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'left 0.2s ease' }} />
                  </div>
                </label>

                {/* URL associée */}
                {fullUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 20px 10px', marginTop: -4 }}>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                      background: isEnabled ? 'rgba(96,165,250,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isEnabled ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 7, padding: '5px 10px',
                    }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: isEnabled ? '#60a5fa' : '#4b5563', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                      <span style={{ fontSize: 10, color: '#374151', whiteSpace: 'nowrap' }}>désactivée</span>
                    )}
                  </div>
                )}

                {/* Pas d'URL (combats live, classements) — message d'info */}
                {!pagePath && isEnabled && (
                  <div style={{ padding: '4px 20px 10px', fontSize: 11, color: '#4b5563' }}>
                    Les liens vers les tapis apparaîtront dans la page publique du tournoi.
                  </div>
                )}
              </div>
            );
          })}
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
