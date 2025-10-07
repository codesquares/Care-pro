import { useEffect } from 'react';
import './toast.scss'; // Ensure you have styles for the toast

const Toast = ({ message, show, onClose, type }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose(); // Automatically close the toast after 3 seconds
      }, 3000); // Duration (3 seconds)

      return () => clearTimeout(timer); // Cleanup timer if toast is closed early
    }
  }, [show, onClose]);

  // Determine toast style based on the type
  const toastClass = `toast toast-${type}`;

  return (
    show && (
      <div className={toastClass}>
        <div className="toast-message">
          <span>{message}</span>
        </div>
        <button className="toast-close" onClick={onClose}>×</button>
      </div>
    )
  );
};

export default Toast;