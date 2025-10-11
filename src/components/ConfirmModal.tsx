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
          <button onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300">Annuler</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-yellow-400 text-white hover:brightness-90">Placer au Brouillon</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
