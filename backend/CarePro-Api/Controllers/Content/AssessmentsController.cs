using Application.DTOs;
using Application.Interfaces.Content;
using Infrastructure.Content.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CarePro_Api.Controllers.Content
{
    [Route("api/[controller]")]
    [ApiController]
    public class AssessmentsController : ControllerBase
    {
        private readonly IAssessmentService assessmentService;
        private readonly ICareGiverService careGiverService;
        private readonly ILogger<AssessmentsController> logger;

        public AssessmentsController(IAssessmentService assessmentService, ICareGiverService careGiverService, ILogger<AssessmentsController> logger)
        {
            this.assessmentService = assessmentService;
            this.careGiverService = careGiverService;
            this.logger = logger;
        }

        [HttpPost]
        // [Authorize(Roles = "Caregiver")]
        public async Task<IActionResult> AddAssessmentAsync([FromBody] AddAssessmentRequest  addAssessmentRequest)
        {
            try
            {
                // Pass Domain Object to Repository, to Persisit this
                var assessment = await assessmentService.CreateAssessementAsync(addAssessmentRequest);


                // Send DTO response back to ClientUser
                return Ok(assessment);

            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
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
        [Route("careGiverId")]
        // [Authorize(Roles = "Caregiver, Client, Admin")]
        public async Task<IActionResult> GetAssessmentAsync(string careGiverId)
        {

            try
            {
                logger.LogInformation($"Retrieving Assessment for caregiver with ID '{careGiverId}'.");

                var assessment = await assessmentService.GetAssesementAsync(careGiverId);

                return Ok(assessment);

            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
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
