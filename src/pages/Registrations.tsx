import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Upload, Search, Users } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Registrations() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState('');

  const { data: regs = [] } = useQuery({
    queryKey: ['registrations', id],
    queryFn: () => api.get(`/api/tournaments/${id}/registrations`).then(r => r.data),
  });

  const importMutation = useMutation({
    mutationFn: (csv: string) => api.post(`/api/tournaments/${id}/registrations/import`, { csv_data: csv }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['registrations', id] });
      toast.success(`${r.data.registered} combattants inscrits`);
      if (r.data.errors?.length) toast.error(`${r.data.errors.length} erreurs`);
      setShowImport(false);
      setCsvText('');
    },
    onError: () => toast.error('Erreur import'),
  });

  const filtered = regs.filter((r: any) =>
    !search || `${r.last_name} ${r.first_name} ${r.license_number} ${r.club_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const byCategory = regs.reduce((acc: any, r: any) => {
    const k = r.final_age_category || 'Non catégorisé';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Inscriptions"
        subtitle={`${regs.length} combattants inscrits`}
        actions={
          <button className="btn-primary" onClick={() => setShowImport(true)}>
            <Upload size={16} /> Importer CSV FFLDA
          </button>
        }
      />
      <div className="p-6 space-y-4">
        {/* Stats par catégorie */}
        {Object.keys(byCategory).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(byCategory).map(([cat, count]: any) => (
              <span key={cat} className="badge-blue">{cat}: {count}</span>
            ))}
          </div>
        )}

        {/* Recherche */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <table className="table-dark w-full">
            <thead>
              <tr>
                <th>Nom</th><th>Licence</th><th>Club</th><th>Catégorie</th><th>Style</th><th>Pesée</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">
                  <Users size={24} className="mx-auto mb-2 text-gray-600" />Aucun combattant inscrit
                </td></tr>
              )}
              {filtered.map((r: any) => (
                <tr key={r.id}>
                  <td className="font-semibold">{r.last_name} {r.first_name}</td>
                  <td className="text-gray-400 font-mono text-xs">{r.license_number}</td>
                  <td className="text-gray-400">{r.club_short || r.club_name || '—'}</td>
                  <td>{r.final_age_category || <span className="text-gray-600">—</span>}</td>
                  <td className="capitalize text-gray-400">{r.final_style || '—'}</td>
                  <td>
                    {r.weigh_in_status === 'done' ? (
                      <span className="badge-green">{r.weigh_in_weight_kg} kg</span>
                    ) : r.weigh_in_status === 'no_show' ? (
                      <span className="badge-yellow">Absent</span>
                    ) : r.weigh_in_status === 'overweight' ? (
                      <span className="badge-red">Hors cat.</span>
                    ) : (
                      <span className="badge-gray">En attente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal import CSV */}
      {showImport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Importer CSV FFLDA</h3>
            <p className="text-sm text-gray-400">Collez le contenu du fichier CSV exporté depuis le site FFLDA (séparateur point-virgule).</p>
            <textarea
              className="input h-48 resize-none font-mono text-xs"
              placeholder={`"Style";"Catégorie d'âge";"Statut";"N° Licence";"Nom";"Prénom"…`}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => { setShowImport(false); setCsvText(''); }}>Annuler</button>
              <button className="btn-primary" onClick={() => importMutation.mutate(csvText)} disabled={!csvText.trim() || importMutation.isPending}>
                {importMutation.isPending ? 'Import en cours…' : 'Importer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
