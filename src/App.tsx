import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './store/auth';
import { PublicThemeApplier } from './contexts/ThemeContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TournamentNew from './pages/TournamentNew';
import TournamentDetail from './pages/TournamentDetail';
import Registrations from './pages/Registrations';
import WeighIn from './pages/WeighIn';
import Competitions from './pages/Competitions';
import Brackets from './pages/Brackets';
import Athletes from './pages/Athletes';
import Clubs from './pages/Clubs';
import TournamentSettings from './pages/TournamentSettings';
import MatLive from './pages/MatLive';
import MatManager from './pages/MatManager';
import RefView from './pages/RefView';
import TournamentUsers from './pages/TournamentUsers';
import AuditLogs from './pages/AuditLogs';
import UserSettings from './pages/UserSettings';
import Jeunes from './pages/Jeunes';
import PublicTournament from './pages/public/PublicTournament';
import PublicProgramme from './pages/public/PublicProgramme';
import PublicResultats from './pages/public/PublicResultats';
import LandingPage from './pages/public/LandingPage';

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1 } } });

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Wrapper pour les pages publiques : force le thème système */
function PublicRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicThemeApplier />
      {children}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* ── Pages publiques (toujours thème système) ── */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/mat/:matId" element={<PublicRoute><MatLive /></PublicRoute>} />
          <Route path="/t/:id/mat/:matSlug" element={<PublicRoute><MatLive /></PublicRoute>} />
          <Route path="/tournoi/:slug" element={<PublicRoute><PublicTournament /></PublicRoute>} />
          <Route path="/tournoi/:slug/programme" element={<PublicRoute><PublicProgramme /></PublicRoute>} />
          <Route path="/tournoi/:slug/resultats" element={<PublicRoute><PublicResultats /></PublicRoute>} />

          {/* ── Pages privées (thème utilisateur) ── */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/tournaments" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/tournaments/new" element={<PrivateRoute><TournamentNew /></PrivateRoute>} />
          <Route path="/athletes" element={<PrivateRoute><Athletes /></PrivateRoute>} />
          <Route path="/clubs" element={<PrivateRoute><Clubs /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><UserSettings /></PrivateRoute>} />
          <Route path="/t/:id" element={<PrivateRoute><TournamentDetail /></PrivateRoute>} />
          <Route path="/t/:id/registrations" element={<PrivateRoute><Registrations /></PrivateRoute>} />
          <Route path="/t/:id/weigh-in" element={<PrivateRoute><WeighIn /></PrivateRoute>} />
          <Route path="/t/:id/jeunes" element={<PrivateRoute><Jeunes /></PrivateRoute>} />
          <Route path="/t/:id/competitions" element={<PrivateRoute><Competitions /></PrivateRoute>} />
          <Route path="/t/:id/brackets" element={<PrivateRoute><Brackets /></PrivateRoute>} />
          <Route path="/t/:id/mats" element={<PrivateRoute><MatManager /></PrivateRoute>} />
          <Route path="/t/:id/users" element={<PrivateRoute><TournamentUsers /></PrivateRoute>} />
          <Route path="/t/:id/audit" element={<PrivateRoute><AuditLogs /></PrivateRoute>} />
          <Route path="/t/:id/settings" element={<PrivateRoute><TournamentSettings /></PrivateRoute>} />
          <Route path="/ref/:matchId" element={<PrivateRoute><RefView /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: 'var(--card)', color: 'var(--fg)', border: '1px solid var(--b3)' },
            success: { iconTheme: { primary: '#22c55e', secondary: 'var(--card)' } },
            error: { iconTheme: { primary: '#ef4444', secondary: 'var(--card)' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
