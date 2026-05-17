import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Search, Users } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Athletes() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState('');

  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes', search],
    queryFn: () => api.get('/api/athletes', { params: { search } }).then(r => r.data),
  });

  const importMutation = useMutation({
    mutationFn: (csv: string) => api.post('/api/import/athletes', { csv_data: csv }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['athletes'] });
      toast.success(`${r.data.created} créés, ${r.data.updated} mis à jour`);
      if (r.data.errors?.length) toast.error(`${r.data.errors.length} erreurs`);
      setShowImport(false);
      setCsvText('');
    },
    onError: () => toast.error('Erreur import'),
  });

  return (
    <Layout>
      <PageHeader
        title="Licenciés FFLDA"
        subtitle={`${athletes.length} athlètes`}
        actions={
          <button className="btn-primary" onClick={() => setShowImport(true)}>
            <Upload size={16} /> Importer CSV FFLDA
          </button>
        }
      />
      <div className="p-6 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9" placeholder="Rechercher par nom, prénom ou licence…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="table-dark w-full">
            <thead>
              <tr><th>Nom</th><th>Licence</th><th>Club</th><th>Catégorie</th><th>Style</th><th>Poids</th><th>Naissance</th></tr>
            </thead>
            <tbody>
              {athletes.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-500 py-12">
                  <Users size={32} className="mx-auto mb-2 text-gray-600" />
                  Aucun licencié — importez un fichier CSV FFLDA
                </td></tr>
              )}
              {athletes.map((a: any) => (
                <tr key={a.id}>
                  <td>
                    <div className="font-semibold">{a.last_name} {a.first_name}</div>
                    <div className="text-xs text-gray-500">{a.gender === 'M' ? 'M' : 'F'} • {a.nationality}</div>
                  </td>
                  <td className="font-mono text-xs text-gray-400">{a.license_number}</td>
                  <td className="text-gray-400">{a.club_short || a.club_name || '—'}</td>
                  <td>{a.age_category_imported || a.licensed_age_category || '—'}</td>
                  <td className="capitalize text-gray-400">{a.style || '—'}</td>
                  <td>{a.default_weight_kg ? `${a.default_weight_kg} kg` : '—'}</td>
                  <td className="text-gray-400 text-xs">{a.birth_date ? new Date(a.birth_date).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showImport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Importer licenciés FFLDA</h3>
            <p className="text-sm text-gray-400">Collez le contenu du fichier CSV exporté depuis le site FFLDA (séparateur point-virgule). Les données personnelles sensibles seront ignorées.</p>
            <textarea className="input h-48 resize-none font-mono text-xs" placeholder={`"Style";"Catégorie d'âge";"Statut";"N° Licence";"Nom";"Prénom"…`} value={csvText} onChange={e => setCsvText(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => { setShowImport(false); setCsvText(''); }}>Annuler</button>
              <button className="btn-primary" onClick={() => importMutation.mutate(csvText)} disabled={!csvText.trim() || importMutation.isPending}>
                {importMutation.isPending ? 'Import…' : 'Importer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
