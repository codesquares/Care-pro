using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Content.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CarePro_Api.Controllers.Content
{
    [Route("api/[controller]")]
    [ApiController]
    public class GigsController : ControllerBase
    {
        private readonly IGigServices gigServices;
        private readonly ILogger<GigsController> logger;

        public GigsController(IGigServices gigServices, ILogger<GigsController> logger)
        {
            this.gigServices = gigServices;
            this.logger = logger;
        }

        /// ENDPOINT TO CREATE  CLIENT USERS TO THE DATABASE
        [HttpPost]
        // [Authorize(Roles = "Caregiver")]
        public async Task<IActionResult> AddGigAsync([FromForm] AddGigRequest  addGigRequest)
        {
            try
            {
                // Pass Domain Object to Repository, to Persisit this
                var gig = await gigServices.CreateGigAsync(addGigRequest);


                // Send DTO response back to ClientUser
                return Ok(gig);

            }
            catch (ApplicationException appEx)
            {
                // Handle application-specific exceptions
                return BadRequest(new { ErrorMessage = appEx.Message });
            }
            catch (HttpRequestException httpEx)
            {
                // Handle HTTP request-related exceptions
                return StatusCode(500, new { ErrorMessage = httpEx.Message });
            }
            catch (Exception ex)
            {
                // Handle other exceptions
                return StatusCode(500, new { ex /*ErrorMessage = "An error occurred on the server."*/ });
            }

        }


        [HttpGet]
       // [Authorize(Roles = "Caregiver, Admin")]
        public async Task<IActionResult> GetAllGigsAsync()
        {
            logger.LogInformation($"Retrieving all Gigs available");

            var gigs = await gigServices.GetAllGigsAsync();

            return Ok(gigs);

        }


        [HttpGet]
        [Route("caregiver/caregiverId")]
        // [Authorize(Roles = "Caregiver, Admin")]
        public async Task<IActionResult> GetAllCaregiverGigsAsync(string caregiverId)
        {
            logger.LogInformation($"Retrieving all Gigs for Caregiver with Id: {caregiverId}");

            var services = await gigServices.GetAllCaregiverGigsAsync(caregiverId);

            return Ok(services);

        }

        [HttpGet]
        [Route("gigId")]
       // [Authorize(Roles = "Caregiver, Admin")]
        public async Task<IActionResult> GetGigAsync(string gigId)
        {
            logger.LogInformation($"Retrieving  Service with Id: {gigId}");

            var gig = await gigServices.GetGigAsync(gigId);            

            return Ok(gig);
        }

    }
}
