import React from "react";

interface CreateInvoiceButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const CreateInvoiceButton: React.FC<CreateInvoiceButtonProps> = ({ onClick, disabled }) => (
  <button
    type="button"
    className="btn btn-lg bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-xl rounded-full px-8 py-3 mt-6 transition hover:scale-105 hover:shadow-2xl focus:ring-4 focus:ring-pink-200 animate-bounce"
    onClick={onClick}
    disabled={disabled}
  >
    Créer Facture
  </button>
);

export default CreateInvoiceButton;
