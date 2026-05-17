import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Upload, Search, Users, X, FileText, AlertCircle } from 'lucide-react';
import Layout, { PageHeader } from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

const weighInBadge: Record<string, { label: string; cls: string }> = {
  done:       { label: '', cls: 'badge-green'  },
  no_show:    { label: 'Absent',     cls: 'badge-yellow' },
  overweight: { label: 'Hors cat.', cls: 'badge-red'    },
  pending:    { label: 'En attente',cls: 'badge-gray'   },
};

export default function Registrations() {
  const { id } = useParams<{ id: string }>();
  const qc     = useQueryClient();
  const [search,     setSearch]     = useState('');
  const [showImport, setShowImport] = useState(false);
  const [csvText,    setCsvText]    = useState('');

  const { data: regs = [], isLoading } = useQuery({
    queryKey: ['registrations', id],
    queryFn: () => api.get(`/api/tournaments/${id}/registrations`).then(r => r.data),
  });

  const importMutation = useMutation({
    mutationFn: (csv: string) =>
      api.post(`/api/tournaments/${id}/registrations/import`, { csv_data: csv }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['registrations', id] });
      toast.success(`${r.data.registered} combattants inscrits`);
      if (r.data.errors?.length) toast.error(`${r.data.errors.length} erreur(s) ignorée(s)`);
      setShowImport(false);
      setCsvText('');
    },
    onError: () => toast.error('Erreur lors de l\'import'),
  });

  const filtered = regs.filter((r: any) =>
    !search ||
    `${r.last_name} ${r.first_name} ${r.license_number} ${r.club_name}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const byCategory = regs.reduce((acc: any, r: any) => {
    const k = r.final_age_category || 'N/A';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const done = regs.filter((r: any) => r.weigh_in_status === 'done').length;

  return (
    <Layout tournamentId={id}>
      <PageHeader
        title="Inscriptions"
        subtitle={`${regs.length} combattants · ${done} pesées validées`}
        actions={
          <button className="btn-primary" onClick={() => setShowImport(true)}>
            <Upload size={15} /> Importer CSV FFLDA
          </button>
        }
      />

      <div className="p-6 space-y-5 animate-fade-in">
        {/* Category pills */}
        {Object.keys(byCategory).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(byCategory)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([cat, count]: any) => (
                <button
                  key={cat}
                  onClick={() => setSearch(cat)}
                  className="badge-blue cursor-pointer hover:bg-blue-500/25 transition-colors"
                >
                  {cat} <span className="font-black ml-1">{count}</span>
                </button>
              ))}
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            className="input pl-10 pr-10"
            placeholder="Nom, licence, club…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden">
          <table className="table-dark w-full">
            <thead>
              <tr>
                <th>Combattant</th>
                <th>Licence</th>
                <th>Club</th>
                <th>Catégorie</th>
                <th>Style</th>
                <th>Pesée</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-600 py-12">
                    <div className="flex justify-center gap-1">
                      {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-700 animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />)}
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Users size={28} className="mx-auto text-gray-700 mb-3" />
                    <div className="text-gray-500 font-medium">
                      {search ? 'Aucun résultat' : 'Aucun combattant inscrit'}
                    </div>
                    {!search && (
                      <div className="text-gray-700 text-xs mt-1">
                        Importez un fichier CSV FFLDA pour commencer
                      </div>
                    )}
                  </td>
                </tr>
              )}
              {filtered.map((r: any) => {
                const w = weighInBadge[r.weigh_in_status] || weighInBadge.pending;
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="font-semibold text-white">{r.last_name} {r.first_name}</div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-md">
                        {r.license_number || '—'}
                      </span>
                    </td>
                    <td className="text-gray-400">{r.club_short || r.club_name || '—'}</td>
                    <td>
                      {r.final_age_category
                        ? <span className="badge-blue">{r.final_age_category}</span>
                        : <span className="text-gray-700">—</span>}
                    </td>
                    <td className="capitalize text-gray-500 text-xs">{r.final_style || '—'}</td>
                    <td>
                      {r.weigh_in_status === 'done'
                        ? <span className="badge-green">{r.weigh_in_weight_kg} kg ✓</span>
                        : <span className={w.cls}>{w.label}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#141414] border border-white/[0.08] rounded-2xl w-full max-w-2xl shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <FileText size={16} className="text-blue-400" />
                </div>
                <div>
                  <div className="font-bold text-white">Importer CSV FFLDA</div>
                  <div className="text-xs text-gray-500">Séparateur point-virgule</div>
                </div>
              </div>
              <button onClick={() => { setShowImport(false); setCsvText(''); }} className="btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-2 bg-amber-500/[0.08] border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-400">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>
                  Collez le contenu exporté depuis le site FFLDA. Le format attendu est :<br/>
                  <code className="font-mono text-amber-300/80">"Style";"Catégorie d'âge";"Statut";"N° Licence";"Nom";"Prénom"…</code>
                </span>
              </div>

              <textarea
                className="input h-48 resize-none font-mono text-xs leading-relaxed"
                placeholder={`"Lutte gréco-romaine";"U15";"Licencié";"123456";"DUPONT";"Pierre";"2009-03-15";"75";"Club de Paris";"CLB"`}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
              />

              <div className="flex gap-2 justify-end pt-1">
                <button className="btn-secondary" onClick={() => { setShowImport(false); setCsvText(''); }}>
                  Annuler
                </button>
                <button
                  className="btn-primary"
                  onClick={() => importMutation.mutate(csvText)}
                  disabled={!csvText.trim() || importMutation.isPending}
                >
                  {importMutation.isPending ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Import en cours…
                    </>
                  ) : (
                    <><Upload size={14} /> Importer</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
