import React, { useEffect, useState } from "react";
import { fetchInvoices, deleteInvoice } from "../utils/invoices";
import { TrashIcon } from "@heroicons/react/24/outline";

interface InvoiceListProps {
  onSelectInvoice?: (invoice: any) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ onSelectInvoice }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    setLoading(true);
    const { data } = await fetchInvoices();
    setInvoices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleDelete = async (id: number) => {
    await deleteInvoice(id);
    loadInvoices();
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-2">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700">Liste des factures</h2>
      {loading ? (
        <div>Chargement...</div>
      ) : invoices.length === 0 ? (
        <div>Aucune facture trouvée.</div>
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
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b hover:bg-indigo-50 cursor-pointer" onClick={() => onSelectInvoice && onSelectInvoice(inv)}>
                <td className="align-middle text-center">{new Date(inv.date).toLocaleString()}</td>
                <td>{inv.client_name}</td>
                <td className="text-center">{inv.total}</td>
                <td className="text-center bg-fuchsia-200">
                  <button onClick={e => { e.stopPropagation(); handleDelete(inv.id); }} title="Supprimer" className="text-red-500 hover:text-red-700">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InvoiceList;
