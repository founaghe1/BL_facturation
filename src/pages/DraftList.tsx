import React, { useEffect, useState } from "react";
import { fetchDrafts, deleteDraft } from "../utils/drafts";

interface DraftListProps {
  onSelectDraft?: (draft: any) => void;
}

const DraftList: React.FC<DraftListProps> = ({ onSelectDraft }) => {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDrafts = async () => {
    setLoading(true);
    const { data } = await fetchDrafts();
    setDrafts(data || []);
    setLoading(false);
  };

  useEffect(() => { loadDrafts(); }, []);

  const handleDelete = async (id: number) => {
    await deleteDraft(id);
    loadDrafts();
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-2">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700">Brouillons</h2>
      {loading ? (
        <div>Chargement...</div>
      ) : drafts.length === 0 ? (
        <div>Aucun brouillon.</div>
      ) : (
        <table className="w-full bg-white rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-600 border-b">
              <th className="text-cyan-50">Date</th>
              <th className="text-cyan-50">Client</th>
              <th className="px-3 text-cyan-50">Montant</th>
              <th className="text-red-500 bg-fuchsia-200">Action</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map(d => (
              <tr key={d.id} className="border-b hover:bg-indigo-50 cursor-pointer" onClick={() => onSelectDraft && onSelectDraft(d)}>
                <td className="align-middle text-center">{new Date(d.date || d.created_at).toLocaleString()}</td>
                <td>{d.client_name}</td>
                <td className="text-center">{d.total}</td>
                <td className="text-center bg-fuchsia-200">
                  <button onClick={e => { e.stopPropagation(); handleDelete(d.id); }} title="Supprimer" className="text-red-500 hover:text-red-700">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DraftList;
