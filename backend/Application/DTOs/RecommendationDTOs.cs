using System;
using System.Collections.Generic;

namespace Application.DTOs
{
    public class CaregiverRecommendationDTO
    {
        public string Id { get; set; }
        public string CaregiverId { get; set; }
        public string Name { get; set; }
        public decimal Rating { get; set; }
        public List<string> Specialties { get; set; }
        public int YearsExperience { get; set; }
        public decimal HourlyRate { get; set; }
        public string Location { get; set; }
        public List<string> Languages { get; set; }
        public int MatchScore { get; set; }
        public List<string> MatchDetails { get; set; }
    }

    public class GigRecommendationDTO
    {
        public string Id { get; set; }
        public string GigId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string ServiceType { get; set; }
        public string Location { get; set; }
        public string Schedule { get; set; }
        public decimal PayRate { get; set; }
        public List<string> RequiredSkills { get; set; }
        public int MatchScore { get; set; }
        public List<string> MatchDetails { get; set; }
    }

    public class SaveRecommendationsRequest
    {
        public string ClientId { get; set; }
        public List<CaregiverRecommendationDTO> CaregiverRecommendations { get; set; }
        public List<GigRecommendationDTO> GigRecommendations { get; set; }
        public DateTime GeneratedAt { get; set; }
    }
}
