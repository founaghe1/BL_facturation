import React from "react";
import PartyInfo from "./PartyInfo";

interface InvoiceHeaderProps {
  client: { name?: string; phone?: string; address?: string };
  supplier: { name?: string; phone?: string; address?: string };
  date: string;
  currency: 'EUR' | 'USD' | 'CFA' | 'GNF';
  onClientChange: (field: string, value: string) => void;
  onSupplierChange: (field: string, value: string) => void;
  onDateChange: (value: string) => void;
  onCurrencyChange: (value: 'EUR' | 'USD' | 'CFA' | 'GNF') => void;
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
  client,
  supplier,
  date,
  currency,
  onClientChange,
  onSupplierChange,
  onDateChange,
  onCurrencyChange,
}) => (
  <div className="flex flex-col md:flex-row justify-between gap-6 bg-white/80 rounded-xl shadow-lg p-6 mb-6 animate-fade-in">
    <div className="flex-1">
      <PartyInfo
        title="Client"
        name={client.name}
        phone={client.phone}
        address={client.address}
        onChange={onClientChange}
      />
    </div>
    <div className="flex-1">
      <PartyInfo
        title="Fournisseur"
        name={supplier.name}
        phone={supplier.phone}
        address={supplier.address}
        onChange={onSupplierChange}
      />
    </div>
    <div className="flex flex-col justify-end items-end">
      <label className="text-xs text-gray-500 mb-1">Date de création</label>
      <input
        type="datetime-local"
        className="input input-bordered input-sm w-44 transition focus:ring-2 focus:ring-indigo-300 mb-2"
        value={date}
        onChange={e => onDateChange(e.target.value)}
      />
      <label className="text-xs text-gray-500 mb-1">Devise</label>
      <select
        className="input input-bordered input-sm w-44"
        value={currency}
        onChange={e => onCurrencyChange(e.target.value as 'EUR' | 'USD' | 'CFA' | 'GNF')}
      >
        <option value="EUR">Euro (€)</option>
        <option value="USD">Dollar ($)</option>
        <option value="CFA">Francs CFA</option>
        <option value="GNF">Francs Guinéen</option>
      </select>
    </div>
  </div>
);

export default InvoiceHeader;
