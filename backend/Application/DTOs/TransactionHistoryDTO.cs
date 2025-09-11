using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class TransactionHistoryDTO
    {
        public string Id { get; set; }
        public string CaregiverId { get; set; }
        public string TransactionType { get; set; } // Earning, Withdrawal, Fee
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public string ReferenceId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class TransactionHistoryResponse
    {
        public string Id { get; set; }
        public string CaregiverId { get; set; }
        public string CaregiverName { get; set; }
        public string TransactionType { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public string ReferenceId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateTransactionRequest
    {
        public string CaregiverId { get; set; }
        public string TransactionType { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public string ReferenceId { get; set; }
    }

    public class TransactionHistoryQueryParams
    {
        public string CaregiverId { get; set; }
        public string TransactionType { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
