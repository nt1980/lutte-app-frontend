import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';

const actionColor: Record<string, string> = {
  CREATE: 'badge-green', UPDATE: 'badge-blue', DELETE: 'badge-red',
  MATCH_RESULT: 'badge-yellow', GENERATE_COMPETITIONS: 'badge-blue',
};

export default function AuditLogs() {
  const { id } = useParams<{ id: string }>();
  const { data: logs = [] } = useQuery({
    queryKey: ['audit', id],
    queryFn: () => api.get(`/api/tournaments/${id}/audit`).then(r => r.data),
    refetchInterval: 30000,
  });

  return (
    <Layout tournamentId={id}>
      <PageHeader title="Audit Logs" subtitle="Historique des actions" />
      <div className="p-6">
        <div className="card p-0 overflow-hidden">
          <table className="table-dark w-full">
            <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Entité</th></tr></thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={4} className="text-center text-gray-500 py-8">
                  <Shield size={24} className="mx-auto mb-2 text-gray-600" />Aucune action enregistrée
                </td></tr>
              )}
              {logs.map((l: any) => (
                <tr key={l.id}>
                  <td className="text-xs text-gray-400 font-mono">{new Date(l.created_at).toLocaleString('fr-FR')}</td>
                  <td className="text-sm">{l.user_name || '—'}</td>
                  <td><span className={actionColor[l.action] || 'badge-gray'}>{l.action}</span></td>
                  <td className="text-xs text-gray-400">{l.entity_type} {l.entity_id?.slice(0, 8)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
