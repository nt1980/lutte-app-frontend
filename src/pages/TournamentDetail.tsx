import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Users, Grid3X3, Swords, CheckCircle, Activity, Scale, Settings, Trophy, ArrowRight } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';

const CARD: React.CSSProperties = {
  background: '#111',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
};

const shortcuts = (id: string) => [
  { to: `/t/${id}/registrations`, label: 'Inscriptions',  desc: 'Importer et gérer les combattants',   icon: Users,     color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)'  },
  { to: `/t/${id}/weigh-in`,      label: 'Pesée',         desc: 'Interface de pesée rapide',            icon: Scale,     color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)'  },
  { to: `/t/${id}/competitions`,  label: 'Compétitions',  desc: 'Générer les poules et tableaux',       icon: Grid3X3,   color: '#c084fc', bg: 'rgba(192,132,252,0.1)',border: 'rgba(192,132,252,0.2)' },
  { to: `/t/${id}/brackets`,      label: 'Tableaux',      desc: 'Visualiser et gérer les matchs',       icon: Swords,    color: '#f87171', bg: 'rgba(248,113,113,0.1)',border: 'rgba(248,113,113,0.2)' },
  { to: `/t/${id}/mats`,          label: 'Tapis',         desc: 'Affecter les combats aux tapis',       icon: Activity,  color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)'  },
  { to: `/t/${id}/settings`,      label: 'Paramètres',    desc: 'Configuration du tournoi',             icon: Settings,  color: '#9ca3af', bg: 'rgba(156,163,175,0.08)',border: 'rgba(156,163,175,0.15)'},
];

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: tournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.get(`/api/tournaments/${id}`).then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['tournament-stats', id],
    queryFn: () => api.get(`/api/tournaments/${id}/dashboard`).then(r => r.data),
    enabled: !!id,
    refetchInterval: 15000,
  });

  if (!tournament) return (
    <Layout tournamentId={id}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#374151', animation: 'bounce 1s infinite', animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    </Layout>
  );

  const matchesDone  = stats?.matches_done  ?? 0;
  const matchesTotal = stats?.matches_total ?? 0;
  const progress     = matchesTotal > 0 ? Math.round((matchesDone / matchesTotal) * 100) : 0;

  const statCards = [
    { label: 'Combattants', value: stats?.athletes    ?? 0,   icon: Users,        color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'   },
    { label: 'Clubs',       value: stats?.clubs       ?? 0,   icon: Trophy,       color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'   },
    { label: 'Compétitions',value: stats?.competitions ?? 0,  icon: Grid3X3,      color: '#c084fc', bg: 'rgba(192,132,252,0.1)'  },
    { label: 'Combats',     value: matchesTotal > 0 ? `${matchesDone}/${matchesTotal}` : '—',
                                                               icon: CheckCircle,  color: '#4ade80', bg: 'rgba(74,222,128,0.1)'   },
  ];

  const dateStr = new Date(tournament.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title={tournament.name}
        subtitle={`${dateStr} · ${tournament.city}`}
        actions={
          <Link to={`/t/${id}/settings`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
            <Settings size={14} color="#6b7280" /> Paramètres
          </Link>
        }
      />

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} style={{ ...CARD, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} color={color} strokeWidth={1.8} />
                </div>
              </div>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* ── Progress ── */}
        {matchesTotal > 0 && (
          <div style={{ ...CARD, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Progression du tournoi</div>
                <div style={{ fontSize: 12, color: '#4b5563', marginTop: 3 }}>{matchesDone} combats terminés sur {matchesTotal}</div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#dc2626' }}>{progress}%</div>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#dc2626,#ef4444)', borderRadius: 4, transition: 'width 0.7s ease' }} />
            </div>
            {progress === 100 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: '#4ade80' }}>
                <CheckCircle size={13} color="#4ade80" /> Tournoi terminé — tous les combats sont joués
              </div>
            )}
          </div>
        )}

        {/* ── Shortcuts ── */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Accès rapide</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {shortcuts(id!).map(({ to, label, desc, icon: Icon, color, bg, border }) => (
              <ShortcutCard key={to} to={to} label={label} desc={desc} Icon={Icon} color={color} bg={bg} border={border} />
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}

function ShortcutCard({ to, label, desc, Icon, color, bg, border }: any) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column',
        background: hovered ? '#161616' : '#111',
        border: `1px solid ${hovered ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 14, padding: '18px 18px',
        textDecoration: 'none',
        transition: 'border-color 0.15s ease, background 0.15s ease, transform 0.15s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={17} color={color} strokeWidth={1.8} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: hovered ? '#fca5a5' : '#fff' }}>{label}</div>
          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 3, lineHeight: 1.4 }}>{desc}</div>
        </div>
        <ArrowRight size={14} color={hovered ? '#9ca3af' : '#374151'} style={{ flexShrink: 0 }} />
      </div>
    </Link>
  );
}

import React from 'react';
