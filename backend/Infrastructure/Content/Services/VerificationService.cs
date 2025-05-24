using Application.DTOs;
using Application.Interfaces.Content;
using Domain.Entities;
using Infrastructure.Content.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using Org.BouncyCastle.Ocsp;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Content.Services
{
    public class VerificationService : IVerificationService
    {
        private readonly CareProDbContext careProDbContext;
        private readonly ICareGiverService careGiverService;
        private readonly ILogger<VerificationService> logger;

        public VerificationService(CareProDbContext careProDbContext, ICareGiverService careGiverService, ILogger<VerificationService> logger)
        {
            this.careProDbContext = careProDbContext;
            this.careGiverService = careGiverService;
            this.logger = logger;
        }

        public async Task<string> CreateVerificationAsync(AddVerificationRequest addVerificationRequest)
        {
            var careGiver = await careGiverService.GetCaregiverUserAsync(addVerificationRequest.CaregiverId);
            if (careGiver == null)
            {
                throw new KeyNotFoundException("The CaregiverID entered is not a Valid ID");
            }

            var existingVerification = await careProDbContext.Verifications.FirstOrDefaultAsync(x => x.CaregiverId == addVerificationRequest.CaregiverId);

            if (existingVerification != null)
            {
                // Option 1: Prompt or return message to update instead
                throw new InvalidOperationException("This caregiver has already been verified. Please update the existing verification.");

                // OR Option 2: Update existing verification here instead of throwing
                // existingVerification.VerificationMode = addVerificationRequest.VerificationMode;
                // existingVerification.VerificationStatus = addVerificationRequest.VerificationStatus;
                // existingVerification.UpdatedOn = DateTime.Now;
                // await careProDbContext.SaveChangesAsync();
                // return existingVerification.VerificationId.ToString();
            }


            /// CONVERT DTO TO DOMAIN OBJECT            
            var verification = new Verification
            {
                VerificationMode = addVerificationRequest.VerificationMode,
                VerificationStatus = addVerificationRequest.VerificationStatus,
                CaregiverId = addVerificationRequest.CaregiverId,

                // Assign new ID
                VerificationId = ObjectId.GenerateNewId(),
                VerifiedOn = DateTime.Now,
            };

            await careProDbContext.Verifications.AddAsync(verification);

            await careProDbContext.SaveChangesAsync();

            return verification.VerificationId.ToString();

        }

        public async Task<VerificationResponse> GetVerificationAsync(string caregiverId)
        {
            var verification = await careProDbContext.Verifications.FirstOrDefaultAsync(x => x.CaregiverId.ToString() == caregiverId);

            if (verification == null)
            {
                throw new KeyNotFoundException($"User with ID '{caregiverId}' has not been verified.");
            }
                        

            var verificationDTO = new VerificationResponse()
            {
                VerificationId = verification.VerificationId.ToString(),
                CaregiverId = verification.CaregiverId,
                VerificationMode = verification.VerificationMode,
                VerificationStatus = verification.VerificationStatus,
                VerifiedOn = verification.VerifiedOn,
                UpdatedOn = verification.UpdatedOn,

            };

            return verificationDTO;
        }

        public async Task<string> UpdateVerificationAsync(string verificationId, UpdateVerificationRequest updateVerificationRequest)
        {
            if (!ObjectId.TryParse(verificationId, out var objectId))
            {
                throw new ArgumentException("Invalid Verification ID format.");
            }

            var existingVerification = await careProDbContext.Verifications.FindAsync(objectId);
            if (existingVerification == null)
            {
                throw new KeyNotFoundException($"Verification with ID '{verificationId}' not found.");
            }
            existingVerification.VerificationMode = updateVerificationRequest.VerificationMode;
            existingVerification.VerificationStatus = updateVerificationRequest.VerificationStatus;
            existingVerification.UpdatedOn = DateTime.Now;

            careProDbContext.Verifications.Update(existingVerification);
            await careProDbContext.SaveChangesAsync();

            return $"Verification with ID '{verificationId}' Updated successfully.";

        }
    }
}
