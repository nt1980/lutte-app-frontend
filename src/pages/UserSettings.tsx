import { Sun, Moon, Monitor } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemePreference } from '../contexts/ThemeContext';

const options: { value: ThemePreference; label: string; icon: any; desc: string }[] = [
  { value: 'light',  label: 'Clair',   icon: Sun,     desc: 'Toujours en thème clair' },
  { value: 'dark',   label: 'Sombre',  icon: Moon,    desc: 'Toujours en thème sombre' },
  { value: 'system', label: 'Système', icon: Monitor, desc: 'Suit automatiquement le thème du navigateur / OS' },
];

export default function UserSettings() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <Layout>
      <PageHeader title="Affichage" subtitle="Personnalisation de l'interface" />

      <div style={{ padding: '24px', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Thème ── */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b2)' }}>
            <div style={{ fontWeight: 700, color: 'var(--fg)', fontSize: 14 }}>Thème de l'interface</div>
            <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 4 }}>
              Ce choix s'applique uniquement aux pages connectées. Les pages publiques suivent toujours le thème système.
            </div>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {options.map(({ value, label, icon: Icon, desc }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 12, width: '100%',
                    border: `1px solid ${active ? 'rgba(220,38,38,0.4)' : 'var(--b2)'}`,
                    background: active ? 'rgba(220,38,38,0.07)' : 'var(--inp)',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: active ? 'rgba(220,38,38,0.15)' : 'var(--inp)',
                    border: `1px solid ${active ? 'rgba(220,38,38,0.3)' : 'var(--b2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={17} color={active ? '#dc2626' : 'var(--fg3)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: active ? '#dc2626' : 'var(--fg)' }}>{label}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 2 }}>{desc}</div>
                  </div>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: active ? '#dc2626' : 'var(--inp)',
                    border: `2px solid ${active ? '#dc2626' : 'var(--b3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Aperçu du thème actif ── */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Aperçu actuel
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: resolvedTheme === 'dark' ? '#080808' : '#ffffff',
              border: `2px solid ${resolvedTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {resolvedTheme === 'dark'
                ? <Moon size={16} color="#6b7280" />
                : <Sun size={16} color="#f59e0b" />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>
                Thème {resolvedTheme === 'dark' ? 'sombre' : 'clair'} actif
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 2 }}>
                {theme === 'system' ? 'Détecté depuis le système' : 'Défini manuellement'}
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
