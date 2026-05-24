import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../store/auth';
import { PrivateThemeApplier } from '../contexts/ThemeContext';
import api from '../lib/api';
import {
  Trophy, LayoutDashboard, Users, Building2, ListChecks, Scale, Zap,
  Grid3X3, LogOut, Settings, Activity, Shield, ChevronLeft, Menu, X, Monitor,
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
  { to: `/t/${id}/competitions`,  label: 'Compétitions',  icon: Grid3X3         },
  { to: `/t/${id}/brackets`,      label: 'Tableaux',      icon: Zap             },
  { to: `/t/${id}/mats`,          label: 'Tapis',         icon: Activity        },
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

export default function Layout({ children, tournamentId }: { children: React.ReactNode; tournamentId?: string }) {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);

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
  const isReferee = myTournamentRole === 'referee';

  const showGlobalNav = isGlobalAdmin || !tournamentId;
  const showLabel     = isMobile || !collapsed;

  const visibleTournamentNav = (id: string) => {
    const all = tournamentNav(id);
    if (isReferee) return all.filter(n => n.label === 'Tapis');
    return all;
  };

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
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(220,38,38,0.35)',
            }}>
              <Trophy size={15} color="#fff" strokeWidth={2.2} />
            </div>

            {showLabel && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg)', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>Lutte App</div>
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

            {showGlobalNav && !isReferee && globalNav.map(({ to, label, icon: Icon }) => {
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

          {/* Affichage — toujours visible sauf arbitres */}
          {!isReferee && (
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
                <div style={{
                  width: 24, height: 24, borderRadius: 7,
                  background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Trophy size={11} color="#fff" strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg)' }}>Lutte App</span>
              </div>
            </div>
          )}

          <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
            {children}
          </main>
        </div>
      </div>
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
