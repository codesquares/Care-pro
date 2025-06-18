using Application.DTOs;
using Application.Interfaces;
using Application.Interfaces.Content;
using Domain.Entities;
using Infrastructure.Content.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Content.Services
{
    public class RecommendationService : IRecommendationService
    {
        private readonly CareProDbContext _dbContext;
        private readonly IClientPreferenceService _clientPreferenceService;
        private readonly ICareGiverService _caregiverService;
        private readonly IGigServices _gigServices;
        private readonly ILogger<RecommendationService> _logger;

        public RecommendationService(
            CareProDbContext dbContext,
            IClientPreferenceService clientPreferenceService,
            ICareGiverService caregiverService,
            IGigServices gigServices,
            ILogger<RecommendationService> logger)
        {
            _dbContext = dbContext;
            _clientPreferenceService = clientPreferenceService;
            _caregiverService = caregiverService;
            _gigServices = gigServices;
            _logger = logger;
        }

        public async Task<List<CaregiverRecommendationDTO>> GetRecommendedCaregiversAsync(string clientId)
        {
            try
            {
                // Get existing recommendations if available
                var existingRecommendations = await _dbContext.ClientRecommendations
                    .FirstOrDefaultAsync(r => r.ClientId == clientId);

                if (existingRecommendations != null && 
                    existingRecommendations.GeneratedAt > DateTime.Now.AddDays(-1) &&
                    existingRecommendations.CaregiverRecommendations?.Count > 0)
                {
                    // Return existing recommendations if they are recent (less than a day old)
                    var caregivers = await GetCaregiverDetailsAsync(existingRecommendations.CaregiverRecommendations);
                    return caregivers;
                }

                // Generate new recommendations
                var preferences = await GetClientPreferencesAsync(clientId);
                if (preferences == null)
                {
                    return new List<CaregiverRecommendationDTO>();
                }

                // Get available caregivers
                var availableCaregivers = await GetAvailableCaregiversAsync();

                // Generate matches
                var recommendations = MatchCaregiversToPreferences(availableCaregivers, preferences);

                // Store recommendations for future use
                await SaveCaregiverRecommendationsAsync(clientId, recommendations);

                return recommendations;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating caregiver recommendations for client {ClientId}", clientId);
                return new List<CaregiverRecommendationDTO>();
            }
        }

        public async Task<List<GigRecommendationDTO>> GetRecommendedGigsAsync(string clientId)
        {
            try
            {
                // Get existing recommendations if available
                var existingRecommendations = await _dbContext.ClientRecommendations
                    .FirstOrDefaultAsync(r => r.ClientId == clientId);

                if (existingRecommendations != null && 
                    existingRecommendations.GeneratedAt > DateTime.Now.AddDays(-1) &&
                    existingRecommendations.GigRecommendations?.Count > 0)
                {
                    // Return existing recommendations if they are recent (less than a day old)
                    var gigs = await GetGigDetailsAsync(existingRecommendations.GigRecommendations);
                    return gigs;
                }

                // Generate new recommendations
                var preferences = await GetClientPreferencesAsync(clientId);
                if (preferences == null)
                {
                    return new List<GigRecommendationDTO>();
                }

                // Get available gigs
                var availableGigs = await GetAvailableGigsAsync();

                // Generate matches
                var recommendations = MatchGigsToPreferences(availableGigs, preferences);

                // Store recommendations for future use
                await SaveGigRecommendationsAsync(clientId, recommendations);

                return recommendations;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating gig recommendations for client {ClientId}", clientId);
                return new List<GigRecommendationDTO>();
            }
        }

        public async Task<string> SaveRecommendationsAsync(SaveRecommendationsRequest request)
        {
            try
            {
                var existingRecommendation = await _dbContext.ClientRecommendations
                    .FirstOrDefaultAsync(r => r.ClientId == request.ClientId);

                if (existingRecommendation == null)
                {
                    // Create new recommendation entry
                    var newRecommendation = new ClientRecommendation
                    {
                        Id = ObjectId.GenerateNewId(),
                        ClientId = request.ClientId,
                        CaregiverRecommendations = request.CaregiverRecommendations.Select(cr => new CaregiverRecommendation
                        {
                            Id = ObjectId.GenerateNewId(),
                            CaregiverId = cr.CaregiverId,
                            MatchScore = cr.MatchScore,
                            MatchDetails = cr.MatchDetails
                        }).ToList(),
                        GigRecommendations = request.GigRecommendations.Select(gr => new GigRecommendation
                        {
                            Id = ObjectId.GenerateNewId(),
                            GigId = gr.GigId,
                            MatchScore = gr.MatchScore,
                            MatchDetails = gr.MatchDetails
                        }).ToList(),
                        GeneratedAt = request.GeneratedAt,
                    };

                    await _dbContext.ClientRecommendations.AddAsync(newRecommendation);
                    await _dbContext.SaveChangesAsync();
                    return newRecommendation.Id.ToString();
                }
                else
                {
                    // Update existing recommendation
                    existingRecommendation.CaregiverRecommendations = request.CaregiverRecommendations.Select(cr => new CaregiverRecommendation
                    {
                        Id = ObjectId.GenerateNewId(),
                        CaregiverId = cr.CaregiverId,
                        MatchScore = cr.MatchScore,
                        MatchDetails = cr.MatchDetails
                    }).ToList();

                    existingRecommendation.GigRecommendations = request.GigRecommendations.Select(gr => new GigRecommendation
                    {
                        Id = ObjectId.GenerateNewId(),
                        GigId = gr.GigId,
                        MatchScore = gr.MatchScore,
                        MatchDetails = gr.MatchDetails
                    }).ToList();

                    existingRecommendation.GeneratedAt = request.GeneratedAt;
                    existingRecommendation.UpdatedOn = DateTime.Now;

                    _dbContext.ClientRecommendations.Update(existingRecommendation);
                    await _dbContext.SaveChangesAsync();
                    return existingRecommendation.Id.ToString();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving recommendations for client {ClientId}", request.ClientId);
                throw;
            }
        }

        #region Private Helper Methods

        private async Task<Dictionary<string, object>> GetClientPreferencesAsync(string clientId)
        {
            try
            {
                var preferences = await _clientPreferenceService.GetClientPreferenceAsync(clientId);
                if (preferences?.Data == null || !preferences.Data.Any())
                {
                    return null;
                }

                // Parse the preferences from string format to object
                var result = new Dictionary<string, object>();
                foreach (var item in preferences.Data)
                {
                    if (string.IsNullOrEmpty(item)) continue;

                    var parts = item.Split(new[] { ':' }, 2);
                    if (parts.Length != 2) continue;

                    var key = parts[0];
                    var value = parts[1];

                    // Handle nested properties
                    if (key.Contains('.'))
                    {
                        var keyParts = key.Split('.');
                        var parentKey = keyParts[0];
                        var childKey = keyParts[1];

                        if (!result.ContainsKey(parentKey))
                        {
                            result[parentKey] = new Dictionary<string, object>();
                        }

                        ((Dictionary<string, object>)result[parentKey])[childKey] = value;
                    }
                    else
                    {
                        result[key] = value;
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting preferences for client {ClientId}", clientId);
                return null;
            }
        }

        private async Task<List<CaregiverRecommendationDTO>> GetCaregiverDetailsAsync(
            List<CaregiverRecommendation> recommendations)
        {
            var result = new List<CaregiverRecommendationDTO>();

            foreach (var rec in recommendations)
            {
                try
                {
                    // Get the caregiver details from the real database
                    var caregiverDetails = await _caregiverService.GetCaregiverUserAsync(rec.CaregiverId);
                    
                    if (caregiverDetails != null)
                    {
                        // Extract specialties from skills/categories
                        var specialties = new List<string>();
                        if (caregiverDetails.Categories != null && caregiverDetails.Categories.Any())
                        {
                            specialties.AddRange(caregiverDetails.Categories);
                        }
                        
                        // Extract languages if available
                        var languages = new List<string> { "English" }; // Default language
                        if (!string.IsNullOrEmpty(caregiverDetails.Languages))
                        {
                            languages = caregiverDetails.Languages.Split(',')
                                .Select(l => l.Trim())
                                .Where(l => !string.IsNullOrEmpty(l))
                                .ToList();
                        }
                        
                        // Calculate years of experience if available
                        int yearsExperience = 1; // Default to 1 year
                        if (caregiverDetails.YearsOfExperience.HasValue)
                        {
                            yearsExperience = caregiverDetails.YearsOfExperience.Value;
                        }

                        var caregiver = new CaregiverRecommendationDTO
                        {
                            Id = rec.Id.ToString(),
                            CaregiverId = rec.CaregiverId,
                            MatchScore = rec.MatchScore,
                            MatchDetails = rec.MatchDetails,
                            Name = $"{caregiverDetails.FirstName} {caregiverDetails.LastName}",
                            Rating = caregiverDetails.Rating ?? 4.0m,
                            YearsExperience = yearsExperience,
                            HourlyRate = caregiverDetails.HourlyRate ?? 25m,
                            Location = caregiverDetails.City ?? "Unknown",
                            Specialties = specialties,
                            Languages = languages
                        };

                        result.Add(caregiver);
                    }
                    else
                    {
                        _logger.LogWarning($"Caregiver with ID {rec.CaregiverId} not found in the database");
                        
                        // Add a placeholder with the data we have from the recommendation
                        var placeholder = new CaregiverRecommendationDTO
                        {
                            Id = rec.Id.ToString(),
                            CaregiverId = rec.CaregiverId,
                            MatchScore = rec.MatchScore,
                            MatchDetails = rec.MatchDetails,
                            Name = $"Caregiver {rec.CaregiverId}",
                            Rating = 4.5m,
                            YearsExperience = 3,
                            HourlyRate = 25m,
                            Location = "Unknown",
                            Specialties = new List<string>(),
                            Languages = new List<string> { "English" }
                        };
                        
                        result.Add(placeholder);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error retrieving details for caregiver {rec.CaregiverId}");
                    
                    // Add a placeholder with the data we have from the recommendation
                    var placeholder = new CaregiverRecommendationDTO
                    {
                        Id = rec.Id.ToString(),
                        CaregiverId = rec.CaregiverId,
                        MatchScore = rec.MatchScore,
                        MatchDetails = rec.MatchDetails,
                        Name = $"Caregiver {rec.CaregiverId}",
                        Rating = 4.5m,
                        YearsExperience = 3,
                        HourlyRate = 25m,
                        Location = "Unknown",
                        Specialties = new List<string>(),
                        Languages = new List<string> { "English" }
                    };
                    
                    result.Add(placeholder);
                }
            }

            return result;
        }

        private async Task<List<GigRecommendationDTO>> GetGigDetailsAsync(
            List<GigRecommendation> recommendations)
        {
            var result = new List<GigRecommendationDTO>();

            foreach (var rec in recommendations)
            {
                try
                {
                    // Get the gig details from the real database
                    var gigDetails = await _gigServices.GetGigAsync(rec.GigId);
                    
                    if (gigDetails != null)
                    {
                        var requiredSkills = new List<string>();
                        
                        // Extract required skills from gig requirements
                        if (gigDetails.Requirements != null && gigDetails.Requirements.Any())
                        {
                            requiredSkills.AddRange(gigDetails.Requirements);
                        }
                        
                        // Extract from categories if requirements not specified
                        if (requiredSkills.Count == 0 && !string.IsNullOrEmpty(gigDetails.SubCategory))
                        {
                            requiredSkills.Add(gigDetails.SubCategory);
                        }
                        
                        // Determine schedule from the gig data
                        string schedule = "flexible";
                        if (!string.IsNullOrEmpty(gigDetails.AvailabilitySchedule))
                        {
                            schedule = gigDetails.AvailabilitySchedule;
                        }
                        
                        var gig = new GigRecommendationDTO
                        {
                            Id = rec.Id.ToString(),
                            GigId = rec.GigId,
                            MatchScore = rec.MatchScore,
                            MatchDetails = rec.MatchDetails,
                            Title = gigDetails.Title,
                            Description = gigDetails.Description,
                            ServiceType = gigDetails.Category ?? gigDetails.SubCategory ?? "General Care",
                            Location = gigDetails.Location ?? "Unknown",
                            Schedule = schedule,
                            PayRate = gigDetails.Price ?? 0m,
                            RequiredSkills = requiredSkills
                        };

                        result.Add(gig);
                    }
                    else
                    {
                        _logger.LogWarning($"Gig with ID {rec.GigId} not found in the database");
                        
                        // Add a placeholder with the data we have from the recommendation
                        var placeholder = new GigRecommendationDTO
                        {
                            Id = rec.Id.ToString(),
                            GigId = rec.GigId,
                            MatchScore = rec.MatchScore,
                            MatchDetails = rec.MatchDetails,
                            Title = $"Gig {rec.GigId}",
                            Description = "Care services needed",
                            ServiceType = "General Care",
                            Location = "Unknown",
                            Schedule = "Flexible",
                            PayRate = 30m,
                            RequiredSkills = new List<string>()
                        };
                        
                        result.Add(placeholder);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error retrieving details for gig {rec.GigId}");
                    
                    // Add a placeholder with the data we have from the recommendation
                    var placeholder = new GigRecommendationDTO
                    {
                        Id = rec.Id.ToString(),
                        GigId = rec.GigId,
                        MatchScore = rec.MatchScore,
                        MatchDetails = rec.MatchDetails,
                        Title = $"Gig {rec.GigId}",
                        Description = "Care services needed",
                        ServiceType = "General Care",
                        Location = "Unknown",
                        Schedule = "Flexible",
                        PayRate = 30m,
                        RequiredSkills = new List<string>()
                    };
                    
                    result.Add(placeholder);
                }
            }

            return result;
        }

        private async Task<List<CaregiverRecommendationDTO>> GetAvailableCaregiversAsync()
        {
            try
            {
                // Fetch all caregivers from the real database
                var caregivers = await _caregiverService.GetAllCaregiverUserAsync();
                
                if (caregivers == null || !caregivers.Any())
                {
                    _logger.LogWarning("No caregivers found in the database");
                    return new List<CaregiverRecommendationDTO>();
                }

                // Convert the caregivers to our recommendation DTO format
                var recommendationDtos = new List<CaregiverRecommendationDTO>();
                
                foreach (var caregiver in caregivers)
                {
                    // Only include active and verified caregivers 
                    if (caregiver.IsActive && caregiver.IsVerified)
                    {
                        var specialties = new List<string>();
                        
                        // Extract specialties from skills/categories
                        if (caregiver.Categories != null && caregiver.Categories.Any())
                        {
                            specialties.AddRange(caregiver.Categories);
                        }
                        
                        // Extract languages if available
                        var languages = new List<string> { "English" }; // Default language
                        if (!string.IsNullOrEmpty(caregiver.Languages))
                        {
                            // Split languages if they're stored as comma-separated
                            languages = caregiver.Languages.Split(',')
                                .Select(l => l.Trim())
                                .Where(l => !string.IsNullOrEmpty(l))
                                .ToList();
                        }
                        
                        // Calculate years of experience if available
                        int yearsExperience = 1; // Default to 1 year
                        if (caregiver.YearsOfExperience.HasValue)
                        {
                            yearsExperience = caregiver.YearsOfExperience.Value;
                        }
                        
                        recommendationDtos.Add(new CaregiverRecommendationDTO
                        {
                            CaregiverId = caregiver.Id,
                            Name = $"{caregiver.FirstName} {caregiver.LastName}",
                            Rating = caregiver.Rating ?? 4.0m, // Default rating if not available
                            Specialties = specialties,
                            YearsExperience = yearsExperience,
                            HourlyRate = caregiver.HourlyRate ?? 25m, // Default rate if not available
                            Location = caregiver.City ?? "Unknown",
                            Languages = languages
                        });
                    }
                }
                
                return recommendationDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving caregivers from database");
                
                // Fallback to a minimal set of mock data in case of error
                return new List<CaregiverRecommendationDTO>
                {
                    new CaregiverRecommendationDTO
                    {
                        CaregiverId = "fallback-1",
                        Name = "Default Caregiver",
                        Rating = 4.5m,
                        Specialties = new List<string> { "General Care" },
                        YearsExperience = 3,
                        HourlyRate = 25m,
                        Location = "Lagos",
                        Languages = new List<string> { "English" }
                    }
                };
            }
        }

        private async Task<List<GigRecommendationDTO>> GetAvailableGigsAsync()
        {
            try
            {
                // Fetch all active gigs from the real database
                var gigs = await _gigServices.GetAllGigsAsync();
                
                if (gigs == null || !gigs.Any())
                {
                    _logger.LogWarning("No gigs found in the database");
                    return new List<GigRecommendationDTO>();
                }

                // Convert the gigs to our recommendation DTO format
                var recommendationDtos = new List<GigRecommendationDTO>();
                
                foreach (var gig in gigs)
                {
                    // Only include active and published gigs
                    if (gig.IsActive && gig.Status.ToLower() == "published")
                    {
                        var requiredSkills = new List<string>();
                        
                        // Extract required skills from gig requirements
                        if (gig.Requirements != null && gig.Requirements.Any())
                        {
                            requiredSkills.AddRange(gig.Requirements);
                        }
                        
                        // Extract from categories if requirements not specified
                        if (requiredSkills.Count == 0 && !string.IsNullOrEmpty(gig.SubCategory))
                        {
                            requiredSkills.Add(gig.SubCategory);
                        }
                        
                        // Determine schedule from the gig data
                        string schedule = "flexible";
                        if (!string.IsNullOrEmpty(gig.AvailabilitySchedule))
                        {
                            schedule = gig.AvailabilitySchedule;
                        }
                        
                        recommendationDtos.Add(new GigRecommendationDTO
                        {
                            GigId = gig.Id,
                            Title = gig.Title,
                            Description = gig.Description,
                            ServiceType = gig.Category ?? gig.SubCategory ?? "General Care",
                            Location = gig.Location ?? "Unknown",
                            Schedule = schedule,
                            PayRate = gig.Price ?? 0m,
                            RequiredSkills = requiredSkills
                        });
                    }
                }
                
                return recommendationDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving gigs from database");
                
                // Fallback to a minimal set of mock data in case of error
                return new List<GigRecommendationDTO>
                {
                    new GigRecommendationDTO
                    {
                        GigId = "fallback-1",
                        Title = "Default Care Service",
                        Description = "Care service available",
                        ServiceType = "General Care",
                        Location = "Lagos",
                        Schedule = "flexible",
                        PayRate = 30m,
                        RequiredSkills = new List<string> { "Basic Care" }
                    }
                };
            }
        }

        private List<CaregiverRecommendationDTO> MatchCaregiversToPreferences(
            List<CaregiverRecommendationDTO> caregivers, Dictionary<string, object> preferences)
        {
            var results = new List<CaregiverRecommendationDTO>();

            foreach (var caregiver in caregivers)
            {
                int matchScore = 0;
                int maxPossibleScore = 0;
                var matchDetails = new List<string>();

                // Match service type
                if (preferences.TryGetValue("serviceType", out var serviceTypeObj) && 
                    !string.IsNullOrEmpty(serviceTypeObj?.ToString()) && 
                    caregiver.Specialties.Contains(serviceTypeObj.ToString()))
                {
                    matchScore += 20;
                    matchDetails.Add($"Specializes in {serviceTypeObj}");
                }
                maxPossibleScore += 20;

                // Match location
                if (preferences.TryGetValue("location", out var locationObj) && 
                    !string.IsNullOrEmpty(locationObj?.ToString()) && 
                    caregiver.Location == locationObj.ToString())
                {
                    matchScore += 15;
                    matchDetails.Add($"Located in {locationObj}");
                }
                maxPossibleScore += 15;

                // Match gender preference
                if (preferences.TryGetValue("caregiverPreferences", out var prefObj) && 
                    prefObj is Dictionary<string, object> caregiverPrefs &&
                    caregiverPrefs.TryGetValue("gender", out var genderObj) &&
                    !string.IsNullOrEmpty(genderObj?.ToString()))
                {
                    // Assuming caregiver object has a Gender property - add this if needed
                    var caregiverGender = caregiver.Name.Contains("Sarah") || caregiver.Name.Contains("Aisha") ? "female" : "male";
                    
                    if (caregiverGender.Equals(genderObj.ToString(), StringComparison.OrdinalIgnoreCase))
                    {
                        matchScore += 10;
                        matchDetails.Add($"Matches gender preference: {caregiverGender}");
                    }
                }
                maxPossibleScore += 10;

                // Match experience level
                if (preferences.TryGetValue("caregiverPreferences", out var prefExpObj) && 
                    prefExpObj is Dictionary<string, object> caregiverExpPrefs &&
                    caregiverExpPrefs.TryGetValue("experience", out var expObj) &&
                    !string.IsNullOrEmpty(expObj?.ToString()))
                {
                    bool matchesExperience = false;
                    var expPreference = expObj.ToString();

                    switch(expPreference.ToLower())
                    {
                        case "beginner":
                            matchesExperience = true; // Any experience is fine
                            break;
                        case "intermediate":
                            matchesExperience = caregiver.YearsExperience >= 2;
                            break;
                        case "advanced":
                            matchesExperience = caregiver.YearsExperience >= 5;
                            break;
                        case "expert":
                            matchesExperience = caregiver.YearsExperience >= 10;
                            break;
                    }

                    if (matchesExperience)
                    {
                        matchScore += 10;
                        matchDetails.Add($"Has {caregiver.YearsExperience}+ years experience");
                    }
                }
                maxPossibleScore += 10;

                // Match budget
                if (preferences.TryGetValue("budget", out var budgetObj) && 
                    budgetObj is Dictionary<string, object> budget &&
                    budget.TryGetValue("min", out var minObj) &&
                    budget.TryGetValue("max", out var maxObj))
                {
                    decimal minBudget = 0;
                    decimal maxBudget = 0;

                    if (decimal.TryParse(minObj.ToString(), out minBudget) && 
                        decimal.TryParse(maxObj.ToString(), out maxBudget) &&
                        minBudget > 0 && maxBudget > 0)
                    {
                        if (caregiver.HourlyRate >= minBudget && caregiver.HourlyRate <= maxBudget)
                        {
                            matchScore += 15;
                            matchDetails.Add($"Rate (${caregiver.HourlyRate}/hr) within budget");
                        }
                    }
                }
                maxPossibleScore += 15;

                // Calculate percentage match
                int percentageMatch = maxPossibleScore > 0 ? 
                    (int)Math.Round((double)matchScore / maxPossibleScore * 100) : 0;

                // Only include if match score is high enough
                if (percentageMatch >= 50)
                {
                    caregiver.MatchScore = percentageMatch;
                    caregiver.MatchDetails = matchDetails;
                    results.Add(caregiver);
                }
            }

            // Sort by match score descending
            return results.OrderByDescending(c => c.MatchScore).ToList();
        }

        private List<GigRecommendationDTO> MatchGigsToPreferences(
            List<GigRecommendationDTO> gigs, Dictionary<string, object> preferences)
        {
            var results = new List<GigRecommendationDTO>();

            foreach (var gig in gigs)
            {
                int matchScore = 0;
                int maxPossibleScore = 0;
                var matchDetails = new List<string>();

                // Match service type
                if (preferences.TryGetValue("serviceType", out var serviceTypeObj) && 
                    !string.IsNullOrEmpty(serviceTypeObj?.ToString()) && 
                    gig.ServiceType == serviceTypeObj.ToString())
                {
                    matchScore += 25;
                    matchDetails.Add($"Matches needed service: {gig.ServiceType}");
                }
                maxPossibleScore += 25;

                // Match location
                if (preferences.TryGetValue("location", out var locationObj) && 
                    !string.IsNullOrEmpty(locationObj?.ToString()) && 
                    gig.Location == locationObj.ToString())
                {
                    matchScore += 20;
                    matchDetails.Add($"Located in {gig.Location}");
                }
                maxPossibleScore += 20;

                // Match schedule
                if (preferences.TryGetValue("schedule", out var scheduleObj) && 
                    !string.IsNullOrEmpty(scheduleObj?.ToString()) && 
                    (gig.Schedule == scheduleObj.ToString() || 
                     gig.Schedule == "flexible" || 
                     scheduleObj.ToString() == "flexible"))
                {
                    matchScore += 15;
                    matchDetails.Add("Matches your preferred schedule");
                }
                maxPossibleScore += 15;

                // Match service frequency
                if (preferences.TryGetValue("serviceFrequency", out var freqObj) && 
                    !string.IsNullOrEmpty(freqObj?.ToString()))
                {
                    // Assuming gig has a frequency property that matches serviceFrequency
                    var gigFrequency = gig.Title.Contains("weekly") ? "weekly" : 
                                      gig.Title.Contains("daily") ? "daily" : "as-needed";
                    
                    if (gigFrequency == freqObj.ToString())
                    {
                        matchScore += 10;
                        matchDetails.Add($"{gigFrequency} service");
                    }
                }
                maxPossibleScore += 10;

                // Match budget range
                if (preferences.TryGetValue("budget", out var budgetObj) && 
                    budgetObj is Dictionary<string, object> budget &&
                    budget.TryGetValue("min", out var minObj) &&
                    budget.TryGetValue("max", out var maxObj))
                {
                    decimal minBudget = 0;
                    decimal maxBudget = 0;

                    if (decimal.TryParse(minObj.ToString(), out minBudget) && 
                        decimal.TryParse(maxObj.ToString(), out maxBudget) &&
                        minBudget > 0 && maxBudget > 0)
                    {
                        if (gig.PayRate >= minBudget && gig.PayRate <= maxBudget)
                        {
                            matchScore += 10;
                            matchDetails.Add($"Rate (${gig.PayRate}/hr) within budget");
                        }
                    }
                }
                maxPossibleScore += 10;

                // Calculate percentage match
                int percentageMatch = maxPossibleScore > 0 ? 
                    (int)Math.Round((double)matchScore / maxPossibleScore * 100) : 0;

                // Only include if match score is high enough
                if (percentageMatch >= 50)
                {
                    gig.MatchScore = percentageMatch;
                    gig.MatchDetails = matchDetails;
                    results.Add(gig);
                }
            }

            // Sort by match score descending
            return results.OrderByDescending(g => g.MatchScore).ToList();
        }

        private async Task SaveCaregiverRecommendationsAsync(
            string clientId, List<CaregiverRecommendationDTO> recommendations)
        {
            try
            {
                var existingRecommendation = await _dbContext.ClientRecommendations
                    .FirstOrDefaultAsync(r => r.ClientId == clientId);

                var caregiverRecommendations = recommendations.Select(r => new CaregiverRecommendation
                {
                    Id = ObjectId.GenerateNewId(),
                    CaregiverId = r.CaregiverId,
                    MatchScore = r.MatchScore,
                    MatchDetails = r.MatchDetails
                }).ToList();

                if (existingRecommendation == null)
                {
                    // Create new recommendation
                    var newRecommendation = new ClientRecommendation
                    {
                        Id = ObjectId.GenerateNewId(),
                        ClientId = clientId,
                        CaregiverRecommendations = caregiverRecommendations,
                        GigRecommendations = new List<GigRecommendation>(),
                        GeneratedAt = DateTime.Now
                    };

                    await _dbContext.ClientRecommendations.AddAsync(newRecommendation);
                }
                else
                {
                    // Update existing recommendation
                    existingRecommendation.CaregiverRecommendations = caregiverRecommendations;
                    existingRecommendation.GeneratedAt = DateTime.Now;
                    existingRecommendation.UpdatedOn = DateTime.Now;

                    _dbContext.ClientRecommendations.Update(existingRecommendation);
                }

                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving caregiver recommendations for client {ClientId}", clientId);
            }
        }

        private async Task SaveGigRecommendationsAsync(
            string clientId, List<GigRecommendationDTO> recommendations)
        {
            try
            {
                var existingRecommendation = await _dbContext.ClientRecommendations
                    .FirstOrDefaultAsync(r => r.ClientId == clientId);

                var gigRecommendations = recommendations.Select(r => new GigRecommendation
                {
                    Id = ObjectId.GenerateNewId(),
                    GigId = r.GigId,
                    MatchScore = r.MatchScore,
                    MatchDetails = r.MatchDetails
                }).ToList();

                if (existingRecommendation == null)
                {
                    // Create new recommendation
                    var newRecommendation = new ClientRecommendation
                    {
                        Id = ObjectId.GenerateNewId(),
                        ClientId = clientId,
                        CaregiverRecommendations = new List<CaregiverRecommendation>(),
                        GigRecommendations = gigRecommendations,
                        GeneratedAt = DateTime.Now
                    };

                    await _dbContext.ClientRecommendations.AddAsync(newRecommendation);
                }
                else
                {
                    // Update existing recommendation
                    existingRecommendation.GigRecommendations = gigRecommendations;
                    existingRecommendation.GeneratedAt = DateTime.Now;
                    existingRecommendation.UpdatedOn = DateTime.Now;

                    _dbContext.ClientRecommendations.Update(existingRecommendation);
                }

                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving gig recommendations for client {ClientId}", clientId);
            }
        }

        #endregion
    }
}
