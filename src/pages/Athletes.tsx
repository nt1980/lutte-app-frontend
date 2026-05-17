import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Search, Users, X, FileText, AlertCircle } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Athletes() {
  const qc = useQueryClient();
  const [search,     setSearch]     = useState('');
  const [showImport, setShowImport] = useState(false);
  const [csvText,    setCsvText]    = useState('');

  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ['athletes', search],
    queryFn: () => api.get('/api/athletes', { params: { search } }).then(r => r.data),
  });

  const importMutation = useMutation({
    mutationFn: (csv: string) => api.post('/api/import/athletes', { csv_data: csv }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['athletes'] });
      toast.success(`${r.data.created} créés · ${r.data.updated} mis à jour`);
      if (r.data.errors?.length) toast.error(`${r.data.errors.length} erreur(s)`);
      setShowImport(false);
      setCsvText('');
    },
    onError: () => toast.error('Erreur lors de l\'import'),
  });

  return (
    <Layout>
      <PageHeader
        title="Licenciés FFLDA"
        subtitle={`${athletes.length} athlètes dans la base`}
        actions={
          <button className="btn-primary" onClick={() => setShowImport(true)}>
            <Upload size={15} /> Importer CSV
          </button>
        }
      />

      <div className="p-6 space-y-4 animate-fade-in">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            className="input pl-10"
            placeholder="Nom, prénom, numéro de licence…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden">
          <table className="table-dark w-full">
            <thead>
              <tr>
                <th>Combattant</th>
                <th>Licence</th>
                <th>Club</th>
                <th>Catégorie</th>
                <th>Style</th>
                <th>Poids</th>
                <th>Naissance</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex justify-center gap-1">
                      {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-700 animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />)}
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && athletes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Users size={28} className="mx-auto text-gray-700 mb-3" />
                    <div className="text-gray-500 font-medium">
                      {search ? 'Aucun résultat' : 'Aucun licencié'}
                    </div>
                    {!search && <div className="text-gray-700 text-xs mt-1">Importez un fichier CSV FFLDA pour peupler la base</div>}
                  </td>
                </tr>
              )}
              {athletes.map((a: any) => (
                <tr key={a.id}>
                  <td>
                    <div className="font-semibold text-white">{a.last_name} {a.first_name}</div>
                    <div className="text-[11px] text-gray-600 mt-0.5">
                      {a.gender === 'M' ? '♂ Masculin' : '♀ Féminin'}
                      {a.nationality ? ` · ${a.nationality}` : ''}
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-md">
                      {a.license_number || '—'}
                    </span>
                  </td>
                  <td className="text-gray-400 text-sm">{a.club_short || a.club_name || '—'}</td>
                  <td>
                    {(a.age_category_imported || a.licensed_age_category)
                      ? <span className="badge-blue">{a.age_category_imported || a.licensed_age_category}</span>
                      : <span className="text-gray-700">—</span>}
                  </td>
                  <td className="capitalize text-gray-500 text-xs">{a.style || '—'}</td>
                  <td className="text-gray-300 text-sm">{a.default_weight_kg ? `${a.default_weight_kg} kg` : '—'}</td>
                  <td className="text-gray-600 text-xs font-mono">
                    {a.birth_date ? new Date(a.birth_date).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showImport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#141414] border border-white/[0.08] rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <FileText size={16} className="text-red-400" />
                </div>
                <div>
                  <div className="font-bold text-white">Importer licenciés FFLDA</div>
                  <div className="text-xs text-gray-500">Format CSV point-virgule</div>
                </div>
              </div>
              <button onClick={() => { setShowImport(false); setCsvText(''); }} className="btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-gray-500">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>Les données sont mises à jour si le licencié existe déjà (via le numéro de licence). Les informations sensibles sont ignorées.</span>
              </div>
              <textarea
                className="input h-48 resize-none font-mono text-xs leading-relaxed"
                placeholder={`"Style";"Catégorie d'âge";"Statut";"N° Licence";"Nom";"Prénom"…`}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <button className="btn-secondary" onClick={() => { setShowImport(false); setCsvText(''); }}>Annuler</button>
                <button
                  className="btn-primary"
                  onClick={() => importMutation.mutate(csvText)}
                  disabled={!csvText.trim() || importMutation.isPending}
                >
                  {importMutation.isPending ? 'Import…' : <><Upload size={14} /> Importer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
