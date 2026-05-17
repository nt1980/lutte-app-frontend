import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Trophy } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center mb-4">
            <Trophy size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Lutte App</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion de tournois FFLDA / UWW</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-5">Connexion</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@lutte.app" required />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <div className="text-sm text-red-400 bg-red-600/10 border border-red-600/20 rounded-lg px-3 py-2">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-600 mt-4">Accès réservé aux administrateurs du tournoi</p>
      </div>
    </div>
  );
}
