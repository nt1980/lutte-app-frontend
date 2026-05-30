import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  Users, Grid3X3, CheckCircle, Activity, Scale, Settings,
  Swords, Clock, AlertTriangle, Building2,
  Trophy, Timer, ChevronRight,
} from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';

// ── Age ordering ────────────────────────────────────────────────────────────
const AGE_ORDER: Record<string, number> = {
  U7: 0, U9: 1, U11: 2, U13: 3, U15: 4, U17: 5,
  U20: 6, U23: 7, Senior: 8, Vétéran: 9,
};
const sortByAge = (a: { age_category: string }, b: { age_category: string }) =>
  (AGE_ORDER[a.age_category] ?? 99) - (AGE_ORDER[b.age_category] ?? 99);

// ── Tiny helpers ─────────────────────────────────────────────────────────────
function useIsMobile() {
  const [v, setV] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setV(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return v;
}

const CARD: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16,
};

function SectionTitle({ icon: Icon, label, color = 'var(--fg3)', badge }: {
  icon: React.ComponentType<any>; label: string; color?: string; badge?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <Icon size={14} color={color} strokeWidth={1.8} />
      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {badge}
    </div>
  );
}

function StatRow({ label, value, valueColor = 'var(--fg)', sub }: {
  label: string; value: React.ReactNode; valueColor?: string; sub?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--b1)' }}>
      <span style={{ fontSize: 12, color: 'var(--fg3)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: valueColor, textAlign: 'right' }}>
        {value}
        {sub && <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--fg3)', marginLeft: 4 }}>{sub}</span>}
      </span>
    </div>
  );
}

function ProgressBar({ pct, color = '#3b82f6', height = 5 }: { pct: number; color?: string; height?: number }) {
  return (
    <div style={{ height, background: 'var(--prg)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 3, transition: 'width 0.7s ease' }} />
    </div>
  );
}

const shortcuts = (id: string) => [
  { to: `/t/${id}/registrations`, label: 'Inscriptions', desc: 'Importer et gérer les combattants',  icon: Users,    color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.2)'   },
  { to: `/t/${id}/weigh-in`,      label: 'Pesée',        desc: 'Interface de pesée rapide',           icon: Scale,    color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)'   },
  { to: `/t/${id}/competitions`,  label: 'Compétitions', desc: 'Générer les poules et tableaux',      icon: Grid3X3,  color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)'  },
  { to: `/t/${id}/brackets`,      label: 'Tableaux',     desc: 'Visualiser et gérer les matchs',      icon: Swords,   color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)'  },
  { to: `/t/${id}/mats`,          label: 'Tapis',        desc: 'Affecter les combats aux tapis',      icon: Activity, color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.2)'   },
  { to: `/t/${id}/settings`,      label: 'Paramètres',   desc: 'Configuration du tournoi',            icon: Settings, color: '#9ca3af', bg: 'rgba(156,163,175,0.08)',border: 'rgba(156,163,175,0.15)' },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();

  const { data: tournament, isPending: tournamentPending, isError: tournamentError } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.get(`/api/tournaments/${id}`).then(r => r.data),
    retry: 2,
  });

  const { data: stats } = useQuery({
    queryKey: ['tournament-stats', id],
    queryFn: () => api.get(`/api/tournaments/${id}/dashboard`).then(r => r.data),
    enabled: !!id,
    refetchInterval: 15000,
    retry: 1,
  });

  if (tournamentPending) return (
    <Layout tournamentId={id}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--dim)', animation: 'bounce 1s infinite', animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    </Layout>
  );

  if (tournamentError && !tournament) return (
    <Layout tournamentId={id}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 240, gap: 12 }}>
        <AlertTriangle size={32} color="var(--dim)" />
        <span style={{ fontSize: 14, color: 'var(--fg3)' }}>Impossible de charger le tournoi.</span>
        <button onClick={() => window.location.reload()} style={{ fontSize: 12, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Réessayer</button>
      </div>
    </Layout>
  );

  // ── Derived values ──────────────────────────────────────────────────────────
  const matchesDone  = stats?.matches_done  ?? 0;
  const matchesTotal = stats?.matches_total ?? 0;
  const remaining    = matchesTotal - matchesDone;
  const matchesPct   = matchesTotal > 0 ? Math.round((matchesDone / matchesTotal) * 100) : 0;

  const wi        = stats?.weigh_in ?? { total: 0, done: 0, overweight: 0, no_show: 0, pending: 0 };
  const weighDone = wi.done + wi.overweight + wi.no_show;
  const weighPct  = wi.total > 0 ? Math.round((weighDone / wi.total) * 100) : 0;

  const onMat    = stats?.queue?.on_mat ?? 0;
  const ready    = stats?.queue?.ready  ?? 0;
  const mActive  = stats?.mats_active   ?? 0;

  // ETA
  const etaMinutes = stats?.eta_minutes ?? 0;
  const etaStr = (() => {
    if (!stats || matchesTotal === 0 || remaining === 0) return null;
    if (etaMinutes === 0) return null;
    const now = new Date();
    now.setMinutes(now.getMinutes() + etaMinutes);
    return now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  })();

  const athletesByAge: { age_category: string; count: number }[] =
    (stats?.athletes_by_age ?? []).slice().sort(sortByAge);
  const matchesByAge: { age_category: string; total: number; done: number }[] =
    (stats?.matches_by_age ?? []).slice().sort(sortByAge);
  const topClubs: { club_id: string; club_name: string; short_name: string; gold: number; silver: number; bronze: number; points: number }[] =
    stats?.top_clubs ?? [];
  const medals = stats?.medals_total ?? { gold: 0, silver: 0, bronze: 0 };

  const maxAgeCount = Math.max(1, ...athletesByAge.map(r => r.count));

  // ── Tableau croisé pesée par club × catégorie d'âge ─────────────────────────
  const weighRows: { club_name: string; age_category: string; count: number }[] =
    stats?.weigh_by_club_age ?? [];
  const wAgeCols: string[] = [...new Set(weighRows.map(r => r.age_category))]
    .sort((a, b) => (AGE_ORDER[a] ?? 99) - (AGE_ORDER[b] ?? 99));
  const wClubs: string[] = [...new Set(weighRows.map(r => r.club_name))].sort();
  // matrix[club][age] = count
  const wMatrix: Record<string, Record<string, number>> = {};
  for (const r of weighRows) {
    if (!wMatrix[r.club_name]) wMatrix[r.club_name] = {};
    wMatrix[r.club_name][r.age_category] = r.count;
  }
  const wRowTotal = (club: string) =>
    wAgeCols.reduce((s, a) => s + (wMatrix[club]?.[a] ?? 0), 0);
  const wColTotal = (age: string) =>
    wClubs.reduce((s, c) => s + (wMatrix[c]?.[age] ?? 0), 0);
  const wGrandTotal = wClubs.reduce((s, c) => s + wRowTotal(c), 0);

  // Phase
  type Phase = 'inscription' | 'pesee' | 'competition' | 'termine';
  let phase: Phase = 'inscription';
  if (wi.total > 0 && weighPct < 100) phase = 'pesee';
  else if (matchesTotal > 0 && matchesPct < 100) phase = 'competition';
  else if (matchesTotal > 0 && matchesPct === 100) phase = 'termine';

  const PHASES: { key: Phase; label: string; color: string }[] = [
    { key: 'inscription', label: 'Inscriptions', color: '#60a5fa' },
    { key: 'pesee',       label: 'Pesée',        color: '#fbbf24' },
    { key: 'competition', label: 'Compétition',  color: '#f87171' },
    { key: 'termine',     label: 'Terminé',       color: '#4ade80' },
  ];
  const phaseIdx = PHASES.findIndex(p => p.key === phase);

  const dateStr = new Date(tournament.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const pad = isMobile ? '12px' : '24px';

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title={tournament.name}
        subtitle={`${dateStr} · ${tournament.city}`}
        actions={
          <Link to={`/t/${id}/settings`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'var(--inp)', border: '1px solid var(--b3)', color: 'var(--fg2)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
            <Settings size={14} color="var(--faint)" /> Paramètres
          </Link>
        }
      />

      <div style={{ padding: pad, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Phase timeline ── */}
        <div style={{ ...CARD, padding: '14px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Phase du tournoi</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {PHASES.map(({ key, label, color }, i) => {
              const isDone    = i < phaseIdx;
              const isCurrent = i === phaseIdx;
              return (
                <React.Fragment key={key}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: '50%', background: isDone ? '#22c55e' : isCurrent ? color : 'var(--inp)', border: `2px solid ${isDone ? '#22c55e' : isCurrent ? color : 'var(--b3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: isDone || isCurrent ? '#fff' : 'var(--faint)', flexShrink: 0 }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: isCurrent ? 700 : 400, color: isDone ? '#22c55e' : isCurrent ? color : 'var(--faint)', whiteSpace: 'nowrap' }}>{label}</span>
                  </div>
                  {i < PHASES.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: i < phaseIdx ? '#22c55e' : 'var(--b2)', marginBottom: 20 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── LIVE badge ── */}
        {(onMat > 0 || ready > 0) && (
          <div style={{ ...CARD, padding: '12px 16px', background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.7)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg)' }}>Activité en cours</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {onMat > 0 && (
                <Link to={`/t/${id}/mats`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '8px 12px', flex: 1, minWidth: 100 }}>
                  <Activity size={14} color="#fbbf24" />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>{onMat}</div>
                    <div style={{ fontSize: 10, color: 'var(--fg3)', marginTop: 1 }}>sur tapis</div>
                  </div>
                </Link>
              )}
              {ready > 0 && (
                <Link to={`/t/${id}/mats`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 10, padding: '8px 12px', flex: 1, minWidth: 100 }}>
                  <Clock size={14} color="#60a5fa" />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#60a5fa', lineHeight: 1 }}>{ready}</div>
                    <div style={{ fontSize: 10, color: 'var(--fg3)', marginTop: 1 }}>en attente</div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Main 2-column grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, alignItems: 'start' }}>

          {/* ══ Colonne gauche ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Organisation ── */}
            <div style={{ ...CARD, padding: '16px 18px' }}>
              <SectionTitle icon={Building2} label="Organisation" color="#60a5fa" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <StatRow label="Athlètes inscrits"  value={stats?.athletes    ?? '—'} valueColor="#60a5fa" />
                <StatRow label="Clubs"               value={stats?.clubs        ?? '—'} />
                <StatRow label="Compétitions"        value={stats?.competitions ?? '—'} />
                <StatRow label="Combats générés"     value={matchesTotal > 0 ? matchesTotal : '—'} />
                <StatRow
                  label="Combats terminés"
                  value={matchesTotal > 0 ? `${matchesDone} / ${matchesTotal}` : '—'}
                  valueColor={matchesPct === 100 ? '#4ade80' : matchesPct > 0 ? '#f87171' : 'var(--fg)'}
                />
                <StatRow
                  label="Combats restants"
                  value={matchesTotal > 0 ? remaining : '—'}
                  valueColor={remaining === 0 && matchesTotal > 0 ? '#4ade80' : 'var(--fg)'}
                />
              </div>

              {/* % avancement */}
              {matchesTotal > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--fg3)' }}>Avancement</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: matchesPct === 100 ? '#4ade80' : '#f87171', letterSpacing: '-0.5px' }}>{matchesPct}%</span>
                  </div>
                  <ProgressBar pct={matchesPct} color={matchesPct === 100 ? '#22c55e' : '#ef4444'} height={6} />
                </div>
              )}

              {/* ETA */}
              {etaStr && remaining > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '8px 10px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 8 }}>
                  <Timer size={12} color="#60a5fa" />
                  <span style={{ fontSize: 12, color: 'var(--fg3)' }}>Fin estimée :</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa', marginLeft: 'auto' }}>{etaStr}</span>
                  <span style={{ fontSize: 10, color: 'var(--fg3)' }}>({etaMinutes} min)</span>
                </div>
              )}
              {matchesPct === 100 && matchesTotal > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: '#4ade80' }}>
                  <CheckCircle size={13} color="#4ade80" /> Tournoi terminé
                </div>
              )}
              {ready > 0 && onMat === 0 && mActive === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '8px 10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 8 }}>
                  <AlertTriangle size={13} color="#f59e0b" />
                  <span style={{ fontSize: 11, color: '#f59e0b' }}>{ready} combat{ready > 1 ? 's' : ''} prêt{ready > 1 ? 's' : ''} — aucun tapis actif</span>
                </div>
              )}
            </div>

            {/* ── Combats par catégorie d'âge ── */}
            {matchesByAge.length > 0 && (
              <div style={{ ...CARD, padding: '16px 18px' }}>
                <SectionTitle icon={Swords} label="Combats par catégorie" color="#f87171" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {matchesByAge.map(r => {
                    const pct = r.total > 0 ? Math.round((r.done / r.total) * 100) : 0;
                    return (
                      <div key={r.age_category} style={{ padding: '7px 0', borderBottom: '1px solid var(--b1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg)' }}>{r.age_category}</span>
                          <span style={{ fontSize: 11, color: 'var(--fg3)' }}>
                            <span style={{ fontWeight: 700, color: pct === 100 ? '#4ade80' : '#f87171' }}>{r.done}</span>
                            <span style={{ color: 'var(--b4)' }}> / {r.total}</span>
                            <span style={{ marginLeft: 6, fontWeight: 700, color: pct === 100 ? '#4ade80' : 'var(--fg3)' }}>{pct}%</span>
                          </span>
                        </div>
                        <ProgressBar pct={pct} color={pct === 100 ? '#22c55e' : '#ef4444'} height={4} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ══ Colonne droite ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Pesée ── */}
            {wi.total > 0 && (
              <div style={{ ...CARD, padding: '16px 18px' }}>
                <SectionTitle icon={Scale} label="Pesée" color="#fbbf24"
                  badge={
                    <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 900, color: weighPct === 100 ? '#4ade80' : '#fbbf24', letterSpacing: '-0.5px' }}>
                      {weighPct}%
                    </span>
                  }
                />
                <ProgressBar pct={weighPct} color={weighPct === 100 ? '#22c55e' : '#f59e0b'} height={6} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 12 }}>
                  <StatRow label="Athlètes pesés"       value={wi.done}      valueColor="#4ade80" sub={`/ ${wi.total}`} />
                  <StatRow label="Non pesés (en attente)" value={wi.pending} valueColor={wi.pending > 0 ? '#fbbf24' : 'var(--fg3)'} />
                  <StatRow label="Hors catégorie"        value={wi.overweight} valueColor={wi.overweight > 0 ? '#f87171' : 'var(--fg3)'} />
                  <StatRow label="Absents"               value={wi.no_show}  valueColor={wi.no_show > 0 ? '#f87171' : 'var(--fg3)'} />
                </div>
                {wi.pending > 0 && (
                  <Link to={`/t/${id}/weigh-in`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, padding: '8px', borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                    <Scale size={12} /> Aller à la pesée ({wi.pending} en attente) →
                  </Link>
                )}
                {weighPct === 100 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: '#4ade80' }}>
                    <CheckCircle size={13} color="#4ade80" /> Pesée complète
                  </div>
                )}
              </div>
            )}

            {/* ── Participants par catégorie d'âge ── */}
            {athletesByAge.length > 0 && (
              <div style={{ ...CARD, padding: '16px 18px' }}>
                <SectionTitle icon={Users} label="Participants par catégorie"
                  badge={
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg3)' }}>
                      {athletesByAge.reduce((s, r) => s + r.count, 0)} total
                    </span>
                  }
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {athletesByAge.map(r => (
                    <div key={r.age_category} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg)', width: 52, flexShrink: 0 }}>{r.age_category}</span>
                      <div style={{ flex: 1, height: 16, background: 'var(--prg)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          height: '100%',
                          width: `${(r.count / maxAgeCount) * 100}%`,
                          background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                          borderRadius: 4, transition: 'width 0.7s ease',
                        }} />
                        <span style={{ position: 'absolute', left: 6, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontSize: 10, fontWeight: 700, color: '#fff', mixBlendMode: 'difference' }}>
                          {r.count}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', width: 28, textAlign: 'right', flexShrink: 0 }}>{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Classement / Médailles (pleine largeur) ── */}
        {(topClubs.length > 0 || medals.gold > 0) && (
          <div style={{ ...CARD, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={14} color="#fbbf24" strokeWidth={1.8} />
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Classement clubs</span>
              </div>
              {/* Totaux médailles */}
              {(medals.gold + medals.silver + medals.bronze) > 0 && (
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { v: medals.gold,   emoji: '🥇', color: '#fbbf24' },
                    { v: medals.silver, emoji: '🥈', color: '#9ca3af' },
                    { v: medals.bronze, emoji: '🥉', color: '#c2845a' },
                  ].map(({ v, emoji, color }) => (
                    <div key={emoji} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 14 }}>{emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {topClubs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: 'var(--fg3)' }}>
                Les médailles apparaîtront ici dès la fin des premières finales
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--b2)' }}>
                      {['#', 'Club', '🥇', '🥈', '🥉', 'Pts'].map((h, i) => (
                        <th key={h} style={{ padding: '5px 8px', textAlign: i <= 1 ? 'left' : 'center', fontSize: 10, fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topClubs.map((club, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <tr key={club.club_id} style={{ borderBottom: '1px solid var(--b1)', background: isFirst ? 'rgba(251,191,36,0.04)' : 'transparent' }}>
                          <td style={{ padding: '9px 8px', width: 28 }}>
                            {idx === 0 ? <span style={{ fontSize: 14 }}>🥇</span>
                             : idx === 1 ? <span style={{ fontSize: 14 }}>🥈</span>
                             : idx === 2 ? <span style={{ fontSize: 14 }}>🥉</span>
                             : <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--dim)' }}>{idx + 1}</span>}
                          </td>
                          <td style={{ padding: '9px 8px' }}>
                            <span style={{ fontSize: 13, fontWeight: isFirst ? 800 : 600, color: isFirst ? '#fbbf24' : 'var(--fg)' }}>
                              {club.short_name || club.club_name}
                            </span>
                            {!isMobile && club.short_name && club.club_name !== club.short_name && (
                              <span style={{ fontSize: 10, color: 'var(--fg3)', marginLeft: 6 }}>{club.club_name}</span>
                            )}
                          </td>
                          <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                            {club.gold > 0 ? <span style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24' }}>{club.gold}</span> : <span style={{ color: 'var(--b4)' }}>—</span>}
                          </td>
                          <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                            {club.silver > 0 ? <span style={{ fontSize: 13, fontWeight: 800, color: '#9ca3af' }}>{club.silver}</span> : <span style={{ color: 'var(--b4)' }}>—</span>}
                          </td>
                          <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                            {club.bronze > 0 ? <span style={{ fontSize: 13, fontWeight: 800, color: '#c2845a' }}>{club.bronze}</span> : <span style={{ color: 'var(--b4)' }}>—</span>}
                          </td>
                          <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: isFirst ? '#fbbf24' : 'var(--fg)', background: isFirst ? 'rgba(251,191,36,0.12)' : 'var(--inp)', border: `1px solid ${isFirst ? 'rgba(251,191,36,0.3)' : 'var(--b3)'}`, borderRadius: 6, padding: '2px 8px' }}>
                              {club.points}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 8, textAlign: 'right' }}>
                  Or = 3 pts · Argent = 2 pts · Bronze = 1 pt
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Pesée par club × catégorie (tableau croisé) ── */}
        {wGrandTotal > 0 && (
          <div style={{ ...CARD, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Scale size={14} color="#fbbf24" strokeWidth={1.8} />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Pesée — athlètes par club et catégorie
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 900, color: '#fbbf24', letterSpacing: '-0.5px' }}>
                {wGrandTotal}
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg2)' }}>
                    {/* Club header */}
                    <th style={{
                      padding: '7px 10px', textAlign: 'left',
                      fontSize: 10, fontWeight: 700, color: 'var(--dim)',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      borderBottom: '2px solid var(--b2)', position: 'sticky', left: 0,
                      background: 'var(--bg2)', whiteSpace: 'nowrap',
                    }}>Club</th>
                    {/* Age category headers */}
                    {wAgeCols.map(age => (
                      <th key={age} style={{
                        padding: '7px 8px', textAlign: 'center',
                        fontSize: 10, fontWeight: 700, color: 'var(--dim)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        borderBottom: '2px solid var(--b2)', whiteSpace: 'nowrap',
                      }}>{age}</th>
                    ))}
                    {/* Total header */}
                    <th style={{
                      padding: '7px 10px', textAlign: 'center',
                      fontSize: 10, fontWeight: 700, color: '#fbbf24',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      borderBottom: '2px solid var(--b2)',
                      borderLeft: '1px solid var(--b2)', whiteSpace: 'nowrap',
                    }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {wClubs.map((club, idx) => {
                    const rowTotal = wRowTotal(club);
                    return (
                      <tr key={club} style={{
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.025)',
                        borderBottom: '1px solid var(--b1)',
                      }}>
                        {/* Club name */}
                        <td style={{
                          padding: '7px 10px', fontWeight: 600,
                          color: 'var(--fg)', whiteSpace: 'nowrap',
                          position: 'sticky', left: 0,
                          background: idx % 2 === 0 ? 'var(--card)' : 'var(--bg2)',
                        }}>{club}</td>
                        {/* Counts per age */}
                        {wAgeCols.map(age => {
                          const v = wMatrix[club]?.[age] ?? 0;
                          return (
                            <td key={age} style={{
                              padding: '7px 8px', textAlign: 'center',
                              fontWeight: v > 0 ? 700 : 400,
                              color: v > 0 ? 'var(--fg)' : 'var(--b4)',
                              fontSize: 13,
                            }}>
                              {v > 0 ? v : '—'}
                            </td>
                          );
                        })}
                        {/* Row total */}
                        <td style={{
                          padding: '7px 10px', textAlign: 'center',
                          fontWeight: 900, fontSize: 13,
                          color: '#fbbf24',
                          borderLeft: '1px solid var(--b2)',
                          background: 'rgba(251,191,36,0.04)',
                        }}>{rowTotal}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--b2)', background: 'var(--bg2)' }}>
                    {/* "Total" label */}
                    <td style={{
                      padding: '7px 10px', fontWeight: 800,
                      color: '#fbbf24', fontSize: 11,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      position: 'sticky', left: 0, background: 'var(--bg2)',
                    }}>Total</td>
                    {/* Column totals */}
                    {wAgeCols.map(age => {
                      const v = wColTotal(age);
                      return (
                        <td key={age} style={{
                          padding: '7px 8px', textAlign: 'center',
                          fontWeight: 800, fontSize: 13, color: '#fbbf24',
                        }}>{v}</td>
                      );
                    })}
                    {/* Grand total */}
                    <td style={{
                      padding: '7px 10px', textAlign: 'center',
                      fontWeight: 900, fontSize: 15, color: '#fbbf24',
                      borderLeft: '1px solid var(--b2)',
                      background: 'rgba(251,191,36,0.08)',
                    }}>{wGrandTotal}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── Alerte tapis ── */}
        {ready > 0 && onMat === 0 && mActive === 0 && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} color="#f59e0b" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{ready} combat{ready > 1 ? 's' : ''} prêt{ready > 1 ? 's' : ''} — aucun tapis configuré</div>
              <Link to={`/t/${id}/settings`} style={{ fontSize: 11, color: 'var(--fg3)', textDecoration: 'none', marginTop: 2, display: 'block' }}>Configurer les tapis →</Link>
            </div>
          </div>
        )}

        {/* ── Accès rapide ── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Accès rapide</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
            {shortcuts(id!).map(({ to, label, desc, icon: Icon, color, bg, border }) => (
              <ShortcutCard key={to} to={to} label={label} desc={desc} Icon={Icon} color={color} bg={bg} border={border} isMobile={isMobile} />
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ShortcutCard({ to, label, desc, Icon, color, bg, border, isMobile }: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column',
        background: hovered ? 'var(--hover)' : 'var(--card)',
        border: `1px solid ${hovered ? 'rgba(220,38,38,0.25)' : 'var(--b2)'}`,
        borderRadius: 14, padding: isMobile ? '14px' : '18px',
        textDecoration: 'none',
        transition: 'border-color 0.15s, background 0.15s, transform 0.15s',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: isMobile ? 10 : 14 }}>
        <Icon size={15} color={color} strokeWidth={1.8} />
      </div>
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 2 : 0 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: hovered ? '#fca5a5' : 'var(--fg)' }}>{label}</div>
          {!isMobile && <div style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 3, lineHeight: 1.4 }}>{desc}</div>}
        </div>
        {!isMobile && <ChevronRight size={14} color={hovered ? 'var(--fg3)' : 'var(--dim)'} style={{ flexShrink: 0 }} />}
      </div>
    </Link>
  );
}
