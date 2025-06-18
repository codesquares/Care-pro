using Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces.Content
{
    public interface ITransactionHistoryService
    {
        Task<TransactionHistoryResponse> GetTransactionByIdAsync(string id);
        Task<List<TransactionHistoryResponse>> GetTransactionsByCaregiverIdAsync(string caregiverId, int page = 1, int pageSize = 10);
        Task<List<TransactionHistoryResponse>> GetTransactionsByTypeAsync(string transactionType, int page = 1, int pageSize = 10);
        Task<List<TransactionHistoryResponse>> GetTransactionsWithFiltersAsync(TransactionHistoryQueryParams queryParams);
        Task<TransactionHistoryDTO> CreateTransactionAsync(CreateTransactionRequest request);
        Task<List<TransactionHistoryResponse>> AddEarningTransactionAsync(string caregiverId, decimal amount, string description, string referenceId);
        Task<List<TransactionHistoryResponse>> AddWithdrawalTransactionsAsync(string caregiverId, decimal amount, decimal serviceCharge, string referenceId);
    }
}
