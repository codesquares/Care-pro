using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class NotificationDTO
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string Type { get; set; }
        public bool IsRead { get; set; }
        public string? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateNotificationRequest
    {
        public string UserId { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string Type { get; set; }
        public string? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
    }

    public class NotificationResponse
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string Type { get; set; }
        public bool IsRead { get; set; }
        public string? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class NotificationTypes
    {
        public const string WithdrawalRequest = "WithdrawalRequest";
        public const string SystemAlert = "SystemAlert";
        public const string OrderNotification = "OrderNotification";
        public const string MessageNotification = "MessageNotification";
    }
}
