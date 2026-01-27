import api from './api';

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
    case 'VerificationUpdate':
      return `Identity Verification Update`;
    case 'NewGig':
      return `🛠️ New gig created by you`;
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
    case 'VerificationUpdate':
      return `Your identity verification status has been updated.`;
    case 'NewGig':
      return `You have successfully posted a new gig.`;
    default:
      return `You have a new notification from user ${senderId}.`;
  }
};

export const getNotifications = async (id, page = 1, pageSize = 10) => {
  try {
    const response = await api.get(`/Notifications?userId=${id}&page=${page}&pageSize=${pageSize}`);

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
    const res = await api.get(`/Notifications/unread/count?userId=${id}`);

    if (typeof res.data === 'number') return { count: res.data };
    return { count: res.data?.count || 0 };
  } catch (err) {
    console.error("Unread count error:", err);
    return { count: 0 };
  }
};

export const markAsRead = async (id) => {
  try {
    return await api.put(`/Notifications/${id}/read`, null);
  } catch (err) {
    console.error("Mark as read error:", err);
    throw err;
  }
};

export const markAllAsRead = async () => {
  try {
    // Get user ID from localStorage
    const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
    const userId = userDetails.id;
    
    if (!userId) {
      throw new Error("User ID not found in localStorage");
    }
    
    return await api.put(`/Notifications/read-all?userId=${userId}`, null);
  } catch (err) {
    console.error("Mark all as read error:", err);
    throw err;
  }
};

export const deleteNotification = async (id) => {
  try {
    return await api.delete(`/Notifications/${id}`);
  } catch (err) {
    console.error("Delete notification error:", err);
    throw err;
  }
};

export const createNotification = async ({
  recipientId,
  senderId,
  type,
  relatedEntityId,
  title,
  content,
  metadata
}) => {
  try {
    // Validate required fields
    if (!recipientId || !senderId || !type) {
      throw new Error('Missing required fields: recipientId, senderId, and type are required');
    }
    
    const notificationPayload = {
      recipientId,
      senderId,
      type,
      // Use custom title/content if provided, otherwise generate them
      title: title || generateTitle(type, senderId),
      content: content || generateContent(type, senderId)
    };
    
    // Only add relatedEntityId if it's provided and valid
    if (relatedEntityId) {
      notificationPayload.relatedEntityId = relatedEntityId;
    }

    // Add metadata if provided (for additional context)
    if (metadata && typeof metadata === 'object') {
      notificationPayload.metadata = metadata;
    }

    console.log('Creating notification with payload:', notificationPayload);

    const response = await api.post(`/Notifications`, notificationPayload);

    return response.data;
  } catch (error) {
    console.error("Create notification error:", error);
    
    // Log more details about the error
    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
      console.error("Error response headers:", error.response.headers);
    }
    
    throw error;
  }
};
