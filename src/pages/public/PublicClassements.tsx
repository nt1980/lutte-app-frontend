import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { BarChart2, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';

// ── Médailles / labels ────────────────────────────────────────────────────────
const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉', 4: '4e' };

// ── Types ─────────────────────────────────────────────────────────────────────
interface Competition {
  id: string;
  style: string;
  age_category: string;
  weight_category: string | null;
  format_type: string;
}

interface PoolEntry {
  rank: number;
  id: string;
  name: string;
  club: string;
  wins: number;
  draws?: number;
  losses: number;
  pts: number;
  tech_pts: number;
  tech_pts_against: number;
}

interface BracketEntry {
  rank: number;
  athlete_id: string;
  name: string | null;
  club: string | null;
}

interface JeunesPool {
  pool_name: string;
  rankings: PoolEntry[];
}

interface CompBlock {
  competition: Competition;
  type: 'pool' | 'bracket' | 'jeunes';
  rankings?: (PoolEntry | BracketEntry)[];
  pools?: JeunesPool[];
}

// ── Styles inline réutilisables ───────────────────────────────────────────────
const TH: React.CSSProperties = {
  padding: '6px 10px', fontSize: '0.7rem', fontWeight: 700,
  color: 'var(--fg3)', textTransform: 'uppercase' as const, letterSpacing: '0.08em',
  background: 'var(--inp)', textAlign: 'center' as const,
};
const TD: React.CSSProperties = {
  padding: '7px 10px', fontSize: '0.82rem', borderTop: '1px solid var(--b1)',
  verticalAlign: 'middle' as const,
};

// ── Composant table classement nordique / jeunes ──────────────────────────────
function PoolTable({ rankings, isJeunes }: { rankings: PoolEntry[]; isJeunes?: boolean }) {
  if (!rankings.length) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--fg3)', fontSize: '0.85rem' }}>
        Aucun résultat pour l'instant
      </div>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...TH, width: 36, textAlign: 'center' }}>#</th>
            <th style={{ ...TH, textAlign: 'left' }}>Nom</th>
            <th style={{ ...TH, textAlign: 'left' }}>Club</th>
            <th style={TH}>V</th>
            {isJeunes && <th style={TH}>N</th>}
            <th style={TH}>D</th>
            <th style={TH}>Pts cl.</th>
            <th style={TH}>Pts tech</th>
            {!isJeunes && <th style={TH}>Diff.</th>}
          </tr>
        </thead>
        <tbody>
          {rankings.map((r, i) => {
            const diff = r.tech_pts - r.tech_pts_against;
            const isTop3 = i < 3;
            return (
              <tr key={r.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ ...TD, textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: isTop3 ? 'var(--fg)' : 'var(--fg3)' }}>
                  {RANK_MEDAL[r.rank] ?? r.rank}
                </td>
                <td style={{ ...TD, fontWeight: isTop3 ? 700 : 400, color: 'var(--fg)' }}>{r.name}</td>
                <td style={{ ...TD, color: 'var(--fg3)', fontSize: '0.75rem' }}>{r.club || '—'}</td>
                <td style={{ ...TD, textAlign: 'center', color: '#4ade80', fontWeight: 600 }}>{r.wins}</td>
                {isJeunes && <td style={{ ...TD, textAlign: 'center', color: '#facc15', fontWeight: 600 }}>{r.draws ?? 0}</td>}
                <td style={{ ...TD, textAlign: 'center', color: '#f87171', fontWeight: 600 }}>{r.losses}</td>
                <td style={{ ...TD, textAlign: 'center', fontWeight: 700 }}>{r.pts}</td>
                <td style={{ ...TD, textAlign: 'center', color: 'var(--fg3)' }}>{r.tech_pts}</td>
                {!isJeunes && (
                  <td style={{ ...TD, textAlign: 'center', color: diff >= 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                    {diff >= 0 ? `+${diff}` : diff}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Podium bracket (top 4) ────────────────────────────────────────────────────
function BracketPodium({ rankings }: { rankings: BracketEntry[] }) {
  if (!rankings.length) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--fg3)', fontSize: '0.85rem' }}>
        Aucun résultat pour l'instant
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px' }}>
      {rankings.map(r => (
        <div key={r.athlete_id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '8px 12px', borderRadius: 10,
          background: r.rank === 1 ? 'rgba(251,191,36,0.08)' : r.rank === 2 ? 'rgba(156,163,175,0.08)' : r.rank === 3 ? 'rgba(180,83,9,0.08)' : 'transparent',
          border: r.rank === 1 ? '1px solid rgba(251,191,36,0.2)' : r.rank === 2 ? '1px solid rgba(156,163,175,0.15)' : r.rank === 3 ? '1px solid rgba(180,83,9,0.15)' : '1px solid transparent',
        }}>
          <span style={{ fontSize: r.rank <= 3 ? '1.4rem' : '0.85rem', minWidth: 32, textAlign: 'center', fontWeight: 700, color: 'var(--fg3)' }}>
            {RANK_MEDAL[r.rank] ?? `${r.rank}e`}
          </span>
          <div>
            <div style={{ fontWeight: r.rank <= 3 ? 700 : 500, fontSize: '0.9rem', color: r.name ? 'var(--fg)' : 'var(--fg3)' }}>
              {r.name || '—'}
            </div>
            {r.club && <div style={{ fontSize: '0.72rem', color: 'var(--fg3)' }}>{r.club}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function PublicClassements() {
  const { slug } = useParams<{ slug: string }>();

  const { data: tournament } = useQuery({
    queryKey: ['public-tournament', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}`).then(r => r.data),
  });

  const { data: blocks = [], isLoading, isError } = useQuery<CompBlock[]>({
    queryKey: ['public-rankings', slug],
    queryFn: () => api.get(`/api/tournaments/${slug}/public-rankings`).then(r => r.data),
    enabled: !!tournament?.public_rankings_enabled,
    refetchInterval: 30000,
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Topbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--b2)',
        position: 'sticky', top: 0, background: 'var(--bg)', backdropFilter: 'blur(12px)', zIndex: 10,
      }}>
        <Link to={`/tournoi/${slug}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg3)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
          <ArrowLeft size={16} /> {tournament?.name || 'Retour'}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={13} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Classements</span>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.4rem' }}>Classements</h1>
          {tournament && (
            <p style={{ color: 'var(--fg3)', fontSize: '0.875rem' }}>
              {tournament.name} · {blocks.length} catégorie{blocks.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--fg3)' }}>Chargement des classements…</div>
        )}
        {isError && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <BarChart2 size={32} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--dim)' }} />
            <div style={{ color: '#f87171', fontWeight: 600, marginBottom: '0.5rem' }}>Classements non disponibles</div>
            <div style={{ color: 'var(--fg3)', fontSize: '0.875rem' }}>Les classements ne sont pas encore publiés.</div>
          </div>
        )}
        {!isLoading && !isError && blocks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <BarChart2 size={32} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--dim)' }} />
            <div style={{ color: 'var(--fg3)', fontWeight: 600, marginBottom: '0.5rem' }}>Aucun classement pour l'instant</div>
            <div style={{ color: 'var(--fg3)', fontSize: '0.875rem' }}>Les classements apparaîtront ici dès que des combats seront terminés.</div>
          </div>
        )}

        {blocks.map(block => {
          const { competition: comp, type } = block;
          const catLabel = `${comp.age_category}${comp.weight_category ? ` · ${comp.weight_category} kg` : ''} — ${comp.style || ''}`;

          return (
            <div key={comp.id} style={{ marginBottom: '2rem' }}>
              {/* En-tête catégorie */}
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
                {catLabel}
              </div>

              {/* Contenu selon le type */}
              {type === 'bracket' && (
                <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden' }}>
                  <BracketPodium rankings={(block.rankings ?? []) as BracketEntry[]} />
                </div>
              )}

              {type === 'pool' && (
                <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden' }}>
                  <PoolTable rankings={(block.rankings ?? []) as PoolEntry[]} isJeunes={false} />
                </div>
              )}

              {type === 'jeunes' && (block.pools ?? []).map(pool => (
                <div key={pool.pool_name} style={{ marginBottom: '1rem' }}>
                  <div style={{
                    padding: '6px 14px', background: 'var(--inp)',
                    borderRadius: '12px 12px 0 0', border: '1px solid var(--b2)', borderBottom: 'none',
                    fontSize: '0.72rem', fontWeight: 700, color: 'var(--fg3)',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                  }}>
                    {pool.pool_name}
                  </div>
                  <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                    <PoolTable rankings={pool.rankings} isJeunes />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
