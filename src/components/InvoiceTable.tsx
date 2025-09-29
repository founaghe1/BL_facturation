import React from "react";
import InvoiceLine from "./InvoiceLine";
import type { InvoiceLineData } from "./InvoiceLine";

interface InvoiceTableProps {
  lines: InvoiceLineData[];
  onLineChange: (index: number, field: keyof InvoiceLineData, value: string | number) => void;
  onAddLine: () => void;
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({ lines, onLineChange, onAddLine }) => {
  return (
    <div className="bg-white/80 rounded-xl shadow-lg p-4 animate-fade-in">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-indigo-700 border-b">
            <th className="py-2">Qté</th>
            <th>Désignation</th>
            <th>Prix Unitaire</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, idx) => (
            <InvoiceLine
              key={idx}
              line={line}
              onChange={(field, value) => onLineChange(idx, field, value)}
              index={idx}
            />
          ))}
        </tbody>
      </table>
      <div className="flex justify-end mt-2">
        <button
          type="button"
          className="btn btn-sm btn-outline btn-pink-500 transition hover:scale-105 bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md rounded-full px-4 py-1"
          onClick={onAddLine}
        >
          + Plus de ligne
        </button>
      </div>
    </div>
  );
};

export default InvoiceTable;
