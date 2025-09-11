using Application.Interfaces.Content;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CarePro_Api.Controllers.Content
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(
            INotificationService notificationService,
            ILogger<NotificationsController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        // GET: api/Notifications
        [HttpGet]
        public async Task<IActionResult> GetUserNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Added explicit null check as in the other controller
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User not authenticated properly.");
                }

                var notifications = await _notificationService.GetUserNotificationsAsync(userId, page, pageSize);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notifications");
                return StatusCode(500, new { message = "Failed to retrieve notifications", error = ex.Message });
            }
        }

        // GET: api/Notifications/unread/count
        [HttpGet("unread/count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Added explicit null check as in the other controller
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User not authenticated properly.");
                }

                var count = await _notificationService.GetUnreadNotificationCountAsync(userId);
                return Ok(new { count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving unread notification count");
                return StatusCode(500, new { message = "Failed to retrieve unread notification count", error = ex.Message });
            }
        }

        // PUT: api/Notifications/{id}/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Added explicit null check as in the other controller
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User not authenticated properly.");
                }

                // Validate notification belongs to the user (optional but recommended)
                // This check should be added in a production application

                await _notificationService.MarkAsReadAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification as read");
                return StatusCode(500, new { message = "Failed to mark notification as read", error = ex.Message });
            }
        }

        // PUT: api/Notifications/read-all
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Added explicit null check as in the other controller
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User not authenticated properly.");
                }

                await _notificationService.MarkAllAsReadAsync(userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read");
                return StatusCode(500, new { message = "Failed to mark all notifications as read", error = ex.Message });
            }
        }

        // DELETE: api/Notifications/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(string id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Added explicit null check as in the other controller
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User not authenticated properly.");
                }

                // Validate notification belongs to the user (optional but recommended)
                // This check should be added in a production application

                await _notificationService.DeleteNotificationAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification");
                return StatusCode(500, new { message = "Failed to delete notification", error = ex.Message });
            }
        }

        // POST: api/Notifications/test (for testing purposes)
        [HttpPost("test")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> TestNotification([FromBody] TestNotificationRequest request)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Added explicit null check as in the other controller
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User not authenticated properly.");
                }

                var notification = await _notificationService.CreateNotificationAsync(
                    request.RecipientId,
                    userId,
                    NotificationType.SystemNotice,
                    request.Message,
                    "test_notification");

                return Ok(new { message = "Notification sent", notification });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending test notification");
                return StatusCode(500, new { message = "Failed to send test notification", error = ex.Message });
            }
        }
    }

    public class TestNotificationRequest
    {
        public string RecipientId { get; set; }
        public string Message { get; set; }
    }
}
