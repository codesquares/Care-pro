using Application.DTOs;
using Application.Interfaces.Content;
using Domain.Entities;
using Infrastructure.Content.Data;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Authentication;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Content.Services
{
    public class EarningsService : IEarningsService
    {
        private readonly CareProDbContext _dbContext;
        private readonly ICareGiverService _careGiverService;

        public EarningsService(CareProDbContext dbContext, ICareGiverService careGiverService)
        {
            _dbContext = dbContext;
            _careGiverService = careGiverService;
        }

        public async Task<EarningsResponse> GetEarningsByIdAsync(string id)
        {
            var earnings = await _dbContext.Earnings.Find(e => e.Id == ObjectId.Parse(id)).FirstOrDefaultAsync();
            if (earnings == null)
                return null;

            var caregiver = await _careGiverService.GetCareGiverByIdAsync(earnings.CaregiverId);
            
            return new EarningsResponse
            {
                Id = earnings.Id.ToString(),
                CaregiverId = earnings.CaregiverId,
                CaregiverName = $"{caregiver.FirstName} {caregiver.LastName}",
                TotalEarned = earnings.TotalEarned,
                WithdrawableAmount = earnings.WithdrawableAmount,
                WithdrawnAmount = earnings.WithdrawnAmount,
                LastUpdated = earnings.UpdatedAt
            };
        }

        public async Task<EarningsResponse> GetEarningsByCaregiverIdAsync(string caregiverId)
        {
            var earnings = await _dbContext.Earnings.Find(e => e.CaregiverId == caregiverId).FirstOrDefaultAsync();
            if (earnings == null)
                return null;

            var caregiver = await _careGiverService.GetCareGiverByIdAsync(caregiverId);

            return new EarningsResponse
            {
                Id = earnings.Id.ToString(),
                CaregiverId = earnings.CaregiverId,
                CaregiverName = $"{caregiver.FirstName} {caregiver.LastName}",
                TotalEarned = earnings.TotalEarned,
                WithdrawableAmount = earnings.WithdrawableAmount,
                WithdrawnAmount = earnings.WithdrawnAmount,
                LastUpdated = earnings.UpdatedAt
            };
        }

        public async Task<EarningsDTO> CreateEarningsAsync(CreateEarningsRequest request)
        {
            var earnings = new Earnings
            {
                CaregiverId = request.CaregiverId,
                TotalEarned = request.TotalEarned,
                WithdrawableAmount = request.WithdrawableAmount,
                WithdrawnAmount = request.WithdrawnAmount,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _dbContext.Earnings.InsertOneAsync(earnings);

            return new EarningsDTO
            {
                Id = earnings.Id.ToString(),
                CaregiverId = earnings.CaregiverId,
                TotalEarned = earnings.TotalEarned,
                WithdrawableAmount = earnings.WithdrawableAmount,
                WithdrawnAmount = earnings.WithdrawnAmount,
                CreatedAt = earnings.CreatedAt,
                UpdatedAt = earnings.UpdatedAt
            };
        }

        public async Task<EarningsDTO> UpdateEarningsAsync(string id, UpdateEarningsRequest request)
        {
            var earnings = await _dbContext.Earnings.Find(e => e.Id == ObjectId.Parse(id)).FirstOrDefaultAsync();
            if (earnings == null)
                return null;

            var update = Builders<Earnings>.Update;
            var updates = new List<UpdateDefinition<Earnings>>();

            if (request.TotalEarned.HasValue)
                updates.Add(update.Set(e => e.TotalEarned, request.TotalEarned.Value));

            if (request.WithdrawableAmount.HasValue)
                updates.Add(update.Set(e => e.WithdrawableAmount, request.WithdrawableAmount.Value));

            if (request.WithdrawnAmount.HasValue)
                updates.Add(update.Set(e => e.WithdrawnAmount, request.WithdrawnAmount.Value));

            updates.Add(update.Set(e => e.UpdatedAt, DateTime.UtcNow));

            await _dbContext.Earnings.UpdateOneAsync(
                e => e.Id == ObjectId.Parse(id),
                update.Combine(updates)
            );

            // Get updated earnings
            earnings = await _dbContext.Earnings.Find(e => e.Id == ObjectId.Parse(id)).FirstOrDefaultAsync();

            return new EarningsDTO
            {
                Id = earnings.Id.ToString(),
                CaregiverId = earnings.CaregiverId,
                TotalEarned = earnings.TotalEarned,
                WithdrawableAmount = earnings.WithdrawableAmount,
                WithdrawnAmount = earnings.WithdrawnAmount,
                CreatedAt = earnings.CreatedAt,
                UpdatedAt = earnings.UpdatedAt
            };
        }

        public async Task<bool> UpdateWithdrawalAmountsAsync(string caregiverId, decimal withdrawalAmount)
        {
            var earnings = await _dbContext.Earnings.Find(e => e.CaregiverId == caregiverId).FirstOrDefaultAsync();
            if (earnings == null || earnings.WithdrawableAmount < withdrawalAmount)
                return false;

            var update = Builders<Earnings>.Update
                .Inc(e => e.WithdrawableAmount, -withdrawalAmount)
                .Inc(e => e.WithdrawnAmount, withdrawalAmount)
                .Set(e => e.UpdatedAt, DateTime.UtcNow);

            var result = await _dbContext.Earnings.UpdateOneAsync(
                e => e.CaregiverId == caregiverId,
                update
            );

            return result.ModifiedCount > 0;
        }

        public async Task<bool> DoesEarningsExistForCaregiverAsync(string caregiverId)
        {
            var count = await _dbContext.Earnings.CountDocumentsAsync(e => e.CaregiverId == caregiverId);
            return count > 0;
        }
    }
}
