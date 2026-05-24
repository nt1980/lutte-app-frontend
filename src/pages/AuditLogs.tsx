import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';

import React from 'react';

const ACTION_STYLE: Record<string, { color: string; bg: string }> = {
  CREATE:                { color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
  UPDATE:                { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  DELETE:                { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  MATCH_RESULT:          { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
  GENERATE_COMPETITIONS: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
};

const TH: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--b2)', whiteSpace: 'nowrap' };
const TD: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid var(--b1)', verticalAlign: 'middle' };

export default function AuditLogs() {
  const { id } = useParams<{ id: string }>();

  const { data: logs = [] } = useQuery({
    queryKey: ['audit', id],
    queryFn: () => api.get(`/api/tournaments/${id}/audit`).then(r => r.data),
    refetchInterval: 30000,
  });

  return (
    <Layout tournamentId={id}>
      <PageHeader title="Audit" subtitle="Historique des actions sur ce tournoi" />

      <div style={{ padding: '20px 24px' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden' }}>
          {logs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', textAlign: 'center' }}>
              <Shield size={28} color="var(--dim)" style={{ marginBottom: 10 }} />
              <div style={{ color: 'var(--fg3)', fontSize: 13 }}>Aucune action enregistrée</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--inp)' }}>
                    <th style={TH}>Date</th>
                    <th style={TH}>Utilisateur</th>
                    <th style={TH}>Action</th>
                    <th style={TH}>Entité</th>
                    <th style={{ ...TH, display: 'none' }}>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l: any, i: number) => {
                    const style = ACTION_STYLE[l.action] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
                    return (
                      <tr key={l.id} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--b1)' }}>
                        <td style={TD}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--fg3)' }}>
                            {new Date(l.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td style={TD}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--inp)', border: '1px solid var(--b3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--fg3)', flexShrink: 0 }}>
                              {l.user_name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                            </div>
                            <span style={{ fontSize: 13, color: 'var(--fg2)', fontWeight: 500 }}>{l.user_name || '—'}</span>
                          </div>
                        </td>
                        <td style={TD}>
                          <span style={{ background: style.bg, color: style.color, borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>
                            {l.action}
                          </span>
                        </td>
                        <td style={TD}>
                          <div style={{ fontSize: 12, color: 'var(--fg3)', fontWeight: 500 }}>{l.entity_type}</div>
                          {l.entity_id && (
                            <div style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'monospace', marginTop: 2 }}>{l.entity_id.slice(0, 8)}…</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
