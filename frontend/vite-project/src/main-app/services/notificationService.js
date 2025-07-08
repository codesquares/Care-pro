import axios from 'axios';

const API_URL = 'https://carepro-api20241118153443.azurewebsites.net';

/**
 * Creates a notification.
 *
 * @param {Object} params
 * @param {string} params.recipientId - ID of the user receiving the notification
 * @param {string} params.senderId - ID of the user triggering the notification
 * @param {string} params.type - Type of the notification e.g., 'NewMessage', 'Payment', 'Signup'
 * @param {string} [params.relatedEntityId] - Optional entity this notification is related to
 * @returns {Promise<Object>} - API response or error object
 */
// 🔧 Utility to auto-generate title
const generateTitle = (type, senderId) => {
  switch (type) {
    case 'NewMessage':
      return `New message from user ${senderId}`;
    case 'Payment':
      return `Payment received from user ${senderId}`;
    case 'Signup':
      return `New signup: user ${senderId}`;
    case 'SystemNotice':
      return `System notice`;
    case 'NewGig':
      return `New gig created by user ${senderId}`;
    default:
      return `New notification`;
  }
};

// 🔧 Utility to auto-generate content
const generateContent = (type, senderId) => {
  switch (type) {
    case 'NewMessage':
      return `User ${senderId} sent you a message.`;
    case 'Payment':
      return `User ${senderId} has made a payment.`;
    case 'Signup':
      return `User ${senderId} just signed up.`;
    case 'SystemNotice':
      return `There is a new system update.`;
    case 'NewGig':
      return `User ${senderId} posted a new gig.`;
    default:
      return `You have a new notification from user ${senderId}.`;
  }
};
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
});

export const getNotifications = async (id, page = 1, pageSize = 10) => {
  try {
    const response = await axios.get(`${API_URL}/api/Notifications?userId=${id}&page=${page}&pageSize=${pageSize}`, {
      headers: authHeaders()
    });

    const data = response.data;

    if (Array.isArray(data)) {
      return {
        items: data,
        totalCount: data.length,
        currentPage: page,
        pageSize
      };
    }

    return {
      items: data.items || [],
      totalCount: data.totalCount || 0,
      currentPage: data.currentPage || page,
      pageSize: data.pageSize || pageSize
    };
  } catch (err) {
    console.error("API error:", err);
    return { items: [], totalCount: 0, currentPage: page, pageSize };
  }
};

export const getUnreadCount = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/api/Notifications/unread/count?userId=${id}`, {
      headers: authHeaders()
    });

    if (typeof res.data === 'number') return { count: res.data };
    return { count: res.data?.count || 0 };
  } catch (err) {
    console.error("Unread count error:", err);
    return { count: 0 };
  }
};

export const markAsRead = async (id) => {
  try {
    return await axios.put(`${API_URL}/api/Notifications/${id}/read`, null, {
      headers: authHeaders()
    });
  } catch (err) {
    console.error("Mark as read error:", err);
    throw err;
  }
};

export const markAllAsRead = async () => {
  try {
    return await axios.put(`${API_URL}/api/Notifications/read-all`, null, {
      headers: authHeaders()
    });
  } catch (err) {
    console.error("Mark all as read error:", err);
    throw err;
  }
};

export const deleteNotification = async (id) => {
  try {
    return await axios.delete(`${API_URL}/api/Notifications/${id}`, {
      headers: authHeaders()
    });
  } catch (err) {
    console.error("Delete notification error:", err);
    throw err;
  }
};

export const createNotification = async ({
  recipientId,
  senderId,
  type,
  relatedEntityId 
}) => {
  try {
    const notificationPayload = {
      recipientId,
      senderId,
      type,
      title: generateTitle(type, senderId),
      content: generateContent(type, senderId),
      relatedEntityId
    };

    const response = await axios.post(`${API_URL}/api/Notifications`, notificationPayload, {
      headers: authHeaders()
    });

    return response.data;
  } catch (error) {
    console.error("Create notification error:", error);
    throw error;
  }
};
