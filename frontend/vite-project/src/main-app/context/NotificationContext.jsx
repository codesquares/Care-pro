// import React, { createContext, useContext, useEffect, useState } from 'react';
// import {
//   getNotifications,
//   getUnreadCount,
//   markAsRead,
//   markAllAsRead,
//   createNotification
// } from '../services/notificationService';

// const NotificationContext = createContext();

// export const useNotifications = () => useContext(NotificationContext);

// export const NotificationProvider = ({ children }) => {
//   const [id, setId] = useState("");
//   useEffect(()=>{
//       const userDetails = localStorage.getItem("userDetails");
//  const user = JSON.parse(userDetails);
//  user ? setId(user.id) : setId("");
//   },[])
  
//   const [notifications, setNotifications] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [loading, setLoading] = useState(true);

//   const fetchNotifications = async () => {
//     setLoading(true);
//     const data = await getNotifications(id, 1, 20);
//     setNotifications(data.items || []);
//     setLoading(false);
//   };

//   const fetchUnread = async (id) => {
//     const data = await getUnreadCount(id);
//     setUnreadCount(data.count || 0);
//   };

//   useEffect(() => {
//     fetchNotifications();
//     fetchUnread();
//   }, []);

//   const handleMarkAsRead = async (id) => {
//     await markAsRead(id);
//     setNotifications((prev) =>
//       prev.map((n) =>
//         n.id === id ? { ...n, isRead: true } : n
//       )
//     );
//     setUnreadCount((prev) => Math.max(prev - 1, 0));
//   };

//   const handleMarkAllAsRead = async () => {
//     await markAllAsRead();
//     setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
//     setUnreadCount(0);
//   };

//   return (
//     <NotificationContext.Provider
//       value={{
//         notifications,
//         unreadCount,
//         loading,
//         markAsRead: handleMarkAsRead,
//         markAllAsRead: handleMarkAllAsRead,
//         refreshNotifications: fetchNotifications
//       }}
//     >
//       {children}
//     </NotificationContext.Provider>
//   );
// };
