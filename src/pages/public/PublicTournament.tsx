import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Tv, ClipboardList, BarChart3, LogIn } from 'lucide-react';
import api from '../../lib/api';

export default function PublicTournament() {
  const { slug } = useParams<{ slug: string }>();

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['public-tournament', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}`).then(r => r.data),
  });

  const { data: mats = [] } = useQuery({
    queryKey: ['public-mats', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}/mats`).then(r => r.data),
    enabled: !!tournament?.public_live_matches_enabled,
    refetchInterval: 10000,
  });

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--dim)', animation: 'bounce 1s infinite', animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );

  if (!tournament || !tournament.public_page_enabled) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <div>
        <Trophy size={40} color="var(--dim)" style={{ margin: '0 auto 1rem' }} />
        <div style={{ color: 'var(--fg)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Tournoi non disponible</div>
        <p style={{ color: 'var(--fg3)', fontSize: '0.875rem' }}>Cette page n'est pas accessible pour le moment.</p>
      </div>
    </div>
  );

  const activeMats = mats.filter((m: any) => m.is_active);
  const showProgramme = tournament.public_program_enabled;
  const showResults   = tournament.public_results_enabled;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--b2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{tournament.organizer_club_name || 'Tournoi de Lutte'}</span>
        </div>
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--inp)', border: '1px solid var(--b3)', borderRadius: 10, padding: '0.45rem 1rem', color: 'var(--fg2)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
          <LogIn size={14} /> Se connecter
        </Link>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '4rem 2rem 3rem' }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(220,38,38,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '1.5rem' }}>
          {activeMats.length > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 99, padding: '0.35rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#34d399', marginBottom: '1.5rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              {activeMats.length} tapis en direct
            </div>
          )}
        </div>

        <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 900, margin: '0 0 1rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {tournament.name}
        </h1>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1.5rem', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '3rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="#6b7280" />
            {new Date(tournament.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} color="#6b7280" />
            {tournament.city}
          </span>
        </div>

        {/* Action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', maxWidth: 700, margin: '0 auto' }}>
          {showProgramme && (
            <Link to={`/tournoi/${slug}/programme`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--card)', border: '1px solid var(--b3)',
                borderRadius: 20, padding: '2rem 1.5rem', cursor: 'pointer',
                transition: 'all 0.2s', textAlign: 'center',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = ''; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <ClipboardList size={24} color="#818cf8" />
                </div>
                <div style={{ color: 'var(--fg)', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.4rem' }}>Programme</div>
                <div style={{ color: 'var(--fg3)', fontSize: '0.8rem' }}>Poules & tableaux des compétitions</div>
              </div>
            </Link>
          )}

          {showResults && (
            <Link to={`/tournoi/${slug}/resultats`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--card)', border: '1px solid var(--b3)',
                borderRadius: 20, padding: '2rem 1.5rem', cursor: 'pointer', textAlign: 'center',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(220,38,38,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = ''; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <BarChart3 size={24} color="#f87171" />
                </div>
                <div style={{ color: 'var(--fg)', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.4rem' }}>Résultats</div>
                <div style={{ color: 'var(--fg3)', fontSize: '0.8rem' }}>Palmarès et scores des combats</div>
              </div>
            </Link>
          )}

          {activeMats.map((mat: any) => (
            <Link key={mat.id} to={`/mat/${mat.id}`} target="_blank" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--card)', border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 20, padding: '2rem 1.5rem', cursor: 'pointer', textAlign: 'center',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(16,185,129,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(16,185,129,0.2)'; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Tv size={24} color="#34d399" />
                </div>
                <div style={{ color: 'var(--fg)', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.4rem' }}>{mat.name} — Live</div>
                <div style={{ color: 'var(--fg3)', fontSize: '0.8rem' }}>Suivre ce tapis en direct</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dim)', fontSize: '0.75rem', borderTop: '1px solid var(--b1)' }}>
        © {new Date(tournament.event_date).getFullYear()} {tournament.organizer_club_name || tournament.name}
      </div>
    </div>
  );
}
