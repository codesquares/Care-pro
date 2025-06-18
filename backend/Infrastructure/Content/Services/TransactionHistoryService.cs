using Application.DTOs;
using Application.Interfaces.Content;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Content.Services
{
    public class TransactionHistoryService : ITransactionHistoryService
    {
        private readonly CareProDbContext _dbContext;
        private readonly IUserProfileService _userProfileService;

        public TransactionHistoryService(CareProDbContext dbContext, IUserProfileService userProfileService)
        {
            _dbContext = dbContext;
            _userProfileService = userProfileService;
        }

        public async Task<TransactionHistoryResponse> GetTransactionByIdAsync(string id)
        {
            if (!ObjectId.TryParse(id, out ObjectId objectId))
            {
                throw new ArgumentException("Invalid transaction ID format");
            }

            var transaction = await _dbContext.TransactionHistory
                .FirstOrDefaultAsync(t => t.Id == objectId);

            if (transaction == null)
            {
                return null;
            }

            return await MapToResponseAsync(transaction);
        }

        public async Task<List<TransactionHistoryResponse>> GetTransactionsByCaregiverIdAsync(string caregiverId, int page = 1, int pageSize = 10)
        {
            var transactions = await _dbContext.TransactionHistory
                .Where(t => t.CaregiverId == caregiverId)
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return await MapToResponseListAsync(transactions);
        }

        public async Task<List<TransactionHistoryResponse>> GetTransactionsByTypeAsync(string transactionType, int page = 1, int pageSize = 10)
        {
            var transactions = await _dbContext.TransactionHistory
                .Where(t => t.TransactionType == transactionType)
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return await MapToResponseListAsync(transactions);
        }

        public async Task<List<TransactionHistoryResponse>> GetTransactionsWithFiltersAsync(TransactionHistoryQueryParams queryParams)
        {
            var query = _dbContext.TransactionHistory.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(queryParams.CaregiverId))
            {
                query = query.Where(t => t.CaregiverId == queryParams.CaregiverId);
            }

            if (!string.IsNullOrEmpty(queryParams.TransactionType))
            {
                query = query.Where(t => t.TransactionType == queryParams.TransactionType);
            }

            if (queryParams.StartDate.HasValue)
            {
                query = query.Where(t => t.CreatedAt >= queryParams.StartDate.Value);
            }

            if (queryParams.EndDate.HasValue)
            {
                query = query.Where(t => t.CreatedAt <= queryParams.EndDate.Value);
            }

            // Apply pagination
            var transactions = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((queryParams.Page - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .ToListAsync();

            return await MapToResponseListAsync(transactions);
        }

        public async Task<TransactionHistoryDTO> CreateTransactionAsync(CreateTransactionRequest request)
        {
            var transaction = new TransactionHistory
            {
                CaregiverId = request.CaregiverId,
                TransactionType = request.TransactionType,
                Amount = request.Amount,
                Description = request.Description,
                ReferenceId = request.ReferenceId,
                CreatedAt = DateTime.UtcNow
            };

            await _dbContext.TransactionHistory.AddAsync(transaction);
            await _dbContext.SaveChangesAsync();

            return new TransactionHistoryDTO
            {
                Id = transaction.Id.ToString(),
                CaregiverId = transaction.CaregiverId,
                TransactionType = transaction.TransactionType,
                Amount = transaction.Amount,
                Description = transaction.Description,
                ReferenceId = transaction.ReferenceId,
                CreatedAt = transaction.CreatedAt
            };
        }

        public async Task<List<TransactionHistoryResponse>> AddEarningTransactionAsync(string caregiverId, decimal amount, string description, string referenceId)
        {
            var transaction = new TransactionHistory
            {
                CaregiverId = caregiverId,
                TransactionType = TransactionType.Earning,
                Amount = amount,
                Description = description,
                ReferenceId = referenceId,
                CreatedAt = DateTime.UtcNow
            };

            await _dbContext.TransactionHistory.AddAsync(transaction);
            await _dbContext.SaveChangesAsync();

            return await GetTransactionsByCaregiverIdAsync(caregiverId, 1, 10);
        }

        public async Task<List<TransactionHistoryResponse>> AddWithdrawalTransactionsAsync(string caregiverId, decimal amount, decimal serviceCharge, string referenceId)
        {
            // Add withdrawal transaction
            var withdrawalTransaction = new TransactionHistory
            {
                CaregiverId = caregiverId,
                TransactionType = TransactionType.Withdrawal,
                Amount = amount - serviceCharge,
                Description = $"Withdrawal to bank account",
                ReferenceId = referenceId,
                CreatedAt = DateTime.UtcNow
            };

            // Add service fee transaction
            var feeTransaction = new TransactionHistory
            {
                CaregiverId = caregiverId,
                TransactionType = TransactionType.Fee,
                Amount = serviceCharge,
                Description = $"Service fee for withdrawal ({Math.Round(serviceCharge / amount * 100, 0)}%)",
                ReferenceId = referenceId,
                CreatedAt = DateTime.UtcNow
            };

            await _dbContext.TransactionHistory.AddAsync(withdrawalTransaction);
            await _dbContext.TransactionHistory.AddAsync(feeTransaction);
            await _dbContext.SaveChangesAsync();

            return await GetTransactionsByCaregiverIdAsync(caregiverId, 1, 10);
        }

        private async Task<TransactionHistoryResponse> MapToResponseAsync(TransactionHistory transaction)
        {
            var caregiver = await _userProfileService.GetUserProfileByIdAsync(transaction.CaregiverId);
            string caregiverName = caregiver != null ? $"{caregiver.FirstName} {caregiver.LastName}" : "Unknown";

            return new TransactionHistoryResponse
            {
                Id = transaction.Id.ToString(),
                CaregiverId = transaction.CaregiverId,
                CaregiverName = caregiverName,
                TransactionType = transaction.TransactionType,
                Amount = transaction.Amount,
                Description = transaction.Description,
                ReferenceId = transaction.ReferenceId,
                CreatedAt = transaction.CreatedAt
            };
        }

        private async Task<List<TransactionHistoryResponse>> MapToResponseListAsync(List<TransactionHistory> transactions)
        {
            var responses = new List<TransactionHistoryResponse>();

            foreach (var transaction in transactions)
            {
                responses.Add(await MapToResponseAsync(transaction));
            }

            return responses;
        }
    }
}
