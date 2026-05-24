import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  Users, Grid3X3, CheckCircle, Activity, Scale, Settings,
  ArrowRight, Swords, Clock, AlertTriangle, Building2,
  TrendingUp, Zap,
} from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';

const CARD: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--b2)',
  borderRadius: 16,
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

const shortcuts = (id: string) => [
  { to: `/t/${id}/registrations`, label: 'Inscriptions',  desc: 'Importer et gérer les combattants',   icon: Users,    color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.2)'   },
  { to: `/t/${id}/weigh-in`,      label: 'Pesée',         desc: 'Interface de pesée rapide',            icon: Scale,    color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)'   },
  { to: `/t/${id}/competitions`,  label: 'Compétitions',  desc: 'Générer les poules et tableaux',       icon: Grid3X3,  color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)'  },
  { to: `/t/${id}/brackets`,      label: 'Tableaux',      desc: 'Visualiser et gérer les matchs',       icon: Swords,   color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)'  },
  { to: `/t/${id}/mats`,          label: 'Tapis',         desc: 'Affecter les combats aux tapis',       icon: Activity, color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.2)'   },
  { to: `/t/${id}/settings`,      label: 'Paramètres',    desc: 'Configuration du tournoi',             icon: Settings, color: '#9ca3af', bg: 'rgba(156,163,175,0.08)',border: 'rgba(156,163,175,0.15)' },
];

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();

  const { data: tournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.get(`/api/tournaments/${id}`).then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['tournament-stats', id],
    queryFn: () => api.get(`/api/tournaments/${id}/dashboard`).then(r => r.data),
    enabled: !!id,
    refetchInterval: 10000,
  });

  if (!tournament) return (
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

  const matchesDone  = stats?.matches_done  ?? 0;
  const matchesTotal = stats?.matches_total ?? 0;
  const matchesPct   = matchesTotal > 0 ? Math.round((matchesDone / matchesTotal) * 100) : 0;

  const wi        = stats?.weigh_in ?? { total: 0, done: 0, overweight: 0, no_show: 0, pending: 0 };
  const weighDone = wi.done + wi.overweight + wi.no_show;
  const weighPct  = wi.total > 0 ? Math.round((weighDone / wi.total) * 100) : 0;

  const onMat = stats?.queue?.on_mat ?? 0;
  const ready = stats?.queue?.ready  ?? 0;

  type Phase = 'inscription' | 'pesee' | 'competition' | 'termine';
  let phase: Phase = 'inscription';
  if (wi.total > 0 && weighPct < 100) phase = 'pesee';
  else if (matchesTotal > 0 && matchesPct < 100) phase = 'competition';
  else if (matchesTotal > 0 && matchesPct === 100) phase = 'termine';

  const PHASES: { key: Phase; label: string; color: string }[] = [
    { key: 'inscription', label: 'Inscriptions', color: '#60a5fa' },
    { key: 'pesee',       label: 'Pesée',         color: '#fbbf24' },
    { key: 'competition', label: 'Compétition',   color: '#f87171' },
    { key: 'termine',     label: 'Terminé',        color: '#4ade80' },
  ];
  const phaseIdx = PHASES.findIndex(p => p.key === phase);

  const dateStr = new Date(tournament.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const pad     = isMobile ? '12px 12px' : '24px';

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

        {/* ── Timeline de phase ── */}
        <div style={{ ...CARD, padding: '14px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Phase du tournoi</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {PHASES.map(({ key, label, color }, i) => {
              const isDone    = i < phaseIdx;
              const isCurrent = i === phaseIdx;
              return (
                <React.Fragment key={key}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: '50%',
                      background: isDone ? '#22c55e' : isCurrent ? color : 'var(--inp)',
                      border: `2px solid ${isDone ? '#22c55e' : isCurrent ? color : 'var(--b3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800,
                      color: isDone ? '#fff' : isCurrent ? '#fff' : 'var(--faint)',
                      transition: 'all 0.3s',
                      flexShrink: 0,
                    }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: isCurrent ? 700 : 400, color: isDone ? '#22c55e' : isCurrent ? color : 'var(--faint)', whiteSpace: 'nowrap' }}>{label}</span>
                  </div>
                  {i < PHASES.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: i < phaseIdx ? '#22c55e' : 'var(--b2)', marginBottom: 20, transition: 'background 0.3s' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {[
            { label: 'Inscrits',     value: stats?.athletes    ?? '—', icon: Users,     color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
            { label: 'Clubs',        value: stats?.clubs        ?? '—', icon: Building2, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
            { label: 'Compétitions', value: stats?.competitions ?? '—', icon: Grid3X3,   color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
            { label: 'Combats',      value: matchesTotal > 0 ? `${matchesDone}/${matchesTotal}` : '—', icon: Swords, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} style={{ ...CARD, padding: isMobile ? '14px 16px' : '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} color={color} strokeWidth={1.8} />
                </div>
              </div>
              <span style={{ fontSize: isMobile ? 26 : 32, fontWeight: 900, color: 'var(--fg)', letterSpacing: '-1.5px', lineHeight: 1 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* ── Live ── */}
        {(onMat > 0 || ready > 0) && (
          <div style={{ ...CARD, padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg)' }}>Activité en cours</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {onMat > 0 && (
                <Link to={`/t/${id}/mats`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '10px 14px', flex: 1, minWidth: 120 }}>
                  <Activity size={16} color="#fbbf24" />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>{onMat}</div>
                    <div style={{ fontSize: 10, color: 'var(--fg3)', marginTop: 2 }}>combat{onMat > 1 ? 's' : ''} sur tapis</div>
                  </div>
                </Link>
              )}
              {ready > 0 && (
                <Link to={`/t/${id}/mats`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 10, padding: '10px 14px', flex: 1, minWidth: 120 }}>
                  <Clock size={16} color="#60a5fa" />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#60a5fa', lineHeight: 1 }}>{ready}</div>
                    <div style={{ fontSize: 10, color: 'var(--fg3)', marginTop: 2 }}>en attente de tapis</div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Pesée ── */}
        {wi.total > 0 && (
          <div style={{ ...CARD, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Scale size={15} color="#fbbf24" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>Pesée</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: weighPct === 100 ? '#4ade80' : '#fbbf24' }}>{weighPct}%</span>
                <span style={{ fontSize: 11, color: 'var(--fg3)' }}>{weighDone}/{wi.total}</span>
              </div>
            </div>
            <div style={{ height: 6, background: 'var(--prg)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${weighPct}%`, background: weighPct === 100 ? 'linear-gradient(90deg,#16a34a,#4ade80)' : 'linear-gradient(90deg,#d97706,#fbbf24)', borderRadius: 4, transition: 'width 0.7s ease' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { label: `Pesés : ${wi.done}`,         color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.2)',  show: true            },
                { label: `Attente : ${wi.pending}`,     color: 'var(--fg3)', bg: 'var(--inp)',          border: 'var(--b2)',             show: wi.pending > 0  },
                { label: `Hors cat. : ${wi.overweight}`,color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', show: wi.overweight > 0 },
                { label: `Absents : ${wi.no_show}`,     color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)',  show: wi.no_show > 0  },
              ].filter(x => x.show).map(({ label, color, bg, border }) => (
                <span key={label} style={{ background: bg, border: `1px solid ${border}`, color, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>{label}</span>
              ))}
            </div>
            {wi.pending > 0 && (
              <Link to={`/t/${id}/weigh-in`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, padding: '9px', borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                <Scale size={12} /> Aller à la pesée ({wi.pending} en attente)
              </Link>
            )}
            {wi.pending === 0 && weighPct === 100 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: '#4ade80' }}>
                <CheckCircle size={13} color="#4ade80" /> Pesée complète
              </div>
            )}
          </div>
        )}

        {/* ── Progression combats ── */}
        {matchesTotal > 0 && (
          <div style={{ ...CARD, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={15} color={matchesPct === 100 ? '#4ade80' : '#f87171'} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>Progression des combats</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: matchesPct === 100 ? '#4ade80' : '#f87171' }}>{matchesPct}%</span>
                <span style={{ fontSize: 11, color: 'var(--fg3)' }}>{matchesDone}/{matchesTotal}</span>
              </div>
            </div>
            <div style={{ height: 6, background: 'var(--prg)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${matchesPct}%`, background: matchesPct === 100 ? 'linear-gradient(90deg,#16a34a,#4ade80)' : 'linear-gradient(90deg,#dc2626,#ef4444)', borderRadius: 4, transition: 'width 0.7s ease' }} />
            </div>
            {matchesPct === 100 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: '#4ade80' }}>
                <CheckCircle size={13} color="#4ade80" /> Tournoi terminé
              </div>
            )}
            {matchesPct > 0 && matchesPct < 100 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: 'var(--fg3)' }}>
                <Zap size={12} color="var(--faint)" /> {matchesTotal - matchesDone} combat{(matchesTotal - matchesDone) > 1 ? 's' : ''} restant{(matchesTotal - matchesDone) > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* ── Alerte tapis ── */}
        {ready > 0 && onMat === 0 && (stats?.mats_active ?? 0) === 0 && (
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
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {shortcuts(id!).map(({ to, label, desc, icon: Icon, color, bg, border }) => (
              <ShortcutCard key={to} to={to} label={label} desc={desc} Icon={Icon} color={color} bg={bg} border={border} isMobile={isMobile} />
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}

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
        transition: 'border-color 0.15s ease, background 0.15s ease, transform 0.15s ease',
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
        {!isMobile && <ArrowRight size={14} color={hovered ? 'var(--fg3)' : 'var(--dim)'} style={{ flexShrink: 0 }} />}
      </div>
    </Link>
  );
}
