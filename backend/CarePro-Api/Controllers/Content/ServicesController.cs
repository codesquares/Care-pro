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
    public class ServicesController : ControllerBase
    {
        private readonly IServiceServices serviceServices;
        private readonly ILogger<ServicesController> logger;

        public ServicesController(IServiceServices serviceServices, ILogger<ServicesController> logger)
        {
            this.serviceServices = serviceServices;
            this.logger = logger;
        }

        /// ENDPOINT TO CREATE  CLIENT USERS TO THE DATABASE
        [HttpPost]
        // [Authorize(Roles = "Caregiver")]
        public async Task<IActionResult> AddServiceAsync([FromBody] AddServiceRequest  addServiceRequest)
        {
            try
            {
                // Pass Domain Object to Repository, to Persisit this
                var service = await serviceServices.CreateServiceAsync(addServiceRequest);


                // Send DTO response back to ClientUser
                return Ok(service);

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
        public async Task<IActionResult> GetAllServicessAsync()
        {
            logger.LogInformation($"Retrieving all Services available");

            var services = await serviceServices.GetAllServicesAsync();

            return Ok(services);

        }


        [HttpGet]
        [Route("caregiver/caregiverId")]
        // [Authorize(Roles = "Caregiver, Admin")]
        public async Task<IActionResult> GetAllCaregiverServicessAsync(string caregiverId)
        {
            logger.LogInformation($"Retrieving all Services for Caregiver with Id: {caregiverId}");

            var services = await serviceServices.GetAllCaregiverServicesAsync(caregiverId);

            return Ok(services);

        }

        [HttpGet]
        [Route("serviceId")]
       // [Authorize(Roles = "Caregiver, Admin")]
        public async Task<IActionResult> GetServiceAsync(string serviceId)
        {
            logger.LogInformation($"Retrieving  Service with Id: {serviceId}");

            var service = await serviceServices.GetServiceAsync(serviceId);            

            return Ok(service);
        }

    }
}
