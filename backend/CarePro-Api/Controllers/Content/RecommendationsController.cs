using Application.DTOs;
using Application.Interfaces.Content;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace CarePro_Api.Controllers.Content
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecommendationsController : ControllerBase
    {
        private readonly IRecommendationService _recommendationService;
        private readonly ILogger<RecommendationsController> _logger;

        public RecommendationsController(
            IRecommendationService recommendationService,
            ILogger<RecommendationsController> logger)
        {
            _recommendationService = recommendationService;
            _logger = logger;
        }

        [HttpGet("caregivers/{clientId}")]
        // [Authorize(Roles = "Client")]
        public async Task<IActionResult> GetRecommendedCaregiversAsync(string clientId)
        {
            try
            {
                _logger.LogInformation($"Getting recommended caregivers for client {clientId}");
                var recommendations = await _recommendationService.GetRecommendedCaregiversAsync(clientId);
                return Ok(recommendations);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommended caregivers for client {ClientId}", clientId);
                return StatusCode(500, new { message = "An error occurred while retrieving recommendations." });
            }
        }

        [HttpGet("gigs/{clientId}")]
        // [Authorize(Roles = "Client")]
        public async Task<IActionResult> GetRecommendedGigsAsync(string clientId)
        {
            try
            {
                _logger.LogInformation($"Getting recommended gigs for client {clientId}");
                var recommendations = await _recommendationService.GetRecommendedGigsAsync(clientId);
                return Ok(recommendations);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommended gigs for client {ClientId}", clientId);
                return StatusCode(500, new { message = "An error occurred while retrieving recommendations." });
            }
        }

        [HttpPost]
        // [Authorize(Roles = "Client")]
        public async Task<IActionResult> SaveRecommendationsAsync([FromBody] SaveRecommendationsRequest request)
        {
            try
            {
                _logger.LogInformation($"Saving recommendations for client {request.ClientId}");
                var result = await _recommendationService.SaveRecommendationsAsync(request);
                return Ok(new { id = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving recommendations for client {ClientId}", request.ClientId);
                return StatusCode(500, new { message = "An error occurred while saving recommendations." });
            }
        }
    }
}
