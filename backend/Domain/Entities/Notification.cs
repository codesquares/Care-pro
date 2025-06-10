using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Notification
    {
        public ObjectId Id { get; set; }
        public string RecipientId { get; set; } // User receiving the notification
        public string SenderId { get; set; } // User who triggered the notification (optional)
        public NotificationType Type { get; set; } // Message, Payment, etc.
        public string Content { get; set; } // Notification text
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;
        public string RelatedEntityId { get; set; } // ID of message/payment/gig
    }

    public enum NotificationType
    {
        Message,
        Payment,
        SystemNotice,
        NewGig
        // Add more types as needed
    }
}
