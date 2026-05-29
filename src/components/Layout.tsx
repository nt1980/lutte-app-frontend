import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../store/auth';
import { PrivateThemeApplier } from '../contexts/ThemeContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, Building2, ListChecks, Scale, Zap,
  Grid3X3, LogOut, Settings, Activity, Shield, ChevronLeft, Menu, X, Monitor, Baby, Bell,
} from 'lucide-react';

const globalNav = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/athletes',   label: 'Licenciés',  icon: Users           },
  { to: '/clubs',      label: 'Clubs',      icon: Building2       },
];

const tournamentNav = (id: string) => [
  { to: `/t/${id}`,               label: 'Vue générale',  icon: LayoutDashboard },
  { to: `/t/${id}/registrations`, label: 'Inscriptions',  icon: ListChecks      },
  { to: `/t/${id}/weigh-in`,      label: 'Pesée',         icon: Scale           },
  { to: `/t/${id}/jeunes`,        label: 'Tableaux Jeunes', icon: Baby            },
  { to: `/t/${id}/jeunes-mats`,   label: 'Tapis Jeunes',   icon: Monitor        },
  { to: `/t/${id}/competitions`,  label: 'Compétitions',   icon: Grid3X3        },
  { to: `/t/${id}/brackets`,      label: 'Tableaux',       icon: Zap            },
  { to: `/t/${id}/mats`,          label: 'Tapis',          icon: Activity       },
  { to: `/t/${id}/users`,         label: 'Utilisateurs',  icon: Users           },
  { to: `/t/${id}/audit`,         label: 'Audit',         icon: Shield          },
  { to: `/t/${id}/settings`,      label: 'Paramètres',    icon: Settings        },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

const WIN_TYPE_LABEL: Record<string, string> = {
  points: 'Aux points', superiority: 'Supériorité', fall: 'Tombé',
  forfeit: 'Forfait', abandon: 'Abandon', dq: 'Disqualif.',
};

export default function Layout({ children, tournamentId }: { children: React.ReactNode; tournamentId?: string }) {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();
  const qc        = useQueryClient();

  const [drawerOpen,      setDrawerOpen]      = useState(false);
  const [collapsed,       setCollapsed]       = useState(false);
  const [showAlerts,      setShowAlerts]      = useState(false);
  const [correctingAlert, setCorrectingAlert] = useState<any>(null);
  const [corrWinner,      setCorrWinner]      = useState('');
  const [corrScoreRed,    setCorrScoreRed]    = useState('');
  const [corrScoreBlue,   setCorrScoreBlue]   = useState('');
  const [corrWinType,     setCorrWinType]     = useState('');

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const isGlobalAdmin = (user?.globalRoles || []).some((r: string) => ['super_admin', 'admin'].includes(r));

  const { data: tournamentUsers = [] } = useQuery({
    queryKey: ['tournament-users', tournamentId],
    queryFn: () => api.get(`/api/tournaments/${tournamentId}/users`).then(r => r.data).catch(() => []),
    enabled: !!tournamentId && !isGlobalAdmin,
    staleTime: 60000,
  });
  const myTournamentRole: string = tournamentId
    ? (tournamentUsers.find((u: any) => u.user_id === user?.id)?.role ?? '')
    : '';
  const isReferee        = myTournamentRole === 'referee';
  const isWeighInManager = myTournamentRole === 'weigh_in_manager';

  // Toujours vérifier si l'utilisateur est affecté à un tapis (indépendamment du rôle tournament_users)
  // → fonctionne pour les comptes dont le mat.referee_id est défini sans rôle explicite
  const { data: refMat, isLoading: refMatLoading } = useQuery({
    queryKey: ['referee-mat'],
    queryFn: () => api.get('/api/users/me/referee-mat').then(r => r.data).catch(() => null),
    enabled: !!tournamentId && !isGlobalAdmin,
    staleTime: 300000,
  });

  // Un juge de tapis = non-admin ayant un tapis assigné via mats.referee_id
  const isMatReferee = !isGlobalAdmin && !!refMat?.mat_id;

  // Alertes résultat — visible pour admin global, tournament_admin, mat_manager
  const canSeeAlerts = !!tournamentId && (
    isGlobalAdmin ||
    myTournamentRole === 'tournament_admin' ||
    myTournamentRole === 'mat_manager'
  );
  const { data: pendingAlerts = [], refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts', tournamentId],
    queryFn: () => api.get(`/api/tournaments/${tournamentId}/alerts?status=pending`).then(r => r.data),
    enabled: canSeeAlerts,
    refetchInterval: 8000,
    staleTime: 5000,
  });
  const pendingCount: number = (pendingAlerts as any[]).length;

  const correctMut = useMutation({
    mutationFn: ({ matchId, alertId, winner_id, score_red, score_blue, win_type }: any) =>
      api.put(`/api/matches/${matchId}/result/correct`, { winner_id, score_red, score_blue, win_type, alert_id: alertId }),
    onSuccess: () => {
      toast.success('Résultat corrigé');
      qc.invalidateQueries({ queryKey: ['alerts', tournamentId] });
      refetchAlerts();
      setCorrectingAlert(null);
      setShowAlerts(false);
    },
    onError: () => toast.error('Erreur lors de la correction'),
  });

  const archiveMut = useMutation({
    mutationFn: (alertId: string) => api.put(`/api/alerts/${alertId}/archive`, {}),
    onSuccess: () => {
      toast.success('Alerte archivée');
      qc.invalidateQueries({ queryKey: ['alerts', tournamentId] });
      refetchAlerts();
    },
    onError: () => toast.error('Erreur lors de l\'archivage'),
  });

  const openCorrection = (alert: any) => {
    setCorrectingAlert(alert);
    setCorrWinner(alert.winner_id || '');
    setCorrScoreRed(String(alert.score_red ?? ''));
    setCorrScoreBlue(String(alert.score_blue ?? ''));
    setCorrWinType(alert.win_type || 'points');
  };

  const submitCorrection = () => {
    if (!corrWinner || !correctingAlert) return toast.error('Sélectionnez un vainqueur');
    correctMut.mutate({
      matchId: correctingAlert.match_id,
      alertId: correctingAlert.id,
      winner_id: corrWinner,
      score_red:  corrScoreRed  !== '' ? parseInt(corrScoreRed)  : null,
      score_blue: corrScoreBlue !== '' ? parseInt(corrScoreBlue) : null,
      win_type: corrWinType || null,
    });
  };

  // Rediriger le juge de tapis vers la page MatManager de son tournoi (vue filtrée sur son tapis)
  // Si déjà sur la bonne page → pas de redirection
  useEffect(() => {
    if (isMatReferee && refMat?.tournament_id) {
      const matsPath = `/t/${refMat.tournament_id}/mats`;
      if (location.pathname !== matsPath) {
        navigate(matsPath, { replace: true });
      }
    }
  }, [isMatReferee, refMat, location.pathname, navigate]);

  // weigh_in_manager gets access to /clubs even when inside a tournament
  const showGlobalNav = isGlobalAdmin || !tournamentId || isWeighInManager;
  const showLabel     = isMobile || !collapsed;

  const visibleGlobalNav = () => {
    if (isWeighInManager) return globalNav.filter(n => n.to === '/clubs');
    return globalNav;
  };

  const visibleTournamentNav = (id: string) => {
    const all = tournamentNav(id);
    if (isReferee || isMatReferee) return all.filter(n => n.label === 'Tapis' || n.label === 'Tapis Jeunes');
    if (isWeighInManager) return all.filter(n => ['Inscriptions', 'Pesée'].includes(n.label));
    return all;
  };

  // Bloquer l'affichage tant qu'on ne sait pas si l'utilisateur est un juge de tapis
  // → évite le flash du menu complet avant la redirection
  if (!isGlobalAdmin && tournamentId && refMatLoading) {
    return (
      <>
        <PrivateThemeApplier />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
          <div style={{ color: 'var(--fg3)', fontSize: 13 }}>Chargement…</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PrivateThemeApplier />
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

        {/* ── Overlay mobile ── */}
        {isMobile && drawerOpen && (
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'var(--ovl)',
              backdropFilter: 'blur(2px)',
              zIndex: 40,
            }}
          />
        )}

        {/* ── Sidebar ── */}
        <aside style={{
          width: isMobile ? 240 : (collapsed ? 56 : 220),
          flexShrink: 0,
          background: 'var(--bg2)',
          borderRight: '1px solid var(--b1)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.22s ease, transform 0.22s ease',
          overflow: 'hidden',
          ...(isMobile ? {
            position: 'fixed',
            top: 0, left: 0, bottom: 0,
            width: 240,
            zIndex: 50,
            transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          } : {}),
        }}>

          {/* Logo + bouton collapse / fermer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed && !isMobile ? '16px 12px' : '16px 14px',
            borderBottom: '1px solid var(--b1)',
            overflow: 'hidden',
            justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
          }}>
            <img
              src="/logo.svg"
              alt="Mat Manager"
              style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
            />

            {showLabel && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg)', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>Mat Manager</div>
                <div style={{ fontSize: 10, color: 'var(--faint)', fontWeight: 500, marginTop: 1 }}>FFLDA / UWW</div>
              </div>
            )}

            {!isMobile && (
              <button
                onClick={() => setCollapsed(c => !c)}
                title={collapsed ? 'Développer' : 'Réduire'}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--faint)', display: 'flex', padding: 4, flexShrink: 0,
                  marginLeft: collapsed ? 0 : 'auto',
                }}
              >
                <ChevronLeft
                  size={14}
                  style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.22s' }}
                />
              </button>
            )}

            {isMobile && (
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', display: 'flex', padding: 4, flexShrink: 0, marginLeft: 'auto' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>

            {showGlobalNav && !isReferee && !isMatReferee && visibleGlobalNav().map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return <NavLink key={to} to={to} label={label} icon={Icon} active={active} collapsed={collapsed && !isMobile} />;
            })}

            {tournamentId && (
              <>
                <div style={{ padding: '16px 8px 6px', overflow: 'hidden' }}>
                  {isGlobalAdmin && !isReferee && showLabel && (
                    <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--faint)', textDecoration: 'none', marginBottom: 8 }}>
                      <ChevronLeft size={10} /> Tous les tournois
                    </Link>
                  )}
                  {showLabel && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ce tournoi</div>
                  )}
                </div>
                {visibleTournamentNav(tournamentId).map(({ to, label, icon: Icon }) => {
                  const active = location.pathname === to;
                  return <NavLink key={to} to={to} label={label} icon={Icon} active={active} collapsed={collapsed && !isMobile} />;
                })}
              </>
            )}

          </nav>

          {/* Alertes résultat — visible pour admin / tournament_admin / mat_manager */}
          {canSeeAlerts && (
            <div style={{ padding: '4px 8px', borderTop: '1px solid var(--b1)' }}>
              <button
                onClick={() => setShowAlerts(true)}
                title={collapsed && !isMobile ? 'Alertes résultat' : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                  gap: 9, padding: collapsed && !isMobile ? '8px' : '7px 10px',
                  borderRadius: 8, width: '100%', border: 'none', cursor: 'pointer',
                  background: pendingCount > 0 ? 'rgba(251,191,36,0.08)' : 'transparent',
                  color: pendingCount > 0 ? '#fbbf24' : 'var(--fg3)',
                  fontSize: 13, fontWeight: pendingCount > 0 ? 600 : 400,
                  position: 'relative',
                }}
              >
                <Bell size={14} />
                {!(collapsed && !isMobile) && <span>Alertes</span>}
                {pendingCount > 0 && (
                  <span style={{
                    marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 9,
                    background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                  }}>{pendingCount}</span>
                )}
              </button>
            </div>
          )}

          {/* Affichage — masqué pour arbitres/juges de tapis et responsables pesée */}
          {!isReferee && !isMatReferee && !isWeighInManager && (
            <div style={{ padding: '4px 8px', borderTop: '1px solid var(--b1)' }}>
              <NavLink
                to="/settings"
                label="Affichage"
                icon={Monitor}
                active={location.pathname === '/settings'}
                collapsed={collapsed && !isMobile}
              />
            </div>
          )}

          {/* User footer */}
          <div style={{ borderTop: '1px solid var(--b1)', padding: '10px 8px' }}>
            <UserRow initials={initials} name={user?.name} email={user?.email} onLogout={handleLogout} collapsed={collapsed && !isMobile} />
          </div>
        </aside>

        {/* ── Zone principale ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Barre top mobile (hamburger) */}
          {isMobile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 16px',
              background: 'var(--bg2)',
              borderBottom: '1px solid var(--b1)',
              flexShrink: 0,
            }}>
              <button
                onClick={() => setDrawerOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg3)', display: 'flex', padding: 4 }}
              >
                <Menu size={20} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/logo.svg" alt="Mat Manager" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg)' }}>Mat Manager</span>
              </div>
            </div>
          )}

          <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
            {children}
          </main>
        </div>
      </div>

      {/* ── Panneau Alertes ── */}
      {showAlerts && (
        <>
          <div onClick={() => { setShowAlerts(false); setCorrectingAlert(null); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, backdropFilter: 'blur(2px)' }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: Math.min(480, window.innerWidth),
            background: 'var(--bg2)', borderLeft: '1px solid var(--b2)',
            zIndex: 1001, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bell size={16} color="#fbbf24" />
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg)' }}>Alertes résultat</span>
                {pendingCount > 0 && (
                  <span style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(220,38,38,0.15)', color: '#f87171', fontSize: 11, fontWeight: 700 }}>
                    {pendingCount} en attente
                  </span>
                )}
              </div>
              <button onClick={() => { setShowAlerts(false); setCorrectingAlert(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg3)', display: 'flex', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Liste des alertes */}
            {!correctingAlert && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(pendingAlerts as any[]).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--fg3)', fontSize: 13 }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>✓</div>
                    Aucun signalement en attente
                  </div>
                ) : (pendingAlerts as any[]).map((alert: any) => (
                  <div key={alert.id} style={{ background: 'var(--card)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: '14px 16px' }}>
                    {/* Match info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                        ⚠️ Signalement
                      </span>
                      {alert.mat_name && <span style={{ fontSize: 11, color: 'var(--fg3)' }}>Tapis {alert.mat_name}</span>}
                      <span style={{ fontSize: 11, color: 'var(--fg3)', marginLeft: 'auto' }}>
                        {new Date(alert.reported_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 13 }}>
                      <div style={{ flex: 1, background: 'rgba(185,28,28,0.12)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, marginBottom: 2 }}>ROUGE</div>
                        <div style={{ fontWeight: 700, color: 'var(--fg)' }}>{alert.red_name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg3)' }}>{alert.red_club}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--fg)' }}>{alert.score_red} – {alert.score_blue}</div>
                        <div style={{ fontSize: 9, color: 'var(--fg3)', textTransform: 'uppercase' }}>{WIN_TYPE_LABEL[alert.win_type] || alert.win_type}</div>
                      </div>
                      <div style={{ flex: 1, background: 'rgba(29,78,216,0.12)', border: '1px solid rgba(29,78,216,0.2)', borderRadius: 8, padding: '8px 10px', textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, marginBottom: 2 }}>BLEU</div>
                        <div style={{ fontWeight: 700, color: 'var(--fg)' }}>{alert.blue_name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg3)' }}>{alert.blue_club}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg3)', marginBottom: 6 }}>
                      <span style={{ color: '#fbbf24' }}>Vainqueur déclaré :</span> {alert.winner_name}
                    </div>
                    {alert.note && (
                      <div style={{ fontSize: 12, color: 'var(--fg2)', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '6px 10px', marginBottom: 8, fontStyle: 'italic' }}>
                        "{alert.note}"
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--fg3)', marginBottom: 10 }}>
                      Signalé par <span style={{ color: 'var(--fg2)' }}>{alert.reporter_name}</span>
                      {alert.age_category && <> · {alert.age_category}{alert.weight_category ? ` ${alert.weight_category}kg` : ''}</>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => openCorrection(alert)}
                        style={{ flex: 2, padding: '9px 14px', borderRadius: 9, background: '#dc2626', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ✏️ Corriger le résultat
                      </button>
                      <button
                        onClick={() => archiveMut.mutate(alert.id)}
                        disabled={archiveMut.isPending}
                        style={{ flex: 1, padding: '9px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--b2)', color: 'var(--fg3)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Archiver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Formulaire de correction ── */}
            {correctingAlert && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <button onClick={() => setCorrectingAlert(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg3)', fontSize: 13, textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  ← Retour aux alertes
                </button>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)' }}>Correction du résultat</div>

                {/* Infos du match */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: 'var(--fg3)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}>
                    {correctingAlert.age_category} · {correctingAlert.weight_category ? `${correctingAlert.weight_category}kg` : 'Poids libre'} · {correctingAlert.style}
                  </div>
                  {correctingAlert.mat_name && <div>Tapis {correctingAlert.mat_name}</div>}
                  {correctingAlert.note && <div style={{ marginTop: 6, fontStyle: 'italic', color: '#fbbf24' }}>"{correctingAlert.note}"</div>}
                </div>

                {/* Sélection du vainqueur */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Vainqueur correct</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => setCorrWinner(correctingAlert.red_athlete_id)}
                      style={{
                        flex: 1, padding: '14px 10px', borderRadius: 10, border: '2px solid',
                        borderColor: corrWinner === correctingAlert.red_athlete_id ? '#dc2626' : 'var(--b2)',
                        background: corrWinner === correctingAlert.red_athlete_id ? 'rgba(220,38,38,0.12)' : 'var(--card)',
                        cursor: 'pointer', textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#f87171', letterSpacing: '0.1em', marginBottom: 4 }}>ROUGE</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>{correctingAlert.red_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg3)' }}>{correctingAlert.red_club}</div>
                    </button>
                    <button
                      onClick={() => setCorrWinner(correctingAlert.blue_athlete_id)}
                      style={{
                        flex: 1, padding: '14px 10px', borderRadius: 10, border: '2px solid',
                        borderColor: corrWinner === correctingAlert.blue_athlete_id ? '#2563eb' : 'var(--b2)',
                        background: corrWinner === correctingAlert.blue_athlete_id ? 'rgba(37,99,235,0.12)' : 'var(--card)',
                        cursor: 'pointer', textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em', marginBottom: 4 }}>BLEU</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>{correctingAlert.blue_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg3)' }}>{correctingAlert.blue_club}</div>
                    </button>
                  </div>
                </div>

                {/* Scores */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Scores (optionnel)</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="number" min="0" max="99" value={corrScoreRed} onChange={e => setCorrScoreRed(e.target.value)}
                      placeholder="Rouge" style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--b2)', color: 'var(--fg)', fontSize: 14, textAlign: 'center', outline: 'none' }} />
                    <span style={{ color: 'var(--fg3)', fontWeight: 700 }}>–</span>
                    <input type="number" min="0" max="99" value={corrScoreBlue} onChange={e => setCorrScoreBlue(e.target.value)}
                      placeholder="Bleu" style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--b2)', color: 'var(--fg)', fontSize: 14, textAlign: 'center', outline: 'none' }} />
                  </div>
                </div>

                {/* Type de victoire */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Victoire par</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(WIN_TYPE_LABEL).map(([val, label]) => (
                      <button key={val} onClick={() => setCorrWinType(val)}
                        style={{ padding: '7px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          background: corrWinType === val ? 'rgba(255,255,255,0.15)' : 'var(--card)',
                          color: corrWinType === val ? 'var(--fg)' : 'var(--fg3)' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bouton Corriger */}
                <button
                  onClick={submitCorrection}
                  disabled={!corrWinner || correctMut.isPending}
                  style={{ padding: '14px', borderRadius: 12, background: corrWinner ? '#dc2626' : 'var(--b4)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: corrWinner ? 'pointer' : 'not-allowed', opacity: correctMut.isPending ? 0.7 : 1, boxShadow: corrWinner ? '0 4px 14px rgba(220,38,38,0.3)' : 'none' }}
                >
                  {correctMut.isPending ? 'Correction en cours…' : '✓ Appliquer la correction'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function NavLink({
  to, label, icon: Icon, active, collapsed,
}: {
  to: string; label: string; icon: any; active: boolean; collapsed: boolean;
}) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 9,
        padding: collapsed ? '8px' : '7px 10px',
        borderRadius: 8,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--fg)' : 'var(--fg3)',
        background: active ? 'rgba(220,38,38,0.1)' : 'transparent',
        border: `1px solid ${active ? 'rgba(220,38,38,0.2)' : 'transparent'}`,
        transition: 'all 0.15s ease',
      }}
    >
      <Icon size={14} color={active ? '#ef4444' : 'var(--faint)'} />
      {!collapsed && label}
    </Link>
  );
}

function UserRow({
  initials, name, email, onLogout, collapsed,
}: {
  initials: string; name?: string; email?: string; onLogout: () => void; collapsed: boolean;
}) {
  if (collapsed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '4px 0' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(220,38,38,0.15)',
          border: '1px solid rgba(220,38,38,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, color: '#f87171',
        }}>
          {initials}
        </div>
        <button
          onClick={onLogout}
          title="Se déconnecter"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--faint)', display: 'flex', alignItems: 'center' }}
        >
          <LogOut size={13} color="var(--faint)" />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 8px', borderRadius: 10 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'rgba(220,38,38,0.15)',
        border: '1px solid rgba(220,38,38,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800, color: '#f87171',
        flexShrink: 0,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 10, color: 'var(--faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
      </div>
      <button
        onClick={onLogout}
        title="Se déconnecter"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--faint)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
      >
        <LogOut size={13} color="var(--faint)" />
      </button>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'var(--hdr)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--b1)',
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg)', letterSpacing: '-0.4px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>{actions}</div>
      )}
    </div>
  );
}
