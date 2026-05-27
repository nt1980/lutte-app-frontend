import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Shield, X, ChevronRight, Search, ExternalLink } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import React from 'react';

/* ─── Styles des actions ─────────────────────────────────────────────────── */
const ACTION_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  CREATE:                { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   label: 'Création'            },
  UPDATE:                { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   label: 'Modification'        },
  DELETE:                { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  label: 'Suppression'         },
  MATCH_RESULT:          { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   label: 'Résultat combat'     },
  GENERATE_COMPETITIONS: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)', label: 'Génération compét.'  },
  GENERATE_BRACKET:      { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', label: 'Génération tableau'  },
  DELETE_BRACKET:        { color: '#f87171', bg: 'rgba(248,113,113,0.1)', label: 'Suppression tableau' },
  WEIGH_IN:              { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   label: 'Pesée'               },
};

const WIN_TYPE_LABELS: Record<string, string> = {
  points: 'Aux points', superiority: 'Supériorité', fall: 'Tombé',
  forfeit: 'Forfait', abandon: 'Abandon', dq: 'Disqualification',
};

const ENTITY_LABELS: Record<string, string> = {
  tournament: 'Tournoi', match: 'Combat', competition: 'Compétition',
  registration: 'Inscription', athlete: 'Athlète', mat: 'Tapis', pool: 'Poule',
};

const TH: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em',
  borderBottom: '1px solid var(--b2)', whiteSpace: 'nowrap',
};
const TD: React.CSSProperties = {
  padding: '11px 14px', borderBottom: '1px solid var(--b1)', verticalAlign: 'middle',
};

/* ─── Résumé d'une ligne en une phrase ──────────────────────────────────── */
function logSummary(l: any): string {
  const d = l.new_data || l.old_data || {};
  switch (l.action) {
    case 'MATCH_RESULT': {
      const score = `${d.score_red ?? '?'} – ${d.score_blue ?? '?'}`;
      const type  = WIN_TYPE_LABELS[d.win_type] || d.win_type || '';
      return `Score ${score}${type ? ` · ${type}` : ''}`;
    }
    case 'GENERATE_COMPETITIONS':
      return `${d.count ?? '?'} compétitions générées`;
    case 'GENERATE_BRACKET':
      return `Tableau ${d.format ?? ''} · ${d.athletes ?? '?'} athlètes`;
    case 'DELETE_BRACKET':
      return `${d.age_category ?? ''} ${d.weight_category ? d.weight_category + ' kg' : ''} ${d.style ?? ''}`.trim();
    case 'WEIGH_IN':
      return d.weigh_in_weight_kg ? `${d.weigh_in_weight_kg} kg → ${d.final_weight_category ?? 'libre'}` : '';
    default:
      return '';
  }
}

