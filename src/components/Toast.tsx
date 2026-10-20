import React, { useEffect } from 'react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="app-toast" role="status" aria-live="polite">
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontWeight: 700,
          cursor: 'pointer',
          padding: '0 4px',
          fontSize: '16px',
        }}
        aria-label="Dismiss message"
      >
        ×
      </button>
    </div>
  );
};
