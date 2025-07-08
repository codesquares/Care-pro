using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class TransactionHistory
    {
        public ObjectId Id { get; set; }
        public string CaregiverId { get; set; }
        public string TransactionType { get; set; } // Earning, Withdrawal, Fee
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public string ReferenceId { get; set; } // Order ID or Withdrawal Request ID
        public DateTime CreatedAt { get; set; }
    }

    // Constants for transaction types
    public static class TransactionType
    {
        public const string Earning = "Earning";
        public const string Withdrawal = "Withdrawal";
        public const string Fee = "Fee";
    }
}
