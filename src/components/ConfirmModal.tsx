import React from 'react';

interface ConfirmModalProps {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ title = 'Confirmer', message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-sm transition-opacity duration-150">
      <div className="bg-white/95 rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-700 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-md bg-red-400 text-white hover:bg-red-600 cursor-pointer">Annuler</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-green-600 text-white hover:brightness-90 cursor-pointer">Placer au Brouillon</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
