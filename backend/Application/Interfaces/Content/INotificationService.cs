using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces.Content
{
    public interface INotificationService
    {
        Task<Notification> CreateNotificationAsync(string recipientId, string senderId, NotificationType type, string content, string relatedEntityId);
        Task<List<Notification>> GetUserNotificationsAsync(string userId, int page = 1, int pageSize = 10);
        Task<int> GetUnreadNotificationCountAsync(string userId);
        Task MarkAsReadAsync(string notificationId);
        Task MarkAllAsReadAsync(string userId);
        Task DeleteNotificationAsync(string notificationId);
        Task<bool> SendRealTimeNotificationAsync(string userId, Notification notification);
    }
}
