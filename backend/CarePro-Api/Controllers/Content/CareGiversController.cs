using Application.DTOs;
using Application.Interfaces.Content;
using Infrastructure.Content.Services.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CarePro_Api.Controllers.Content
{
    [Route("api/[controller]")]
    [ApiController]
    public class CareGiversController : ControllerBase
    {
        private readonly ICareGiverService careGiverService;

        public CareGiversController(ICareGiverService careGiverService)
        {
            this.careGiverService = careGiverService;
        }

        /// ENDPOINT TO CREATE  CARE GIVER USERS TO THE DATABASE
        [HttpPost]
        [Route("AddCaregiverUser")]
        [Authorize(Roles = "Caregiver")]
        public async Task<IActionResult> AddCaregiverUserAsync([FromBody] AddCaregiverRequest addCaregiverRequest)
        {
            try
            {
                // Pass Domain Object to Repository, to Persisit this
                var careGiverUser = await careGiverService.CreateCaregiverUserAsync(addCaregiverRequest);
                                

                // Send DTO response back to ClientUser
                return Ok(careGiverUser);

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

    }
}