/* ─── Champ formaté générique ────────────────────────────────────────────── */
function FieldRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--b1)' }}>
      <span style={{ fontSize: 11, color: 'var(--fg3)', width: 140, flexShrink: 0, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--fg2)', fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

/* ─── Section données JSON brutes (collapsible) ──────────────────────────── */
function RawSection({ label, data }: { label: string; data: any }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg3)', fontSize: 11, fontWeight: 600, padding: '4px 0' }}
      >
        <span style={{ transform: open ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s', fontSize: 10 }}>▶</span>
        {label}
      </button>
      {open && (
        <pre style={{ background: 'var(--inp)', border: '1px solid var(--b2)', borderRadius: 8, padding: 10, fontSize: 10, color: 'var(--fg3)', overflow: 'auto', maxHeight: 220, margin: '4px 0 0', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

/* ─── Vue spéciale MATCH_RESULT ──────────────────────────────────────────── */
function MatchResultDetail({ d, entityId }: { d: any; entityId: string }) {
  const redWon  = d.winner_id === d.red_athlete_id;
  const blueWon = d.winner_id === d.blue_athlete_id;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Score banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', background: 'var(--inp)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', margin: '0 auto 6px' }} />
          <div style={{ fontSize: 32, fontWeight: 900, color: redWon ? '#fff' : '#f87171', lineHeight: 1 }}>{d.score_red ?? '?'}</div>
          <div style={{ fontSize: 10, color: '#f87171', fontWeight: 600, marginTop: 4 }}>ROUGE</div>
          {redWon && <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 800, marginTop: 4 }}>🏆 VAINQUEUR</div>}
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--fg3)', fontStyle: 'italic' }}>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', margin: '0 auto 6px' }} />
          <div style={{ fontSize: 32, fontWeight: 900, color: blueWon ? '#fff' : '#60a5fa', lineHeight: 1 }}>{d.score_blue ?? '?'}</div>
          <div style={{ fontSize: 10, color: '#60a5fa', fontWeight: 600, marginTop: 4 }}>BLEU</div>
          {blueWon && <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 800, marginTop: 4 }}>🏆 VAINQUEUR</div>}
        </div>
      </div>

      {/* Détails */}
      <div>
        {d.win_type      && <FieldRow label="Victoire par"     value={WIN_TYPE_LABELS[d.win_type] || d.win_type} />}
        {d.mat_id        && <FieldRow label="Tapis (ID)"       value={d.mat_id.slice(0, 8) + '…'} mono />}
        {d.competition_id && <FieldRow label="Compétition (ID)" value={d.competition_id.slice(0, 8) + '…'} mono />}
        {d.pool_id       && <FieldRow label="Poule (ID)"       value={d.pool_id.slice(0, 8) + '…'} mono />}
        {d.round != null && <FieldRow label="Tour"             value={`Tour ${d.round + 1}${d.max_round != null ? ` / ${d.max_round + 1}` : ''}`} />}
        {d.match_type    && <FieldRow label="Type de combat"   value={d.match_type} />}
        {d.bracket       && <FieldRow label="Tableau"          value={d.bracket} />}
      </div>

      {/* Lien vers le combat */}
      <Link
        to={`/ref/${entityId}`}
        target="_blank"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#60a5fa', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', alignSelf: 'flex-start' }}
      >
        <ExternalLink size={12} /> Ouvrir le combat
      </Link>
    </div>
  );
}

/* ─── Vue générique pour les autres actions ──────────────────────────────── */
function GenericDetail({ old_data, new_data }: { old_data: any; new_data: any }) {
  const d = new_data || old_data || {};

  // Champs connus et lisibles à afficher en priorité
  const KNOWN: [string, string][] = [
    ['name', 'Nom'], ['status', 'Statut'], ['age_category', "Catégorie d'âge"],
    ['weight_category', 'Catégorie de poids'], ['style', 'Style'],
    ['format_type', 'Format'], ['gender', 'Sexe'],
    ['weigh_in_weight_kg', 'Poids mesuré (kg)'], ['weigh_in_status', 'Statut pesée'],
    ['final_weight_category', 'Cat. poids finale'], ['final_age_category', "Cat. âge finale"],
    ['count', 'Quantité'], ['format', 'Format'], ['athletes', 'Athlètes'],
  ];

  const shown = new Set<string>();
  const rows = KNOWN.map(([k, label]) => {
    if (d[k] === undefined || d[k] === null) return null;
    shown.add(k);
    // Diff highlight si old_data existe
    const changed = old_data && new_data && old_data[k] !== undefined && String(old_data[k]) !== String(new_data[k]);
    return (
      <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--b1)' }}>
        <span style={{ fontSize: 11, color: 'var(--fg3)', width: 180, flexShrink: 0, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, color: changed ? '#fbbf24' : 'var(--fg2)' }}>
          {changed && old_data[k] !== undefined && (
            <span style={{ textDecoration: 'line-through', color: 'var(--fg3)', marginRight: 6 }}>{String(old_data[k])}</span>
          )}
          {String(d[k])}
          {changed && <span style={{ marginLeft: 4, fontSize: 10, color: '#fbbf24' }}>modifié</span>}
        </span>
      </div>
    );
  }).filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {rows.length > 0 ? rows : (
        <div style={{ color: 'var(--fg3)', fontSize: 12 }}>Voir les données brutes ci-dessous.</div>
      )}
    </div>
  );
}

