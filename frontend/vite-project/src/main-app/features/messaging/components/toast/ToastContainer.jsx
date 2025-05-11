import React from 'react';
import { useNotificationContext } from '../../context/NotificationContext';
import Toast from './Toast';
import './ToastContainer.scss';

const ToastContainer = () => {
  const { notifications, removeNotification } = useNotificationContext();
  
  return (
    <div className="toast-container">
      {notifications.map(notification => (
        <Toast
          key={notification.id}
          id={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          duration={notification.duration || 5000}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
