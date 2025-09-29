import React from "react";

interface PartyInfoProps {
  title: string;
  name?: string;
  phone?: string;
  address?: string;
  onChange: (field: string, value: string) => void;
}

const PartyInfo: React.FC<PartyInfoProps> = ({ title, name, phone, address, onChange }) => (
  <div className="bg-white/60 rounded-lg shadow p-4 mb-2 animate-fade-in">
    <h3 className="font-semibold text-indigo-700 mb-2 text-sm uppercase tracking-wider">{title}</h3>
    <div className="flex flex-col gap-2">
      <input
        className="input input-bordered input-sm w-full transition focus:ring-2 focus:ring-pink-300 focus:outline-0 py-2"
        type="text"
        placeholder="Nom (optionnel)"
        value={name || ""}
        onChange={e => onChange("name", e.target.value)}
      />
      <input
        className="input input-bordered input-sm w-full transition focus:ring-2 focus:ring-pink-300 focus:outline-0 py-2"
        type="text"
        placeholder="Téléphone (optionnel)"
        value={phone || ""}
        onChange={e => onChange("phone", e.target.value)}
      />
      <input
        className="input input-bordered input-sm w-full transition focus:ring-2 focus:ring-pink-300 focus:outline-0 py-2"
        type="text"
        placeholder="Adresse (optionnel)"
        value={address || ""}
        onChange={e => onChange("address", e.target.value)}
      />
    </div>
  </div>
);

export default PartyInfo;
