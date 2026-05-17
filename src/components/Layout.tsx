import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import {
  Trophy, LayoutDashboard, Users, Club, ListChecks, Scale, Zap,
  Grid3X3, LogOut, Settings, BarChart3, Shield
} from 'lucide-react';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tournaments', label: 'Tournois', icon: Trophy },
  { to: '/athletes', label: 'Licenciés', icon: Users },
  { to: '/clubs', label: 'Clubs', icon: Club },
];

const tournamentNav = (id: string) => [
  { to: `/t/${id}`, label: 'Vue générale', icon: LayoutDashboard },
  { to: `/t/${id}/registrations`, label: 'Inscriptions', icon: ListChecks },
  { to: `/t/${id}/weigh-in`, label: 'Pesée', icon: Scale },
  { to: `/t/${id}/competitions`, label: 'Compétitions', icon: Grid3X3 },
  { to: `/t/${id}/brackets`, label: 'Tableaux', icon: Zap },
  { to: `/t/${id}/mats`, label: 'Tapis', icon: BarChart3 },
  { to: `/t/${id}/users`, label: 'Utilisateurs', icon: Users },
  { to: `/t/${id}/audit`, label: 'Audit', icon: Shield },
  { to: `/t/${id}/settings`, label: 'Paramètres', icon: Settings },
];

export default function Layout({ children, tournamentId }: { children: React.ReactNode; tournamentId?: string }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-[#0F0F0F] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1A1A1A] border-r border-[#2E2E2E] flex flex-col shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[#2E2E2E]">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center">
            <Trophy size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Lutte App</div>
            <div className="text-[10px] text-gray-500">Gestion tournois</div>
          </div>
        </div>

        {/* Nav global */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`sidebar-link ${location.pathname === to ? 'active' : ''}`}>
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          ))}

          {tournamentId && (
            <>
              <div className="px-3 pt-4 pb-1">
                <span className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">Ce tournoi</span>
              </div>
              {tournamentNav(tournamentId).map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className={`sidebar-link ${location.pathname === to ? 'active' : ''}`}>
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User */}
        <div className="border-t border-[#2E2E2E] p-3">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-red-600/30 flex items-center justify-center text-xs font-bold text-red-400">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-gray-500 truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between px-6 py-5 border-b border-[#2E2E2E]">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
