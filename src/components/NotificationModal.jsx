import { useEffect } from 'react';
import './NotificationModal.css';

const NotificationModal = ({ message, type = 'success', isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className={`notification-modal ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="notification-content">
          <h3>{type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Información'}</h3>
          <p>{message}</p>
        </div>
        <button className="notification-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default NotificationModal;

