import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './store/auth';

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
import PublicTournament from './pages/public/PublicTournament';
import PublicProgramme from './pages/public/PublicProgramme';
import PublicResultats from './pages/public/PublicResultats';
import LandingPage from './pages/public/LandingPage';

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1 } } });

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/mat/:matId" element={<MatLive />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/tournaments" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/tournaments/new" element={<PrivateRoute><TournamentNew /></PrivateRoute>} />
          <Route path="/athletes" element={<PrivateRoute><Athletes /></PrivateRoute>} />
          <Route path="/clubs" element={<PrivateRoute><Clubs /></PrivateRoute>} />
          <Route path="/t/:id" element={<PrivateRoute><TournamentDetail /></PrivateRoute>} />
          <Route path="/t/:id/registrations" element={<PrivateRoute><Registrations /></PrivateRoute>} />
          <Route path="/t/:id/weigh-in" element={<PrivateRoute><WeighIn /></PrivateRoute>} />
          <Route path="/t/:id/competitions" element={<PrivateRoute><Competitions /></PrivateRoute>} />
          <Route path="/t/:id/brackets" element={<PrivateRoute><Brackets /></PrivateRoute>} />
          <Route path="/t/:id/mats" element={<PrivateRoute><MatManager /></PrivateRoute>} />
          <Route path="/t/:id/users" element={<PrivateRoute><TournamentUsers /></PrivateRoute>} />
          <Route path="/t/:id/audit" element={<PrivateRoute><AuditLogs /></PrivateRoute>} />
          <Route path="/t/:id/settings" element={<PrivateRoute><TournamentSettings /></PrivateRoute>} />
          <Route path="/ref/:matchId" element={<PrivateRoute><RefView /></PrivateRoute>} />
          <Route path="/tournoi/:slug" element={<PublicTournament />} />
          <Route path="/tournoi/:slug/programme" element={<PublicProgramme />} />
          <Route path="/tournoi/:slug/resultats" element={<PublicResultats />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1A1A1A', color: '#fff', border: '1px solid #2E2E2E' }, success: { iconTheme: { primary: '#DC2626', secondary: '#fff' } } }} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
