import React, { useState } from 'react';
import Toast from './Toast.jsx';

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = new Date().getTime();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          show={true}
          onClose={() => removeToast(toast.id)}
          type={toast.type} // Pass the type to the Toast component
        />
      ))}
    </div>
  );
};

export default ToastContainer;