using Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.Content
{
    public interface IRecommendationService
    {
        Task<List<CaregiverRecommendationDTO>> GetRecommendedCaregiversAsync(string clientId);
        Task<List<GigRecommendationDTO>> GetRecommendedGigsAsync(string clientId);
        Task<string> SaveRecommendationsAsync(SaveRecommendationsRequest request);
    }
}
