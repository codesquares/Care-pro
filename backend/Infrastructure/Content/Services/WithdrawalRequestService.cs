using Application.DTOs;
using Application.Interfaces.Content;
using Domain.Entities;
using Infrastructure.Content.Data;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Content.Services
{
    public class WithdrawalRequestService : IWithdrawalRequestService
    {
        private readonly CareProDbContext _dbContext;
        private readonly IEarningsService _earningsService;
        private readonly ICareGiverService _careGiverService;
        private readonly INotificationService _notificationService;
        private readonly ITransactionHistoryService _transactionHistoryService;

        public WithdrawalRequestService(
            CareProDbContext dbContext, 
            IEarningsService earningsService, 
            ICareGiverService careGiverService,
            INotificationService notificationService,
            ITransactionHistoryService transactionHistoryService)
        {
            _dbContext = dbContext;
            _earningsService = earningsService;
            _careGiverService = careGiverService;
            _notificationService = notificationService;
            _transactionHistoryService = transactionHistoryService;
        }

        public async Task<WithdrawalRequestResponse> GetWithdrawalRequestByIdAsync(string id)
        {
            var withdrawal = await _dbContext.WithdrawalRequests.Find(w => w.Id == ObjectId.Parse(id)).FirstOrDefaultAsync();
            if (withdrawal == null)
                return null;

            return await MapWithdrawalToResponseAsync(withdrawal);
        }

        public async Task<WithdrawalRequestResponse> GetWithdrawalRequestByTokenAsync(string token)
        {
            var withdrawal = await _dbContext.WithdrawalRequests.Find(w => w.Token == token).FirstOrDefaultAsync();
            if (withdrawal == null)
                return null;

            return await MapWithdrawalToResponseAsync(withdrawal);
        }

        public async Task<List<WithdrawalRequestResponse>> GetAllWithdrawalRequestsAsync()
        {
            var withdrawals = await _dbContext.WithdrawalRequests.Find(_ => true).ToListAsync();
            var responses = new List<WithdrawalRequestResponse>();

            foreach (var withdrawal in withdrawals)
            {
                responses.Add(await MapWithdrawalToResponseAsync(withdrawal));
            }

            return responses;
        }

        public async Task<List<WithdrawalRequestResponse>> GetWithdrawalRequestsByCaregiverIdAsync(string caregiverId)
        {
            var withdrawals = await _dbContext.WithdrawalRequests.Find(w => w.CaregiverId == caregiverId).ToListAsync();
            var responses = new List<WithdrawalRequestResponse>();

            foreach (var withdrawal in withdrawals)
            {
                responses.Add(await MapWithdrawalToResponseAsync(withdrawal));
            }

            return responses;
        }

        public async Task<List<WithdrawalRequestResponse>> GetWithdrawalRequestsByStatusAsync(string status)
        {
            var withdrawals = await _dbContext.WithdrawalRequests.Find(w => w.Status == status).ToListAsync();
            var responses = new List<WithdrawalRequestResponse>();

            foreach (var withdrawal in withdrawals)
            {
                responses.Add(await MapWithdrawalToResponseAsync(withdrawal));
            }

            return responses;
        }

        public async Task<WithdrawalRequestResponse> CreateWithdrawalRequestAsync(CreateWithdrawalRequestRequest request)
        {
            // Check if there's already a pending withdrawal for this caregiver
            bool hasPending = await HasPendingRequest(request.CaregiverId);
            if (hasPending)
                throw new InvalidOperationException("A pending withdrawal request already exists for this caregiver");

            // Verify the caregiver has enough withdrawable funds
            var earnings = await _earningsService.GetEarningsByCaregiverIdAsync(request.CaregiverId);
            if (earnings == null || earnings.WithdrawableAmount < request.AmountRequested)
                throw new InvalidOperationException("Insufficient withdrawable funds");

            // Calculate service charge and final amount
            decimal serviceCharge = Math.Round(request.AmountRequested * 0.10m, 2);
            decimal finalAmount = request.AmountRequested - serviceCharge;

            // Generate a unique token
            string token = GenerateUniqueToken();

            // Check if token already exists (unlikely but possible)
            while (await TokenExists(token))
            {
                token = GenerateUniqueToken();
            }

            var withdrawal = new WithdrawalRequest
            {
                CaregiverId = request.CaregiverId,
                AmountRequested = request.AmountRequested,
                ServiceCharge = serviceCharge,
                FinalAmount = finalAmount,
                Token = token,
                Status = WithdrawalStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                AccountNumber = request.AccountNumber,
                BankName = request.BankName,
                AccountName = request.AccountName
            };

            await _dbContext.WithdrawalRequests.InsertOneAsync(withdrawal);

            // Notify all admin users about the new withdrawal request
            await NotifyAdminsAboutWithdrawalRequest(withdrawal);

            return await MapWithdrawalToResponseAsync(withdrawal);
        }

        public async Task<WithdrawalRequestResponse> VerifyWithdrawalRequestAsync(AdminWithdrawalVerificationRequest request)
        {
            var withdrawal = await _dbContext.WithdrawalRequests.Find(w => w.Token == request.Token).FirstOrDefaultAsync();
            if (withdrawal == null)
                throw new InvalidOperationException("Withdrawal request not found");

            if (withdrawal.Status != WithdrawalStatus.Pending)
                throw new InvalidOperationException("Withdrawal request is not in pending state");

            var update = Builders<WithdrawalRequest>.Update
                .Set(w => w.Status, WithdrawalStatus.Verified)
                .Set(w => w.VerifiedAt, DateTime.UtcNow)
                .Set(w => w.AdminId, request.AdminId)
                .Set(w => w.AdminNotes, request.AdminNotes);

            await _dbContext.WithdrawalRequests.UpdateOneAsync(w => w.Id == withdrawal.Id, update);

            // Get updated withdrawal
            withdrawal = await _dbContext.WithdrawalRequests.Find(w => w.Id == withdrawal.Id).FirstOrDefaultAsync();

            // Notify caregiver that their withdrawal has been verified
            await NotifyCaregiverAboutWithdrawalStatusChange(withdrawal, "Withdrawal Request Verified", 
                $"Your withdrawal request for {withdrawal.AmountRequested:C} has been verified by admin. Final amount after service charge: {withdrawal.FinalAmount:C}");

            return await MapWithdrawalToResponseAsync(withdrawal);
        }

        public async Task<WithdrawalRequestResponse> CompleteWithdrawalRequestAsync(string token, string adminId)
        {
            var withdrawal = await _dbContext.WithdrawalRequests.Find(w => w.Token == token).FirstOrDefaultAsync();
            if (withdrawal == null)
                throw new InvalidOperationException("Withdrawal request not found");

            if (withdrawal.Status != WithdrawalStatus.Verified)
                throw new InvalidOperationException("Withdrawal request must be verified before completion");

            var update = Builders<WithdrawalRequest>.Update
                .Set(w => w.Status, WithdrawalStatus.Completed)
                .Set(w => w.CompletedAt, DateTime.UtcNow)
                .Set(w => w.AdminId, adminId);

            await _dbContext.WithdrawalRequests.UpdateOneAsync(w => w.Id == withdrawal.Id, update);

            // Update earnings to reflect the withdrawal
            bool updated = await _earningsService.UpdateWithdrawalAmountsAsync(withdrawal.CaregiverId, withdrawal.AmountRequested);
            if (!updated)
                throw new InvalidOperationException("Failed to update caregiver earnings");

            // Get updated withdrawal
            withdrawal = await _dbContext.WithdrawalRequests.Find(w => w.Id == withdrawal.Id).FirstOrDefaultAsync();

            // Create transaction history records for withdrawal and service fee
            await _transactionHistoryService.AddWithdrawalTransactionsAsync(
                withdrawal.CaregiverId,
                withdrawal.AmountRequested,
                withdrawal.ServiceCharge,
                withdrawal.Id.ToString()
            );

            // Notify caregiver that their withdrawal has been completed
            await NotifyCaregiverAboutWithdrawalStatusChange(withdrawal, "Withdrawal Completed", 
                $"Your withdrawal of {withdrawal.FinalAmount:C} has been completed successfully.");

            return await MapWithdrawalToResponseAsync(withdrawal);
        }

        public async Task<WithdrawalRequestResponse> RejectWithdrawalRequestAsync(AdminWithdrawalVerificationRequest request)
        {
            var withdrawal = await _dbContext.WithdrawalRequests.Find(w => w.Token == request.Token).FirstOrDefaultAsync();
            if (withdrawal == null)
                throw new InvalidOperationException("Withdrawal request not found");

            if (withdrawal.Status != WithdrawalStatus.Pending && withdrawal.Status != WithdrawalStatus.Verified)
                throw new InvalidOperationException("Withdrawal request cannot be rejected in current state");

            var update = Builders<WithdrawalRequest>.Update
                .Set(w => w.Status, WithdrawalStatus.Rejected)
                .Set(w => w.AdminId, request.AdminId)
                .Set(w => w.AdminNotes, request.AdminNotes);

            await _dbContext.WithdrawalRequests.UpdateOneAsync(w => w.Id == withdrawal.Id, update);

            // Get updated withdrawal
            withdrawal = await _dbContext.WithdrawalRequests.Find(w => w.Id == withdrawal.Id).FirstOrDefaultAsync();

            // Notify caregiver that their withdrawal has been rejected
            await NotifyCaregiverAboutWithdrawalStatusChange(withdrawal, "Withdrawal Request Rejected", 
                $"Your withdrawal request for {withdrawal.AmountRequested:C} has been rejected. Reason: {request.AdminNotes}");

            return await MapWithdrawalToResponseAsync(withdrawal);
        }

        public async Task<bool> TokenExists(string token)
        {
            var count = await _dbContext.WithdrawalRequests.CountDocumentsAsync(w => w.Token == token);
            return count > 0;
        }

        public async Task<bool> HasPendingRequest(string caregiverId)
        {
            var count = await _dbContext.WithdrawalRequests.CountDocumentsAsync(
                w => w.CaregiverId == caregiverId && w.Status == WithdrawalStatus.Pending);
            return count > 0;
        }

        private string GenerateUniqueToken()
        {
            // Generate a random 8-character alphanumeric token
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            var token = new string(Enumerable.Repeat(chars, 8)
                .Select(s => s[random.Next(s.Length)]).ToArray());
            
            return token;
        }

        private async Task<WithdrawalRequestResponse> MapWithdrawalToResponseAsync(WithdrawalRequest withdrawal)
        {
            var caregiver = await _careGiverService.GetCareGiverByIdAsync(withdrawal.CaregiverId);
            string caregiverName = caregiver != null ? $"{caregiver.FirstName} {caregiver.LastName}" : "Unknown";

            string adminName = "Not assigned";
            if (!string.IsNullOrEmpty(withdrawal.AdminId))
            {
                // You may need to implement a method to get admin information
                // For now, we'll use a placeholder
                adminName = "Admin"; // Replace with actual admin name retrieval logic
            }

            return new WithdrawalRequestResponse
            {
                Id = withdrawal.Id.ToString(),
                CaregiverId = withdrawal.CaregiverId,
                CaregiverName = caregiverName,
                AmountRequested = withdrawal.AmountRequested,
                ServiceCharge = withdrawal.ServiceCharge,
                FinalAmount = withdrawal.FinalAmount,
                Token = withdrawal.Token,
                Status = withdrawal.Status,
                CreatedAt = withdrawal.CreatedAt,
                VerifiedAt = withdrawal.VerifiedAt,
                CompletedAt = withdrawal.CompletedAt,
                AdminNotes = withdrawal.AdminNotes,
                AdminId = withdrawal.AdminId,
                AdminName = adminName,
                AccountNumber = withdrawal.AccountNumber,
                BankName = withdrawal.BankName,
                AccountName = withdrawal.AccountName
            };
        }

        private async Task NotifyAdminsAboutWithdrawalRequest(WithdrawalRequest withdrawal)
        {
            // In a real-world scenario, we'd query for all admin users and notify them
            // For now, we'll create a notification for a generic admin role
            
            var caregiver = await _careGiverService.GetCareGiverByIdAsync(withdrawal.CaregiverId);
            string caregiverName = caregiver != null ? $"{caregiver.FirstName} {caregiver.LastName}" : "Unknown";

            var notification = new Notification
            {
                RecipientId = "admin", // This should be replaced with actual admin IDs in production
                SenderId = withdrawal.CaregiverId,
                Type = NotificationType.WithdrawalRequest,
                Title = "New Withdrawal Request",
                Content = $"Caregiver {caregiverName} has requested a withdrawal of {withdrawal.AmountRequested:C}. " +
                          $"Service charge: {withdrawal.ServiceCharge:C}. Final amount: {withdrawal.FinalAmount:C}. " +
                          $"Verification token: {withdrawal.Token}",
                CreatedAt = DateTime.UtcNow,
                IsRead = false,
                RelatedEntityId = withdrawal.Id.ToString()
            };

            await _dbContext.Notifications.InsertOneAsync(notification);
        }

        private async Task NotifyCaregiverAboutWithdrawalStatusChange(WithdrawalRequest withdrawal, string title, string message)
        {
            var notification = new Notification
            {
                RecipientId = withdrawal.CaregiverId,
                SenderId = withdrawal.AdminId ?? "system",
                Type = NotificationType.WithdrawalRequest,
                Title = title,
                Content = message,
                CreatedAt = DateTime.UtcNow,
                IsRead = false,
                RelatedEntityId = withdrawal.Id.ToString()
            };

            await _dbContext.Notifications.InsertOneAsync(notification);
        }
    }
}
