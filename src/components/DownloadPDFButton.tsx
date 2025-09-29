import React from "react";

interface DownloadPDFButtonProps {
  onClick: () => void;
  loading?: boolean;
}

const DownloadPDFButton: React.FC<DownloadPDFButtonProps> = ({ onClick, loading }) => (
  <button
    type="button"
    className="flex items-center gap-2 btn bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg rounded-full px-6 py-3 mt-4 transition hover:scale-105 hover:shadow-2xl focus:ring-4 focus:ring-pink-200 disabled:opacity-60 disabled:cursor-not-allowed"
    onClick={onClick}
    disabled={loading}
    title="Télécharger la facture en PDF"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l-6-6m6 6l6-6" />
    </svg>
    {loading ? "Génération..." : "Télécharger la facture (PDF)"}
  </button>
);

export default DownloadPDFButton;
