import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import {
  Trophy, LayoutDashboard, Users, Building2, ListChecks, Scale, Zap,
  Grid3X3, LogOut, Settings, Activity, Shield, ChevronLeft,
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

export default function Layout({ children, tournamentId }: { children: React.ReactNode; tournamentId?: string }) {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  // Tournament admins without a global role only see the tournament they manage
  const isGlobalAdmin = (user?.globalRoles || []).some((r: string) => ['super_admin', 'admin'].includes(r));
  const showGlobalNav = isGlobalAdmin || !tournamentId;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#080808', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: '#0d0d0d',
        borderRight: '1px solid rgba(255,255,255,0.055)',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 14px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(220,38,38,0.35)',
          }}>
            <Trophy size={15} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Lutte App</div>
            <div style={{ fontSize: 10, color: '#4b5563', fontWeight: 500, marginTop: 1 }}>FFLDA / UWW</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Global nav — hidden for tournament-only admins */}
          {showGlobalNav && globalNav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <NavLink key={to} to={to} label={label} icon={Icon} active={active} />
            );
          })}

          {/* Tournament nav */}
          {tournamentId && (
            <>
              <div style={{ padding: '16px 8px 6px' }}>
                {isGlobalAdmin && (
                  <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#4b5563', textDecoration: 'none', marginBottom: 8 }}>
                    <ChevronLeft size={10} /> Tous les tournois
                  </Link>
                )}
                <div style={{ fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ce tournoi</div>
              </div>
              {tournamentNav(tournamentId).map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <NavLink key={to} to={to} label={label} icon={Icon} active={active} />
                );
              })}
            </>
          )}
        </nav>

        {/* User footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.055)', padding: '10px 8px' }}>
          <UserRow initials={initials} name={user?.name} email={user?.email} onLogout={handleLogout} />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}

function NavLink({ to, label, icon: Icon, active }: { to: string; label: string; icon: any; active: boolean }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '7px 10px',
        borderRadius: 8,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? '#fff' : '#6b7280',
        background: active ? 'rgba(220,38,38,0.12)' : 'transparent',
        border: `1px solid ${active ? 'rgba(220,38,38,0.2)' : 'transparent'}`,
        transition: 'all 0.15s ease',
      }}
    >
      <Icon size={14} color={active ? '#ef4444' : '#4b5563'} />
      {label}
    </Link>
  );
}

function UserRow({ initials, name, email, onLogout }: { initials: string; name?: string; email?: string; onLogout: () => void }) {
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
        <div style={{ fontSize: 12, fontWeight: 600, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 10, color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
      </div>
      <button
        onClick={onLogout}
        title="Se déconnecter"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#4b5563', display: 'flex', alignItems: 'center', flexShrink: 0 }}
      >
        <LogOut size={13} color="#4b5563" />
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
      background: 'rgba(8,8,8,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.055)',
      padding: '14px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: 12, color: '#4b5563', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{actions}</div>
      )}
    </div>
  );
}
