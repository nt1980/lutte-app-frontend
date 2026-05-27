import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trophy, Plus, Calendar, MapPin, ChevronRight, Swords, Activity } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import { useAuth } from '../store/auth';
import api from '../lib/api';

const statusMap: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:               { label: 'Brouillon',    color: '#6b7280', bg: 'rgba(107,114,128,0.12)', dot: '#6b7280' },
  registrations_open:  { label: 'Inscriptions', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  dot: '#3b82f6' },
  weigh_in:            { label: 'Pesée',        color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  dot: '#f59e0b' },
  running:             { label: 'En cours',     color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  dot: '#22c55e' },
  finished:            { label: 'Terminé',      color: '#6b7280', bg: 'rgba(107,114,128,0.1)',  dot: '#374151' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const isGlobalAdmin = (user?.globalRoles || []).some((r: string) => ['super_admin', 'admin'].includes(r));

  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => api.get('/api/tournaments').then(r => r.data),
  });

  const running  = tournaments.filter((t: any) => t.status === 'running');
  const upcoming = tournaments.filter((t: any) => !['running', 'finished'].includes(t.status));
  const past     = tournaments.filter((t: any) => t.status === 'finished');

  const stats = [
    { label: 'Total tournois', value: tournaments.length, icon: Trophy,   color: '#dc2626', bg: 'rgba(220,38,38,0.1)'  },
    { label: 'En cours',       value: running.length,     icon: Activity, color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
    { label: 'À venir',        value: upcoming.length,    icon: Calendar, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Terminés',       value: past.length,        icon: Swords,   color: '#6b7280', bg: 'rgba(107,114,128,0.1)'},
  ];

  return (
    <Layout>
      <PageHeader
        title="Tableau de bord"
        subtitle="Gestion des tournois FFLDA / UWW"
        actions={
          isGlobalAdmin ? (
            <Link to="/tournaments/new" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#dc2626', color: '#fff',
              padding: '8px 16px', borderRadius: 9,
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
            }}>
              <Plus size={14} /> Nouveau tournoi
            </Link>
          ) : undefined
        }
      />

      <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── Stat cards ── */}
        {tournaments.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} style={{
                background: 'var(--card)', border: '1px solid var(--b2)',
                borderRadius: 16, padding: '18px 20px',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={color} strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--fg)', letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 5, fontWeight: 500 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {tournaments.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Swords size={32} color="#dc2626" strokeWidth={1.6} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg)', marginBottom: 8 }}>Aucun tournoi</h3>
            <p style={{ fontSize: 14, color: 'var(--fg3)', marginBottom: 24, maxWidth: 280, lineHeight: 1.6 }}>
              Créez votre premier tournoi pour commencer à gérer vos compétitions.
            </p>
            <Link to="/tournaments/new" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: '#dc2626', color: '#fff',
              padding: '11px 22px', borderRadius: 10,
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(220,38,38,0.35)',
            }}>
              <Plus size={16} /> Créer un tournoi
            </Link>
          </div>
        )}

        {/* ── En cours ── */}
        {running.length > 0 && (
          <section>
            <SectionTitle>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              En cours · {running.length}
            </SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              {running.map((t: any, i: number) => <TournamentCard key={t.id} t={t} highlight i={i} />)}
            </div>
          </section>
        )}

        {/* ── À venir ── */}
        {upcoming.length > 0 && (
          <section>
            <SectionTitle>À venir · {upcoming.length}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              {upcoming.map((t: any, i: number) => <TournamentCard key={t.id} t={t} i={i} />)}
            </div>
          </section>
        )}

        {/* ── Terminés ── */}
        {past.length > 0 && (
          <section style={{ opacity: 0.65 }}>
            <SectionTitle>Terminés · {past.length}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              {past.map((t: any, i: number) => <TournamentCard key={t.id} t={t} i={i} />)}
            </div>
          </section>
        )}

      </div>
    </Layout>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      {children}
    </div>
  );
}

function TournamentCard({ t, highlight, i }: { t: any; highlight?: boolean; i: number }) {
  const s = statusMap[t.status] || statusMap.draft;
  const dateStr = t.event_date
    ? new Date(t.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <Link
      to={`/t/${t.slug || t.id}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'var(--card)', border: '1px solid var(--b2)',
        borderRadius: 14, padding: '14px 16px',
        textDecoration: 'none',
        transition: 'border-color 0.15s ease, background 0.15s ease',
        animationDelay: `${i * 40}ms`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.28)';
        (e.currentTarget as HTMLElement).style.background = 'var(--hover)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--b2)';
        (e.currentTarget as HTMLElement).style.background = 'var(--card)';
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: highlight ? 'rgba(34,197,94,0.1)' : 'rgba(220,38,38,0.08)',
        border: `1px solid ${highlight ? 'rgba(34,197,94,0.2)' : 'rgba(220,38,38,0.15)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Trophy size={19} color={highlight ? '#4ade80' : '#dc2626'} strokeWidth={1.8} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: s.bg, borderRadius: 6, padding: '2px 8px',
            fontSize: 11, fontWeight: 600, color: s.color, flexShrink: 0,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
            {s.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 5 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--fg3)' }}>
            <Calendar size={11} color="var(--faint)" />
            {dateStr}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--fg3)' }}>
            <MapPin size={11} color="var(--faint)" />
            {t.city}
          </span>
          {t.organizer_club_short && (
            <span style={{ fontSize: 12, color: 'var(--faint)' }}>{t.organizer_club_short}</span>
          )}
        </div>
      </div>

      <ChevronRight size={16} color="var(--dim)" style={{ flexShrink: 0 }} />
    </Link>
  );
}
