import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Scale,
  Zap,
  Tv,
  Globe,
  Users,
  ChevronDown,
  ChevronUp,
  Mail,
  ArrowRight,
  Check,
  Menu,
  X,
  ExternalLink,
  AtSign,
  Share2,
} from 'lucide-react';

// ─── CSS Animations ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html { scroll-behavior: smooth; }

    body {
      background: #050505;
      color: #fff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    @keyframes orb-float-1 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33%       { transform: translate(40px, -60px) scale(1.08); }
      66%       { transform: translate(-30px, 30px) scale(0.95); }
    }
    @keyframes orb-float-2 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33%       { transform: translate(-50px, 40px) scale(1.05); }
      66%       { transform: translate(35px, -50px) scale(0.97); }
    }
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.35); }
      70%  { box-shadow: 0 0 0 14px rgba(220,38,38,0); }
      100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
    }
    @keyframes grid-scroll {
      0%   { background-position: 0 0; }
      100% { background-position: 0 60px; }
    }
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes bar-fill {
      from { width: 0%; }
      to   { width: var(--target-width); }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    .fade-up { animation: fade-up 0.7s ease both; }
    .fade-up-delay-1 { animation: fade-up 0.7s 0.15s ease both; }
    .fade-up-delay-2 { animation: fade-up 0.7s 0.30s ease both; }
    .fade-up-delay-3 { animation: fade-up 0.7s 0.45s ease both; }
    .fade-up-delay-4 { animation: fade-up 0.7s 0.60s ease both; }

    .feature-card:hover {
      border-color: rgba(220,38,38,0.35) !important;
      transform: translateY(-4px);
      background: rgba(255,255,255,0.055) !important;
    }
    .feature-card { transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease; }

    .stat-card:hover { border-color: rgba(220,38,38,0.4) !important; }
    .stat-card { transition: border-color 0.2s ease; }

    .testimonial-card:hover { transform: translateY(-3px); }
    .testimonial-card { transition: transform 0.2s ease; }

    .cta-primary:hover { background: #b91c1c !important; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(220,38,38,0.45) !important; }
    .cta-primary { transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; }

    .cta-ghost:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.25) !important; transform: translateY(-1px); }
    .cta-ghost { transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease; }

    .nav-link:hover { color: #fff !important; }
    .nav-link { transition: color 0.2s ease; }

    .footer-link:hover { color: #fff !important; }
    .footer-link { transition: color 0.2s ease; }

    .form-input:focus {
      outline: none;
      border-color: rgba(220,38,38,0.6) !important;
      background: rgba(255,255,255,0.06) !important;
      box-shadow: 0 0 0 3px rgba(220,38,38,0.12);
    }

    .accordion-btn:hover { background: rgba(255,255,255,0.04) !important; }
    .accordion-btn { transition: background 0.2s ease; }

    .icon-wrapper {
      width: 44px; height: 44px; border-radius: 12px;
      background: rgba(220,38,38,0.12);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .grid-bg {
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 60px 60px;
    }

    .gradient-text {
      background: linear-gradient(135deg, #fff 0%, #f87171 45%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .gradient-text-subtle {
      background: linear-gradient(135deg, #fff 0%, #d1d5db 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #050505; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
  `}</style>
);

// ─── Shared ─────────────────────────────────────────────────────────────────────

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
};

const SECTION_PADDING: React.CSSProperties = {
  padding: '100px 0',
};

const CONTAINER: React.CSSProperties = {
  maxWidth: 1160,
  margin: '0 auto',
  padding: '0 24px',
};

// ─── 1. Navbar ──────────────────────────────────────────────────────────────────

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 60,
    display: 'flex',
    alignItems: 'center',
    transition: 'background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease',
    background: scrolled ? 'rgba(5,5,5,0.85)' : 'transparent',
    backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
  };

  return (
    <nav style={navStyle}>
      <div style={{ ...CONTAINER, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.svg" alt="Mat Manager" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.3px' }}>Mat Manager</span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
          {[['Fonctionnalités', '#features'], ['Avantages', '#stats'], ['Contact', '#contact']].map(([label, href]) => (
            <a key={label} href={href} className="nav-link" style={{ color: '#9ca3af', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
              {label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/login"
            className="cta-primary"
            style={{
              background: '#dc2626',
              color: '#fff',
              padding: '8px 18px',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
              boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
            }}
          >
            Se connecter
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4, display: 'none' }}
            className="mobile-menu-btn"
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: 60, left: 0, right: 0,
          background: 'rgba(8,8,8,0.98)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '16px 24px 24px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {[['Fonctionnalités', '#features'], ['Avantages', '#stats'], ['Contact', '#contact']].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)}
              style={{ color: '#d1d5db', fontSize: 15, fontWeight: 500, textDecoration: 'none', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {label}
            </a>
          ))}
          <Link to="/login" onClick={() => setMenuOpen(false)} style={{ marginTop: 12, background: '#dc2626', color: '#fff', padding: '10px 18px', borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
            Se connecter
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
};

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────

const DashboardMockup = () => (
  <div style={{
    width: '100%', maxWidth: 820,
    background: 'rgba(255,255,255,0.035)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), 0 0 80px rgba(220,38,38,0.08)',
    position: 'relative',
  }}>
    {/* Titlebar */}
    <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c840' }} />
      <div style={{ flex: 1, textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: '#6b7280', background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '2px 12px' }}>
          lutte-app.fr/tournoi/championnats-idf-2025
        </span>
      </div>
    </div>

    {/* App chrome */}
    <div style={{ display: 'flex', minHeight: 320 }}>
      {/* Sidebar */}
      <div style={{ width: 180, background: 'rgba(0,0,0,0.35)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 8 }}>
          <img src="/logo.svg" alt="Mat Manager" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Mat Manager</span>
        </div>
        {[
          { label: 'Tableau de bord', active: true },
          { label: 'Inscriptions', active: false },
          { label: 'Pesée', active: false },
          { label: 'Tableaux', active: false },
          { label: 'Arbitrage', active: false },
          { label: 'Page publique', active: false },
        ].map(({ label, active }) => (
          <div key={label} style={{
            padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: active ? 600 : 400,
            color: active ? '#fff' : '#6b7280',
            background: active ? 'rgba(220,38,38,0.18)' : 'transparent',
            borderLeft: active ? '2px solid #dc2626' : '2px solid transparent',
          }}>
            {label}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Championnats IDF 2025</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>15 mars 2025 · Palais des Sports, Paris</div>
          </div>
          <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: '3px 10px', fontSize: 10, color: '#4ade80', fontWeight: 600 }}>
            En cours
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Combattants', value: '247', sub: '+12 aujourd\'hui', color: '#dc2626' },
            { label: 'Catégories', value: '18', sub: '6 terminées', color: '#3b82f6' },
            { label: 'Tapis actifs', value: '4/6', sub: '2 en pause', color: '#a855f7' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 9, color: '#4b5563', marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Progress rows */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', marginBottom: 10 }}>Avancement par catégorie</div>
          {[
            { label: '-57 kg Hommes', pct: 100, done: true },
            { label: '-65 kg Hommes', pct: 75, done: false },
            { label: '-74 kg Hommes', pct: 40, done: false },
            { label: '-57 kg Femmes', pct: 100, done: true },
          ].map(({ label, pct, done }) => (
            <div key={label} style={{ marginBottom: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: done ? '#4ade80' : '#d1d5db' }}>{label}</span>
                <span style={{ fontSize: 9, color: '#6b7280' }}>{pct}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: done ? 'linear-gradient(90deg,#16a34a,#4ade80)' : 'linear-gradient(90deg,#dc2626,#ef4444)', transition: 'width 1s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Live feed */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', animation: 'pulse-ring 1.5s infinite' }} />
            Résultats récents
          </div>
          {[
            { match: 'Martin L. vs Benali K.', result: '4–1', cat: 'Tapis 2', time: 'il y a 2 min' },
            { match: 'Dubois A. vs Santos P.', result: 'Pin', cat: 'Tapis 1', time: 'il y a 5 min' },
          ].map(({ match, result, cat, time }) => (
            <div key={match} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <div style={{ fontSize: 9, color: '#e5e7eb', fontWeight: 500 }}>{match}</div>
                <div style={{ fontSize: 8, color: '#6b7280' }}>{cat} · {time}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171' }}>{result}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── WeighIn Mockup ──────────────────────────────────────────────────────────

const WeighInMockup = () => (
  <div style={{
    width: '100%', maxWidth: 760,
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 50px 140px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04), 0 0 120px rgba(59,130,246,0.06)',
    position: 'relative',
  }}>
    {/* Titlebar */}
    <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c840' }} />
      <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 8 }}>Pesée — -65 kg Hommes Libre</span>
    </div>

    <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Left: Athlete card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Combattant suivant</div>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,rgba(220,38,38,0.3),rgba(220,38,38,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#f87171' }}>
              MB
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Martin Benali</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Licence #2406-3812</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>Club de Lutte de Grenoble</div>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['Catégorie', '-65 kg'], ['Style', 'Libre'], ['Âge', '23 ans'], ['Licence', 'Valide']].map(([k, v]) => (
              <div key={k} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '7px 10px' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>{k}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb', marginTop: 1 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Queue */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>File d'attente</div>
          {['Kevin Santos', 'Alexandre Dubois', 'Pedro Lima'].map((name, i) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>
                {i + 2}
              </div>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Scale readout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Lecture balance</div>
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 16,
          padding: '28px 20px',
          textAlign: 'center',
          boxShadow: '0 0 40px rgba(59,130,246,0.08) inset',
        }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#60a5fa', letterSpacing: '-2px', fontVariantNumeric: 'tabular-nums' }}>64.3</div>
          <div style={{ fontSize: 14, color: '#3b82f6', fontWeight: 500, marginTop: 2 }}>kg</div>
          <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 30, padding: '5px 14px' }}>
            <Check size={12} color="#4ade80" />
            <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>Dans la catégorie</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button style={{ width: '100%', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}>
            Valider la pesée
          </button>
          <button style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            Hors catégorie — refuser
          </button>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>Statistiques — -65 kg</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>Inscrits</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#fff' }}>24</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>Pesés</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#4ade80' }}>17 ✓</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>Refusés</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#f87171' }}>1</span>
          </div>
          <div style={{ marginTop: 10, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: '70%', background: 'linear-gradient(90deg,#dc2626,#ef4444)', borderRadius: 2 }} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── 2. Hero ─────────────────────────────────────────────────────────────────

const Hero = () => (
  <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 60 }} className="grid-bg">
    {/* Orbs */}
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(220,38,38,0.09) 0%, transparent 70%)',
        top: '10%', left: '-10%',
        animation: 'orb-float-1 18s ease-in-out infinite',
        filter: 'blur(30px)',
      }} />
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
        bottom: '5%', right: '-8%',
        animation: 'orb-float-2 22s ease-in-out infinite',
        filter: 'blur(30px)',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        filter: 'blur(40px)',
      }} />
    </div>

    <div style={{ ...CONTAINER, textAlign: 'center', position: 'relative', zIndex: 1, padding: '60px 24px' }}>
      {/* Grand logo */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <img src="/logo.svg" alt="Mat Manager" style={{ width: 'clamp(160px, 22vw, 280px)', height: 'auto', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 8px 32px rgba(220,38,38,0.25))' }} />
      </div>

      {/* Badge */}
      <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 30, padding: '5px 14px 5px 8px', marginBottom: 36 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(220,38,38,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={10} color="#f87171" fill="#f87171" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#f87171' }}>Conforme FFLDA · UWW 2025</span>
      </div>

      {/* Headline */}
      <h1 className="fade-up-delay-1" style={{ fontSize: 'clamp(38px, 6vw, 76px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2.5px', marginBottom: 24, maxWidth: 900, margin: '0 auto 24px' }}>
        <span className="gradient-text">La gestion de tournois de lutte, réinventée.</span>
      </h1>

      {/* Subtitle */}
      <p className="fade-up-delay-2" style={{ fontSize: 'clamp(15px, 2.2vw, 19px)', color: '#9ca3af', maxWidth: 580, margin: '0 auto 44px', lineHeight: 1.65, fontWeight: 400 }}>
        De l'inscription à la remise des médailles — tout en temps réel, pour les clubs et fédérations FFLDA.
      </p>

      {/* CTAs */}
      <div className="fade-up-delay-3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 72 }}>
        <a href="#contact" className="cta-primary" style={{ background: '#dc2626', color: '#fff', padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 24px rgba(220,38,38,0.4)' }}>
          Demander une démo
          <ArrowRight size={16} />
        </a>
        <a href="#features" className="cta-ghost" style={{ background: 'rgba(255,255,255,0.04)', color: '#e5e7eb', padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Voir le produit ↓
        </a>
      </div>

      {/* Dashboard mockup */}
      <div className="fade-up-delay-4" style={{ display: 'flex', justifyContent: 'center' }}>
        <DashboardMockup />
      </div>
    </div>
  </section>
);

// ─── 3. Features ──────────────────────────────────────────────────────────────

const features = [
  { icon: Upload, title: 'Import CSV FFLDA', desc: 'Importez vos licenciés en quelques secondes depuis l\'export officiel FFLDA, avec toutes les catégories d\'âge et les styles.' },
  { icon: Scale, title: 'Pesée digitale', desc: 'Interface optimisée pour valider les pesées rapidement, un combattant après l\'autre, avec lecture de balance en temps réel.' },
  { icon: Zap, title: 'Tableaux automatiques', desc: 'Nordique, poules + finales, tableau avec repêchage double — générés automatiquement selon les règles UWW.' },
  { icon: Tv, title: 'Arbitrage en direct', desc: 'Interface plein écran pour arbitrer, chronomètre intégré, saisie des points instantanée, résultats en temps réel.' },
  { icon: Globe, title: 'Page publique', desc: 'Programme, résultats et tapis live accessibles aux spectateurs sans compte, depuis n\'importe quel appareil.' },
  { icon: Users, title: 'Multi-rôles', desc: 'Admin, arbitre, responsable pesée, responsable tapis — chacun son accès, ses outils, ses permissions.' },
];

const Features = () => (
  <section id="features" style={{ ...SECTION_PADDING, position: 'relative' }}>
    <div style={CONTAINER}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 30, padding: '4px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Fonctionnalités</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', color: '#fff', marginBottom: 14 }}>
          Tout ce dont vous avez besoin.
        </h2>
        <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 440, margin: '0 auto' }}>
          Une plateforme complète, de la première inscription au palmarès final.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="feature-card" style={{ ...CARD_STYLE, padding: '28px 26px', cursor: 'default' }}>
            <div className="icon-wrapper" style={{ marginBottom: 18 }}>
              <Icon size={20} color="#dc2626" strokeWidth={1.8} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: '-0.3px' }}>{title}</h3>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65 }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── 4. Stats / Benefits ──────────────────────────────────────────────────────

const orgPoints = [
  'Importez votre fichier FFLDA en quelques secondes',
  'Générez les tableaux selon les règles UWW automatiquement',
  'Gérez pesée, arbitrage et tapis depuis un seul endroit',
  'Suivez l\'avancement de chaque catégorie en temps réel',
];

const specPoints = [
  'Consultez le programme sans inscription ni application',
  'Suivez les résultats en direct sur n\'importe quel écran',
  'Visualisez les combats en cours sur chaque tapis',
  'Accédez aux palmarès et résultats après le tournoi',
];

const Stats = () => (
  <section id="stats" style={{ ...SECTION_PADDING, background: 'rgba(255,255,255,0.012)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={CONTAINER}>
      {/* Big numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 1, marginBottom: 80 }}>
        {[
          { num: '100%', label: 'Compatible FFLDA' },
          { num: '6', label: 'Formats de compétition' },
          { num: '∞', label: 'Combattants par tournoi' },
          { num: 'Temps réel', label: 'Résultats & live' },
        ].map(({ num, label }, i) => (
          <div key={label} className="stat-card" style={{
            ...CARD_STYLE,
            borderRadius: i === 0 ? '20px 0 0 20px' : i === 3 ? '0 20px 20px 0' : '0',
            borderLeft: i > 0 ? 'none' : undefined,
            padding: '36px 28px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8, background: 'linear-gradient(135deg,#fff,#9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {num}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
        {[
          { title: 'Conçu pour les organisateurs', points: orgPoints, color: '#dc2626' },
          { title: 'Conçu pour les spectateurs', points: specPoints, color: '#3b82f6' },
        ].map(({ title, points, color }) => (
          <div key={title} style={{ ...CARD_STYLE, padding: '36px 32px' }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 28, letterSpacing: '-0.5px' }}>{title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {points.map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: `rgba(${color === '#dc2626' ? '220,38,38' : '59,130,246'},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Check size={11} color={color} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.55 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── 5. Product Preview ───────────────────────────────────────────────────────

const ProductPreview = () => (
  <section style={{ ...SECTION_PADDING, position: 'relative', overflow: 'hidden' }}>
    {/* Glow */}
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 400, background: 'radial-gradient(ellipse,rgba(59,130,246,0.06) 0%,transparent 70%)', pointerEvents: 'none', filter: 'blur(20px)' }} />

    <div style={{ ...CONTAINER, position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 30, padding: '4px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Interface terrain</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', color: '#fff', marginBottom: 14 }}>
          Une interface pensée pour le terrain.
        </h2>
        <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 480, margin: '0 auto' }}>
          Rapide, lisible, optimisée pour les salles de sport, les tablettes et les écrans de gestion.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <WeighInMockup />
      </div>
    </div>
  </section>
);

// ─── 6. Testimonials ─────────────────────────────────────────────────────────

const testimonials = [
  { quote: 'La gestion des pesées est maintenant deux fois plus rapide. L\'interface est claire et on fait zéro erreur.', author: 'Jean-Pierre M.', org: 'Club de Lutte de Grenoble', initials: 'JP' },
  { quote: 'On a géré 200 combattants sur 6 tapis sans aucun problème. Le tout depuis un seul écran, en temps réel.', author: 'Sophie R.', org: 'Ligue AURA', initials: 'SR' },
  { quote: 'Les parents suivent les résultats depuis leur téléphone, c\'est parfait. Plus besoin de courir aux tableaux.', author: 'Marc D.', org: 'CA Pontoise Lutte', initials: 'MD' },
];

const Testimonials = () => (
  <section style={{ ...SECTION_PADDING, background: 'rgba(255,255,255,0.012)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={CONTAINER}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-1.2px', color: '#fff', marginBottom: 12 }}>
          Ils nous font confiance.
        </h2>
        <p style={{ fontSize: 15, color: '#6b7280' }}>Clubs et ligues qui organisent leurs tournois avec Mat Manager.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {testimonials.map(({ quote, author, org, initials }) => (
          <div key={author} className="testimonial-card" style={{ ...CARD_STYLE, padding: '30px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Stars */}
            <div style={{ display: 'flex', gap: 3 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ width: 14, height: 14, background: '#dc2626', borderRadius: 3, opacity: 0.85 }} />
              ))}
            </div>
            <p style={{ fontSize: 14, color: '#d1d5db', lineHeight: 1.7, flex: 1 }}>"{quote}"</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,rgba(220,38,38,0.3),rgba(220,38,38,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#f87171', flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{author}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{org}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── 7. Contact ───────────────────────────────────────────────────────────────

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', club: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 14,
    color: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
    fontFamily: 'inherit',
  };

  return (
    <section id="contact" style={{ ...SECTION_PADDING, position: 'relative' }}>
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse,rgba(220,38,38,0.05) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ ...CONTAINER, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 30, padding: '4px 14px', marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#f87171' }}>Contact</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', color: '#fff', marginBottom: 14 }}>
            Chaque tournoi est unique.
          </h2>
          <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 500, margin: '0 auto' }}>
            Discutons de vos besoins pour trouver la solution adaptée à votre club ou fédération.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'start', maxWidth: 900, margin: '0 auto' }}>
          {/* Form */}
          <div style={{ ...CARD_STYLE, padding: '36px 32px' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <Check size={26} color="#4ade80" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Message envoyé !</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>Nous reviendrons vers vous dans les plus brefs délais pour discuter de votre projet.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Nom *</label>
                    <input required className="form-input" style={inputStyle} placeholder="Jean Dupont" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Email *</label>
                    <input required type="email" className="form-input" style={inputStyle} placeholder="jean@club.fr" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Club / Fédération</label>
                  <input className="form-input" style={inputStyle} placeholder="Club de Lutte de Paris" value={form.club} onChange={e => setForm({ ...form, club: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Message *</label>
                  <textarea
                    required
                    className="form-input"
                    style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                    placeholder="Décrivez votre tournoi, le nombre de participants, vos besoins..."
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                  />
                </div>
                <button type="submit" className="cta-primary" style={{ width: '100%', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 11, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 18px rgba(220,38,38,0.35)' }}>
                  Envoyer le message
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ ...CARD_STYLE, padding: '28px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(220,38,38,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={20} color="#dc2626" strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 3 }}>Email direct</div>
                  <a href="mailto:contact@lutte-app.fr" style={{ fontSize: 15, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>contact@lutte-app.fr</a>
                </div>
              </div>
            </div>

            <div style={{ ...CARD_STYLE, padding: '28px 26px' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Ce que nous pouvons faire pour vous</h4>
              {[
                'Démo personnalisée de la plateforme',
                'Configuration de votre premier tournoi',
                'Formation de votre équipe organisatrice',
                'Support le jour J de votre événement',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={10} color="#dc2626" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── 8. FAQ ───────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: 'Le logiciel est-il compatible avec les exports FFLDA ?',
    a: 'Oui, Mat Manager importe directement les fichiers CSV exportés depuis le site de la FFLDA, avec toutes les catégories d\'âge et les styles (libre, gréco-romaine, féminine).',
  },
  {
    q: 'Combien de tapis peut-on gérer simultanément ?',
    a: 'Autant que nécessaire. Chaque tapis dispose d\'une vue live indépendante et d\'une interface arbitre dédiée, accessible depuis n\'importe quel appareil connecté.',
  },
  {
    q: 'Les spectateurs ont-ils besoin d\'un compte pour voir les résultats ?',
    a: 'Non. La page publique du tournoi est accessible à tous sans inscription, depuis n\'importe quel appareil. Un simple lien ou QR code suffit.',
  },
  {
    q: 'Peut-on gérer plusieurs rôles ?',
    a: 'Oui. Vous pouvez attribuer des rôles spécifiques : admin, arbitre, responsable pesée ou responsable tapis, avec des accès et des interfaces adaptés à chaque fonction.',
  },
  {
    q: 'Les données sont-elles sécurisées ?',
    a: 'Oui. Les données sont hébergées de façon sécurisée, avec authentification JWT, contrôle des accès par tournoi et chiffrement des données sensibles.',
  },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" style={{ ...SECTION_PADDING, background: 'rgba(255,255,255,0.012)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ ...CONTAINER, maxWidth: 740 }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-1.2px', color: '#fff', marginBottom: 12 }}>
            Questions fréquentes
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280' }}>Tout ce que vous devez savoir avant de vous lancer.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map(({ q, a }, i) => (
            <div key={i} style={{ ...CARD_STYLE, overflow: 'hidden' }}>
              <button
                className="accordion-btn"
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: '100%', background: 'transparent', border: 'none', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', gap: 16, borderRadius: 20 }}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: open === i ? '#fff' : '#e5e7eb', lineHeight: 1.4 }}>{q}</span>
                <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: open === i ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s ease' }}>
                  {open === i ? <ChevronUp size={15} color="#f87171" /> : <ChevronDown size={15} color="#6b7280" />}
                </div>
              </button>
              {open === i && (
                <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, paddingTop: 16 }}>{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── 9. Footer ────────────────────────────────────────────────────────────────

const Footer = () => (
  <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 70, paddingBottom: 40 }}>
    <div style={CONTAINER}>
      {/* Top grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 48, marginBottom: 60 }}>
        {/* Brand */}
        <div style={{ gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <img src="/logo.svg" alt="Mat Manager" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Mat Manager</span>
          </div>
          <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.65, maxWidth: 220 }}>
            La plateforme de référence pour la gestion de tournois de lutte en France.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {[Share2, AtSign, ExternalLink].map((Icon, i) => (
              <div key={i} style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon size={15} color="#6b7280" />
              </div>
            ))}
          </div>
        </div>

        {/* Produit */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>Produit</div>
          {[['Fonctionnalités', '#features'], ['Démo', '#contact'], ['Contact', '#contact']].map(([label, href]) => (
            <a key={label} href={href} className="footer-link" style={{ display: 'block', fontSize: 13, color: '#6b7280', textDecoration: 'none', marginBottom: 10 }}>
              {label}
            </a>
          ))}
        </div>

        {/* Légal */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>Légal</div>
          {['Mentions légales', 'CGU', 'Confidentialité'].map(label => (
            <a key={label} href="#" className="footer-link" style={{ display: 'block', fontSize: 13, color: '#6b7280', textDecoration: 'none', marginBottom: 10 }}>
              {label}
            </a>
          ))}
        </div>

        {/* Contact */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>Contact</div>
          <a href="mailto:contact@lutte-app.fr" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280', textDecoration: 'none', marginBottom: 10 }}>
            <Mail size={13} />
            contact@lutte-app.fr
          </a>
          <p style={{ fontSize: 12, color: '#374151', marginTop: 16, lineHeight: 1.6 }}>
            Réponse sous 24h<br />Du lundi au vendredi
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 12, color: '#374151' }}>© 2025 Mat Manager. Tous droits réservés.</span>
        <span style={{ fontSize: 12, color: '#374151' }}>Conforme FFLDA · UWW</span>
      </div>
    </div>
  </footer>
);

// ─── Root component ───────────────────────────────────────────────────────────

const LandingPage: React.FC = () => (
  <>
    <GlobalStyles />
    <div style={{ background: '#050505', minHeight: '100vh' }}>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Stats />
        <ProductPreview />
        <Testimonials />
        <Contact />
        <FAQ />
      </main>
      <Footer />
    </div>
  </>
);

export default LandingPage;
