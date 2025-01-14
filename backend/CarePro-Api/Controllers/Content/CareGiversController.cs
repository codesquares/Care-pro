using Application.DTOs;
using Application.Interfaces.Content;
using Infrastructure.Content.Services.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Authentication;

namespace CarePro_Api.Controllers.Content
{
    [Route("api/[controller]")]
    [ApiController]
    public class CareGiversController : ControllerBase
    {
        private readonly ICareGiverService careGiverService;
        private readonly ILogger<CareGiversController> logger;

        public CareGiversController(ICareGiverService careGiverService, ILogger<CareGiversController> logger)
        {
            this.careGiverService = careGiverService;
            this.logger = logger;
        }

        /// ENDPOINT TO CREATE  CARE GIVER USERS TO THE DATABASE        
        [HttpPost]
        [Route("AddCaregiverUser")]
        public async Task<IActionResult> AddCaregiverUserAsync([FromBody] AddCaregiverRequest addCaregiverRequest)
        {
            try
            {
                // Pass Domain Object to Repository to Persist this
                var careGiverUser = await careGiverService.CreateCaregiverUserAsync(addCaregiverRequest);

                // Send DTO response back to ClientUser
                return Ok(careGiverUser);
            }
            catch (AuthenticationException authEx)
            {
                // Handle authentication-related exceptions
                return BadRequest(new { StatusCode = 400, ErrorMessage = authEx.Message });
            }
            catch (HttpRequestException httpEx)
            {
                // Handle HTTP request-related exceptions
                return StatusCode(500, new { StatusCode = 500, ErrorMessage = httpEx.Message });
            }
            catch (DbUpdateException dbEx)
            {
                // Handle database update-related exceptions
                return StatusCode(500, new { StatusCode = 500, ErrorMessage = dbEx.Message });
            }
            catch (Exception ex)
            {
                // Handle other exceptions
                return StatusCode(500, new { StatusCode = 500, ErrorMessage = ex.Message });
            }
        }


        [HttpGet]
        [Route("AllCaregivers")]
        //[Authorize(Roles = "Client,Admin")]
        public async Task<IActionResult> GetAllCaregiverAsync()
        {
            logger.LogInformation("Retrieving all Caregivers");
            var caregivers = await careGiverService.GetAllCaregiverUserAsync();
            return Ok(caregivers);
        }


        [HttpGet]
        [Route("{caregiverId}")]
        //[Authorize(Roles = "Client,Admin")]
        public async Task<IActionResult> GetCaregiverAsync(string caregiverId)
        {
            logger.LogInformation("Retrieving all Caregivers");
            var caregiver = await careGiverService.GetCaregiverUserAsync(caregiverId);
            return Ok(caregiver);
        }

        [HttpPut]
        [Route("UpdateCaregiverInfo/{caregiverId}")]        
        //[Authorize(Roles = "Caregiver, Client, Admin")]
        public async Task<IActionResult> UpdateCaregiverAdditionalInfoAsync(string caregiverId, UpdateCaregiverAdditionalInfoRequest updateCaregiverAdditionalInfoRequest)
        {
            logger.LogInformation($"Caregiver with ID: {caregiverId} additional Information has been updated.");
            var caregiver = await careGiverService.UpdateCaregiverInfornmationAsync(caregiverId, updateCaregiverAdditionalInfoRequest);
            return Ok(caregiver);
        }

    }
}
