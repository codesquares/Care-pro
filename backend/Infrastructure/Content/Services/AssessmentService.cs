using Application.DTOs;
using Application.Interfaces.Content;
using Domain.Entities;
using Infrastructure.Content.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Content.Services
{
    public class AssessmentService : IAssessmentService
    {
        private readonly CareProDbContext careProDbContext;
        private readonly ICareGiverService careGiverService;
        private readonly ILogger<AssessmentService> logger;

        public AssessmentService(CareProDbContext careProDbContext, ICareGiverService careGiverService, ILogger<AssessmentService> logger)
        {
            this.careProDbContext = careProDbContext;
            this.careGiverService = careGiverService;
            this.logger = logger;
        }


        public async Task<string> CreateAssessementAsync(AddAssessmentRequest addAssessmentRequest)
        {
            var careGiver = await careGiverService.GetCaregiverUserAsync(addAssessmentRequest.CaregiverId);
            if (careGiver == null)
            {
                throw new KeyNotFoundException("The CaregiverID entered is not a Valid ID");
            }

            //var existingAssessment = await careProDbContext.Assessments.FirstOrDefaultAsync(x => x.CaregiverId == addAssessmentRequest.CaregiverId);

            //if (existingAssessment != null)
            //{
            //    throw new InvalidOperationException("This caregiver has already been assessed. Please update the existing assessment.");                
            //}


            /// CONVERT DTO TO DOMAIN OBJECT            
            var assessment = new Assessment
            {
                Questions = addAssessmentRequest.Questions,
                Status = addAssessmentRequest.Status,
                Score = addAssessmentRequest.Score,
                CaregiverId = addAssessmentRequest.CaregiverId,

                // Assign new ID
                Id = ObjectId.GenerateNewId(),
                AssessedDate = DateTime.Now,
            };

            await careProDbContext.Assessments.AddAsync(assessment);

            await careProDbContext.SaveChangesAsync();

            return assessment.Id.ToString();
        }

        public async Task<AssessmentDTO> GetAssesementAsync(string caregiverId)
        {
            var assesement = await careProDbContext.Assessments.FirstOrDefaultAsync(x => x.CaregiverId.ToString() == caregiverId);

            if (assesement == null)
            {
                throw new KeyNotFoundException($"User with ID '{caregiverId}' has not been verified.");
            }


            var assessmentDTO = new AssessmentDTO()
            {
                Id = assesement.Id.ToString(),
                CaregiverId = assesement.CaregiverId,
                AssessedDate = assesement.AssessedDate,
                Questions = assesement.Questions,
                Status = assesement.Status,
                Score = assesement.Score,

            };

            return assessmentDTO;
        }


    }
}
