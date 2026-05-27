import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import api from '../lib/api';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      try {
        const { data } = await api.get('/api/users/me/referee-mat');
        if (data?.tournament_id) {
          navigate(`/t/${data.tournament_id}/mats`);
          return;
        }
      } catch {}
      navigate('/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/logo.svg"
            alt="Mat Manager"
            style={{ width: 140, height: 'auto', margin: '0 auto 1rem', display: 'block' }}
          />
          <h1 style={{ color: 'var(--fg)', fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Mat Manager</h1>
          <p style={{ color: 'var(--fg3)', fontSize: '0.8rem', marginTop: '0.3rem' }}>Gestion de tournois FFLDA / UWW</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--b3)',
          borderRadius: 20, padding: '2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.15)'
        }}>
          <h2 style={{ color: 'var(--fg)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', marginTop: 0 }}>
            Connexion
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: 'var(--fg3)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} color="var(--faint)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@lutte.app"
                  required
                  autoComplete="email"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--inp)', border: '1px solid var(--b3)',
                    borderRadius: 12, padding: '0.65rem 1rem 0.65rem 2.5rem',
                    color: 'var(--fg)', fontSize: '0.875rem', outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: 'var(--fg3)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} color="var(--faint)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--inp)', border: '1px solid var(--b3)',
                    borderRadius: 12, padding: '0.65rem 2.5rem 0.65rem 2.5rem',
                    color: 'var(--fg)', fontSize: '0.875rem', outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)' }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: 10, padding: '0.65rem 1rem', color: '#f87171',
                fontSize: '0.8rem', marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.8rem',
                background: loading ? '#991b1b' : '#dc2626',
                border: 'none', borderRadius: 12,
                color: 'white', fontWeight: 700, fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--dim)', fontSize: '0.75rem', marginTop: '1rem' }}>
          Accès réservé aux gestionnaires de tournois
        </p>
      </div>
    </div>
  );
}
