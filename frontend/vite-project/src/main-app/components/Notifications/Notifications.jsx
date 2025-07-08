// import React, { useState, useEffect } from "react";
// import { useNotifications } from "../../context/NotificationContext";
// import { formatDistanceToNow } from "date-fns";
// import "./Notifications.css";

// const Notifications = () => {
//   const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();
//   const [userName, setUserName] = useState("User");

//   useEffect(() => {
//     const user = JSON.parse(localStorage.getItem("userDetails"));
//     if (user?.firstName) {
//       setUserName(user.firstName);
//     }
//   }, []);
  
//   const getNotificationTypeIcon = (type) => {
//     switch (type) {
//       case 'Message':
//         return '💬';
//       case 'Payment':
//         return '💰';
//       case 'SystemNotice':
//         return '📢';
//       case 'NewGig':
//         return '🛠️';
//       default:
//         return '🔔';
//     }
//   };

//   return (
//     <div className="notifications-page">
//       <h1 className="header">Hi {userName}! 👋</h1>
//       <h2 className="notifications-header">
//         Notifications
//         {notifications.length > 0 && (
//           <button 
//             onClick={markAllAsRead} 
//             className="mark-all-read-btn"
//           >
//             Mark all as read
//           </button>
//         )}
//       </h2>
//       <div className="notifications-box">
//         {loading ? (
//           <div className="notification-loading">Loading notifications...</div>
//         ) : notifications.length === 0 ? (
//           <div className="no-notifications">You don't have any notifications yet.</div>
//         ) : (
//           notifications.map(notification => (
//             <div 
//               key={notification.id} 
//               className={`notification-entry ${!notification.isRead ? 'unread' : ''}`}
//               onClick={() => !notification.isRead && markAsRead(notification.id)}
//             >
//               <div className="notification-icon">
//                 {getNotificationTypeIcon(notification.type)}
//               </div>
//               <div className="notification-content">
//                 <p>{notification.content}</p>
//                 <span className="notification-time">
//                   {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
//                 </span>
//               </div>
//               {!notification.isRead && (
//                 <div className="unread-dot"></div>
//               )}
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default Notifications;
