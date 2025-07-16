using Application.DTOs;
using Application.Interfaces.Content;
using Domain.Entities;
using Infrastructure.Content.Data;
using Microsoft.EntityFrameworkCore;
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
           // var earnings = await _dbContext.Earnings.Find(e => e.Id == ObjectId.Parse(id)).FirstOrDefaultAsync();
           // var filter = Builders<Earnings>.Filter.Eq(e => e.Id, ObjectId.Parse(id));
           // var earnings = await _dbContext.Earnings.Find(filter).FirstOrDefaultAsync();
            var earnings = await _dbContext.Earnings.FirstOrDefaultAsync(e => e.Id == ObjectId.Parse(id));


            if (earnings == null)
                return null;

            var caregiver = await _careGiverService.GetCaregiverUserAsync(earnings.CaregiverId);
            
            return new EarningsResponse
            {
                Id = earnings.Id.ToString(),
                CaregiverId = earnings.CaregiverId,
                CaregiverName = $"{caregiver.FirstName} {caregiver.LastName}",
               // TotalEarned = earnings.TotalEarned,
                //WithdrawableAmount = earnings.WithdrawableAmount,
                //WithdrawnAmount = earnings.WithdrawnAmount,
                //LastUpdated = earnings.UpdatedAt
            };
        }

        public async Task<EarningsResponse> GetEarningsByCaregiverIdAsync(string caregiverId)
        {
            //var earnings = await _dbContext.Earnings.Find(e => e.CaregiverId == caregiverId).FirstOrDefaultAsync();
            var earnings = await _dbContext.Earnings.FirstOrDefaultAsync (e => e.CaregiverId == caregiverId);
            if (earnings == null)
                return null;

            var caregiver = await _careGiverService.GetCaregiverUserAsync(caregiverId);

            return new EarningsResponse
            {
                Id = earnings.Id.ToString(),
                CaregiverId = earnings.CaregiverId,
                CaregiverName = $"{caregiver.FirstName} {caregiver.LastName}",
                //TotalEarned = earnings.TotalEarned,
                //WithdrawableAmount = earnings.WithdrawableAmount,
                //WithdrawnAmount = earnings.WithdrawnAmount,
                //LastUpdated = earnings.UpdatedAt
            };
        }


        public async Task<CaregiverEarningSummaryResponse> GetEarningByCaregiverIdAsync(string caregiverId)
        {
            var earnings = await _dbContext.Earnings
                    .Where(e => e.CaregiverId == caregiverId)
                    .OrderByDescending(n => n.CreatedAt)                    
                    .ToListAsync();

          //  var earningsDTO = new List<EarningsResponse>();
            decimal WithdrawableAmount = 0;
            decimal totalEarnings = 0;

            foreach (var earning in earnings)
            {
                WithdrawableAmount += earning.Amount;
                totalEarnings += earning.Amount;
                                
            }

           // return earningsDTO;
            return new CaregiverEarningSummaryResponse
            {
               // Earnings = earningsDTO,
                WithdrawableAmount = WithdrawableAmount,
                TotalEarning = totalEarnings
            };

            ////var earnings = await _dbContext.Earnings.Find(e => e.CaregiverId == caregiverId).FirstOrDefaultAsync();
            ////var earnings = await _dbContext.Earnings.FirstOrDefaultAsync(e => e.CaregiverId == caregiverId);
            //if (earnings == null)
            //    return null;

            //var caregiver = await _careGiverService.GetCaregiverUserAsync(caregiverId);

            //return new EarningsResponse
            //{
            //    Id = earnings.Id.ToString(),
            //    CaregiverId = earnings.CaregiverId,
            //    CaregiverName = $"{caregiver.FirstName} {caregiver.LastName}",
            //    //TotalEarned = earnings.TotalEarned,
            //    //WithdrawableAmount = earnings.WithdrawableAmount,
            //    //WithdrawnAmount = earnings.WithdrawnAmount,
            //    //LastUpdated = earnings.UpdatedAt
            //};
        }




        public async Task<EarningsDTO> CreateEarningsAsync(CreateEarningsRequest request)
        {
            var earnings = new Earnings
            {
                CaregiverId = request.CaregiverId,
                //TotalEarned = request.TotalEarned,
                //WithdrawableAmount = request.WithdrawableAmount,
                //WithdrawnAmount = request.WithdrawnAmount,
                //CreatedAt = DateTime.UtcNow,
                //UpdatedAt = DateTime.UtcNow
            };

            //await _dbContext.Earnings.InsertOneAsync(earnings);

            _dbContext.Earnings.Add(earnings); 
            await _dbContext.SaveChangesAsync(); 

            return new EarningsDTO
            {
                Id = earnings.Id.ToString(),
                CaregiverId = earnings.CaregiverId,
                //TotalEarned = earnings.TotalEarned,
                //WithdrawableAmount = earnings.WithdrawableAmount,
                //WithdrawnAmount = earnings.WithdrawnAmount,
                //CreatedAt = earnings.CreatedAt,
                //UpdatedAt = earnings.UpdatedAt
            };
        }

        public async Task<string> CreateEarningsAsync(AddEarningsRequest addEarningsRequest)
        {
            var earnings = new Earnings
            {
                ClientOrderId = addEarningsRequest.ClientOrderId,
                
                Id = ObjectId.GenerateNewId(),
                CreatedAt = DateTime.UtcNow,
            };

            //await _dbContext.Earnings.InsertOneAsync(earnings);

            _dbContext.Earnings.Add(earnings);
            await _dbContext.SaveChangesAsync();

            return earnings.Id.ToString();
        }

        public async Task<EarningsDTO> UpdateEarningsAsync(string id, UpdateEarningsRequest request)
        {
            var earnings = await _dbContext.Earnings.FirstOrDefaultAsync(e => e.Id == ObjectId.Parse(id));

            if (earnings == null)
                return null;

            //if (request.TotalEarned.HasValue)
            //    earnings.TotalEarned = request.TotalEarned.Value;

            //if (request.WithdrawableAmount.HasValue)
            //    earnings.WithdrawableAmount = request.WithdrawableAmount.Value;

            //if (request.WithdrawnAmount.HasValue)
            //    earnings.WithdrawnAmount = request.WithdrawnAmount.Value;

            //earnings.UpdatedAt = DateTime.UtcNow;

            _dbContext.Earnings.Update(earnings);
            await _dbContext.SaveChangesAsync();

            return new EarningsDTO
            {
                Id = earnings.Id.ToString(),
                CaregiverId = earnings.CaregiverId,
                //TotalEarned = earnings.TotalEarned,
                //WithdrawableAmount = earnings.WithdrawableAmount,
                //WithdrawnAmount = earnings.WithdrawnAmount,
                //CreatedAt = earnings.CreatedAt,
                //UpdatedAt = earnings.UpdatedAt
            };
        }



        //public async Task<bool> UpdateWithdrawalAmountsAsync(string caregiverId, decimal withdrawalAmount)
        //{
        //  //  var earnings = await _dbContext.Earnings.Find(e => e.CaregiverId == caregiverId).FirstOrDefaultAsync();
        //    var earnings = await _dbContext.Earnings.FirstOrDefaultAsync(e => e.Id == ObjectId.Parse(caregiverId));
        //    if (earnings == null || earnings.WithdrawableAmount < withdrawalAmount)
        //        return false;

        //    var update = Builders<Earnings>.Update
        //        .Inc(e => e.WithdrawableAmount, -withdrawalAmount)
        //        .Inc(e => e.WithdrawnAmount, withdrawalAmount)
        //        .Set(e => e.UpdatedAt, DateTime.UtcNow);

        //    var result = await _dbContext.Earnings.UpdateOneAsync(
        //        e => e.CaregiverId == caregiverId,
        //        update
        //    );

        //    return result.ModifiedCount > 0;
        //}


        public async Task<bool> UpdateWithdrawalAmountsAsync(string caregiverId, decimal withdrawalAmount)
        {
            // Find earnings by caregiver ID
            var earnings = await _dbContext.Earnings
                .FirstOrDefaultAsync(e => e.CaregiverId == caregiverId);

            //if (earnings == null || earnings.WithdrawableAmount < withdrawalAmount)
            //    return false;

            // Update values
            //earnings.WithdrawableAmount -= withdrawalAmount;
            //earnings.WithdrawnAmount += withdrawalAmount;
            //earnings.UpdatedAt = DateTime.UtcNow;

            // Save changes
            _dbContext.Earnings.Update(earnings);
            await _dbContext.SaveChangesAsync();

            return true;
        }



        public async Task<bool> DoesEarningsExistForCaregiverAsync(string caregiverId)
        {
            //var count = await _dbContext.Earnings.CountDocumentsAsync(e => e.CaregiverId == caregiverId);
            //return count > 0;
            return await _dbContext.Earnings
                .AnyAsync(e => e.CaregiverId == caregiverId);
        }

        
    }
}
