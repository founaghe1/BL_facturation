import React from 'react';

interface NotificationProps {
  type?: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({ type = 'info', message, onClose }) => {
  const color = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-blue-100 border-blue-400 text-blue-700';

  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-60 w-full max-w-xl px-4`}>
      <div className={`border ${color} px-4 py-3 rounded-lg shadow-lg flex items-start gap-3`} role="alert" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
        <div className="flex-1">
          <p className="font-semibold">{type === 'success' ? 'Succès' : type === 'error' ? 'Erreur' : 'Info'}</p>
          <p className="text-sm mt-1">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-800">✕</button>
      </div>
    </div>
  );
}

export default Notification;