/* ─── Modal détail ───────────────────────────────────────────────────────── */
function DetailModal({ log, onClose }: { log: any; onClose: () => void }) {
  const style  = ACTION_STYLE[log.action] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: log.action };
  const initials = log.user_name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const fullDate = new Date(log.created_at).toLocaleString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const d = log.new_data || log.old_data || {};

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', zIndex: 300 }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: '5vh', right: 0, bottom: '5vh',
        width: 'min(540px, 95vw)',
        background: 'var(--card)',
        border: '1px solid var(--b2)',
        borderRadius: '16px 0 0 16px',
        zIndex: 301,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--b2)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: 'var(--bg2)' }}>
          <span style={{ background: style.bg, color: style.color, borderRadius: 7, padding: '4px 10px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {style.label}
          </span>
          <span style={{ flex: 1, fontSize: 11, color: 'var(--fg3)', fontFamily: 'monospace' }}>{fullDate}</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg3)', display: 'flex', padding: 4, flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>

          {/* Utilisateur */}
          <Section title="Utilisateur">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#f87171', flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)' }}>{log.user_name || '—'}</div>
                <div style={{ fontSize: 11, color: 'var(--fg3)', fontFamily: 'monospace', marginTop: 2 }}>{log.user_id?.slice(0, 12)}…</div>
              </div>
            </div>
          </Section>

          {/* Entité */}
          <Section title="Entité concernée">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ background: 'var(--inp)', border: '1px solid var(--b3)', borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 600, color: 'var(--fg2)' }}>
                {ENTITY_LABELS[log.entity_type] || log.entity_type}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--dim)' }}>{log.entity_id}</span>
            </div>
          </Section>

          {/* Contenu intelligent selon l'action */}
          <Section title="Détails">
            {log.action === 'MATCH_RESULT' ? (
              <MatchResultDetail d={d} entityId={log.entity_id} />
            ) : (
              <GenericDetail old_data={log.old_data} new_data={log.new_data} />
            )}
          </Section>

          {/* Données brutes */}
          <div style={{ marginTop: 6 }}>
            <RawSection label="Données après modification" data={log.new_data} />
            <RawSection label="Données avant modification" data={log.old_data} />
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────────────────────── */
export default function AuditLogs() {
  const { id } = useParams<{ id: string }>();

  const [selected,     setSelected]     = useState<any>(null);
  const [searchUser,   setSearchUser]   = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');
  const [filterDate,   setFilterDate]   = useState('');

  const { data: logs = [] } = useQuery({
    queryKey: ['audit', id],
    queryFn: () => api.get(`/api/tournaments/${id}/audit`).then(r => r.data),
    refetchInterval: 30000,
  });

  // Options dynamiques déduites des logs
  const uniqueActions  = useMemo(() => [...new Set((logs as any[]).map((l: any) => l.action))].sort() as string[], [logs]);
  const uniqueEntities = useMemo(() => [...new Set((logs as any[]).map((l: any) => l.entity_type))].sort() as string[], [logs]);

  const filtered = useMemo(() => (logs as any[]).filter((l: any) => {
    if (searchUser && !l.user_name?.toLowerCase().includes(searchUser.toLowerCase())) return false;
    if (filterAction !== 'all' && l.action !== filterAction) return false;
    if (filterEntity !== 'all' && l.entity_type !== filterEntity) return false;
    if (filterDate && !l.created_at?.startsWith(filterDate)) return false;
    return true;
  }), [logs, searchUser, filterAction, filterEntity, filterDate]);

  const hasFilters = searchUser || filterAction !== 'all' || filterEntity !== 'all' || filterDate;

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Audit"
        subtitle={`${filtered.length}${filtered.length !== logs.length ? ` / ${logs.length}` : ''} entrée${logs.length !== 1 ? 's' : ''}`}
      />

      {/* ── Filtres ── */}
      <div style={{ padding: '14px 24px 0', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Recherche utilisateur */}
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={13} color="var(--fg3)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            placeholder="Utilisateur…"
            value={searchUser}
            onChange={e => setSearchUser(e.target.value)}
            style={{ width: '100%', background: 'var(--inp)', border: '1px solid var(--b3)', borderRadius: 9, padding: '8px 10px 8px 30px', fontSize: 13, color: 'var(--fg)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Action */}
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          style={{ background: 'var(--inp)', border: `1px solid ${filterAction !== 'all' ? 'rgba(220,38,38,0.4)' : 'var(--b3)'}`, borderRadius: 9, padding: '8px 10px', fontSize: 13, color: filterAction !== 'all' ? '#f87171' : 'var(--fg3)', outline: 'none', cursor: 'pointer', minWidth: 160 }}
        >
          <option value="all">Toutes les actions</option>
          {uniqueActions.map(a => (
            <option key={a} value={a}>{ACTION_STYLE[a]?.label || a}</option>
          ))}
        </select>

        {/* Entité */}
        <select
          value={filterEntity}
          onChange={e => setFilterEntity(e.target.value)}
          style={{ background: 'var(--inp)', border: `1px solid ${filterEntity !== 'all' ? 'rgba(220,38,38,0.4)' : 'var(--b3)'}`, borderRadius: 9, padding: '8px 10px', fontSize: 13, color: filterEntity !== 'all' ? '#f87171' : 'var(--fg3)', outline: 'none', cursor: 'pointer', minWidth: 140 }}
        >
          <option value="all">Toutes les entités</option>
          {uniqueEntities.map(e => (
            <option key={e} value={e}>{ENTITY_LABELS[e] || e}</option>
          ))}
        </select>

        {/* Date */}
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ background: 'var(--inp)', border: `1px solid ${filterDate ? 'rgba(220,38,38,0.4)' : 'var(--b3)'}`, borderRadius: 9, padding: '8px 10px', fontSize: 13, color: filterDate ? '#f87171' : 'var(--fg3)', outline: 'none', cursor: 'pointer' }}
        />

        {/* Effacer */}
        {hasFilters && (
          <button
            onClick={() => { setSearchUser(''); setFilterAction('all'); setFilterEntity('all'); setFilterDate(''); }}
            style={{ padding: '8px 12px', borderRadius: 9, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            × Effacer
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ padding: '12px 24px 24px' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', textAlign: 'center' }}>
              <Shield size={28} color="var(--dim)" style={{ marginBottom: 10 }} />
              <div style={{ color: 'var(--fg3)', fontSize: 13 }}>
                {logs.length === 0 ? 'Aucune action enregistrée' : 'Aucune entrée correspondant aux filtres'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--inp)' }}>
                    <th style={TH}>Horodatage</th>
                    <th style={TH}>Utilisateur</th>
                    <th style={TH}>Action</th>
                    <th style={TH}>Entité</th>
                    <th style={TH}>Résumé</th>
                    <th style={{ ...TH, width: 28 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l: any, i: number) => {
                    const style   = ACTION_STYLE[l.action] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: l.action };
                    const isSelected = selected?.id === l.id;
                    const summary = logSummary(l);
                    return (
                      <tr
                        key={l.id}
                        onClick={() => setSelected(isSelected ? null : l)}
                        style={{
                          background: isSelected ? 'rgba(220,38,38,0.06)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                          cursor: 'pointer',
                          transition: 'background 0.1s',
                          borderLeft: isSelected ? '3px solid rgba(220,38,38,0.4)' : '3px solid transparent',
                        }}
                      >
                        <td style={TD}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--fg3)' }}>
                            {new Date(l.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </td>
                        <td style={TD}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--inp)', border: '1px solid var(--b3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'var(--fg3)', flexShrink: 0 }}>
                              {l.user_name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--fg2)', fontWeight: 500, whiteSpace: 'nowrap' }}>{l.user_name || '—'}</span>
                          </div>
                        </td>
                        <td style={TD}>
                          <span style={{ background: style.bg, color: style.color, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {style.label}
                          </span>
                        </td>
                        <td style={TD}>
                          <div style={{ fontSize: 11, color: 'var(--fg3)', fontWeight: 600, whiteSpace: 'nowrap' }}>{ENTITY_LABELS[l.entity_type] || l.entity_type}</div>
                          <div style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'monospace', marginTop: 1 }}>{l.entity_id?.slice(0, 8)}…</div>
                        </td>
                        <td style={TD}>
                          <span style={{ fontSize: 12, color: 'var(--fg3)' }}>{summary}</span>
                        </td>
                        <td style={{ ...TD, color: 'var(--dim)' }}>
                          <ChevronRight size={14} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal détail ── */}
      {selected && <DetailModal log={selected} onClose={() => setSelected(null)} />}
    </Layout>
  );
}
