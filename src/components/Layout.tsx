import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import {
  Trophy, LayoutDashboard, Users, Building2, ListChecks, Scale, Zap,
  Grid3X3, LogOut, Settings, Activity, Shield, ChevronLeft
} from 'lucide-react';

const globalNav = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/athletes',   label: 'Licenciés',  icon: Users           },
  { to: '/clubs',      label: 'Clubs',      icon: Building2       },
];

const tournamentNav = (id: string) => [
  { to: `/t/${id}`,              label: 'Vue générale',   icon: LayoutDashboard },
  { to: `/t/${id}/registrations`,label: 'Inscriptions',   icon: ListChecks      },
  { to: `/t/${id}/weigh-in`,     label: 'Pesée',          icon: Scale           },
  { to: `/t/${id}/competitions`, label: 'Compétitions',   icon: Grid3X3         },
  { to: `/t/${id}/brackets`,     label: 'Tableaux',       icon: Zap             },
  { to: `/t/${id}/mats`,         label: 'Tapis',          icon: Activity        },
  { to: `/t/${id}/users`,        label: 'Utilisateurs',   icon: Users           },
  { to: `/t/${id}/audit`,        label: 'Audit',          icon: Shield          },
  { to: `/t/${id}/settings`,     label: 'Paramètres',     icon: Settings        },
];

export default function Layout({ children, tournamentId }: { children: React.ReactNode; tournamentId?: string }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="flex h-screen bg-[#080808] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-58 bg-[#0e0e0e] border-r border-white/[0.06] flex flex-col shrink-0" style={{ width: 224 }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-900/40">
            <Trophy size={15} className="text-white" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white tracking-tight">Lutte App</div>
            <div className="text-[10px] text-gray-600 font-medium">FFLDA / UWW</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">

          {/* Global nav */}
          {globalNav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} className={`sidebar-link ${active ? 'active' : ''}`}>
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            );
          })}

          {/* Tournament nav */}
          {tournamentId && (
            <>
              <div className="px-3 pt-5 pb-2">
                <Link to="/dashboard" className="flex items-center gap-1.5 text-[10px] text-gray-600 hover:text-gray-400 transition-colors mb-2">
                  <ChevronLeft size={10} /> Tous les tournois
                </Link>
                <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Ce tournoi</div>
              </div>
              {tournamentNav(tournamentId).map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link key={to} to={to} className={`sidebar-link ${active ? 'active' : ''}`}>
                    <Icon size={15} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.04] transition-colors group">
            <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center text-[11px] font-bold text-red-400 shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-gray-300 truncate">{user?.name}</div>
              <div className="text-[10px] text-gray-600 truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Se déconnecter"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
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
    <div className="sticky top-0 z-10 bg-[#080808]/80 backdrop-blur-md border-b border-white/[0.06] px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[17px] font-black text-white tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-[12px] text-gray-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
