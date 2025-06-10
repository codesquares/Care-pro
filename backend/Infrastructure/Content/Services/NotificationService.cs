using Application.Interfaces.Content;
using Domain.Entities;
using Infrastructure.Content.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Content.Services
{
    public class NotificationService : INotificationService
    {
        private readonly CareProDbContext _dbContext;
        private readonly IHubContext<NotificationHub> _notificationHubContext;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            CareProDbContext dbContext, 
            IHubContext<NotificationHub> notificationHubContext,
            ILogger<NotificationService> logger)
        {
            _dbContext = dbContext;
            _notificationHubContext = notificationHubContext;
            _logger = logger;
        }

        public async Task<Notification> CreateNotificationAsync(string recipientId, string senderId, NotificationType type, string content, string relatedEntityId)
        {
            try
            {
                var notification = new Notification
                {
                    Id = ObjectId.GenerateNewId(),
                    RecipientId = recipientId,
                    SenderId = senderId,
                    Type = type,
                    Content = content,
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false,
                    RelatedEntityId = relatedEntityId
                };

                await _dbContext.Notifications.AddAsync(notification);
                await _dbContext.SaveChangesAsync();

                // Send real-time notification
                await SendRealTimeNotificationAsync(recipientId, notification);

                return notification;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification");
                throw;
            }
        }

        public async Task<List<Notification>> GetUserNotificationsAsync(string userId, int page = 1, int pageSize = 10)
        {
            try
            {
                return await _dbContext.Notifications
                    .Where(n => n.RecipientId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notifications for user {UserId}", userId);
                throw;
            }
        }

        public async Task<int> GetUnreadNotificationCountAsync(string userId)
        {
            try
            {
                return await _dbContext.Notifications
                    .CountAsync(n => n.RecipientId == userId && !n.IsRead);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving unread notification count for user {UserId}", userId);
                throw;
            }
        }

        public async Task MarkAsReadAsync(string notificationId)
        {
            try
            {
                var notification = await _dbContext.Notifications.FindAsync(ObjectId.Parse(notificationId));
                if (notification != null)
                {
                    notification.IsRead = true;
                    await _dbContext.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification {NotificationId} as read", notificationId);
                throw;
            }
        }

        public async Task MarkAllAsReadAsync(string userId)
        {
            try
            {
                var notifications = await _dbContext.Notifications
                    .Where(n => n.RecipientId == userId && !n.IsRead)
                    .ToListAsync();

                foreach (var notification in notifications)
                {
                    notification.IsRead = true;
                }

                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", userId);
                throw;
            }
        }

        public async Task DeleteNotificationAsync(string notificationId)
        {
            try
            {
                var notification = await _dbContext.Notifications.FindAsync(ObjectId.Parse(notificationId));
                if (notification != null)
                {
                    _dbContext.Notifications.Remove(notification);
                    await _dbContext.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification {NotificationId}", notificationId);
                throw;
            }
        }

        public async Task<bool> SendRealTimeNotificationAsync(string userId, Notification notification)
        {
            try
            {
                // Get the user's connection ID
                var user = await _dbContext.AppUsers
                    .FirstOrDefaultAsync(u => u.AppUserId.ToString() == userId && u.IsOnline == true);

                if (user != null && !string.IsNullOrEmpty(user.ConnectionId))
                {
                    // Send to the specific user's connection
                    await _notificationHubContext.Clients.Client(user.ConnectionId).SendAsync(
                        "ReceiveNotification",
                        new
                        {
                            id = notification.Id.ToString(),
                            type = notification.Type.ToString(),
                            content = notification.Content,
                            createdAt = notification.CreatedAt,
                            isRead = notification.IsRead,
                            senderId = notification.SenderId,
                            relatedEntityId = notification.RelatedEntityId
                        });
                    
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending real-time notification to user {UserId}", userId);
                return false;
            }
        }
    }
}
