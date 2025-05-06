using Application.DTOs;
using Application.Interfaces.Content;
using Infrastructure.Content.Data;
using Infrastructure.Content.Services.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages.Manage;
using System;
using System.Security.Authentication;

namespace CarePro_Api.Controllers.Content
{
    [Route("api/[controller]")]
    [ApiController]
    public class CareGiversController : ControllerBase
    {
        private readonly CareProDbContext careProDbContext;
        private readonly ICareGiverService careGiverService;
        private readonly ILogger<CareGiversController> logger;

        public CareGiversController(CareProDbContext careProDbContext, ICareGiverService careGiverService, ILogger<CareGiversController> logger)
        {
            this.careProDbContext = careProDbContext;
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
                // Validate the incoming request
                if (!(await ValidateAddJobCaregiverAsync(addCaregiverRequest)))
                {
                    return BadRequest(ModelState);
                }

                // Pass Domain Object to Repository to Persist this
                var careGiverUser = await careGiverService.CreateCaregiverUserAsync(addCaregiverRequest);

                // Send DTO response back to ClientUser
                return Ok(careGiverUser);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { Message = ex.Message }); // Or BadRequest
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
            try
            {
                logger.LogInformation("Retrieving all Caregivers");
                var caregivers = await careGiverService.GetAllCaregiverUserAsync();
                return Ok(caregivers);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { Message = ex.Message }); // Or BadRequest
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
                return StatusCode(500, new { StatusCode = 500, ErrorMessage = ex.Message });
            }

        }


        [HttpGet]
        [Route("{caregiverId}")]
        //[Authorize(Roles = "Client,Admin")]
        public async Task<IActionResult> GetCaregiverAsync(string caregiverId)
        {
            try
            {
                logger.LogInformation("Retrieving all Caregivers");
                var caregiver = await careGiverService.GetCaregiverUserAsync(caregiverId);
                return Ok(caregiver);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut]
        [Route("UpdateCaregiverInfo/{caregiverId}")]        
        //[Authorize(Roles = "Caregiver, Client, Admin")]
        public async Task<IActionResult> UpdateCaregiverAdditionalInfoAsync(string caregiverId, [FromForm] UpdateCaregiverAdditionalInfoRequest updateCaregiverAdditionalInfoRequest)
        {
            try
            {
                logger.LogInformation($"Caregiver with ID: {caregiverId} additional Information has been updated.");
                var caregiver = await careGiverService.UpdateCaregiverInfornmationAsync(caregiverId, updateCaregiverAdditionalInfoRequest);
                return Ok(caregiver);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
            
        }


        [HttpPut]
        [Route("UpdateCaregiverAvailability/{caregiverId}")]
        //[Authorize(Roles = "Caregiver, Client, Admin")]
        public async Task<IActionResult> UpdateCaregiverAvailabilityAsync(string caregiverId, UpdateCaregiverAvailabilityRequest  updateCaregiverAvailabilityRequest)
        {
            try
            {
                logger.LogInformation($"Caregiver with ID: {caregiverId} additional Information has been updated.");
                var caregiver = await careGiverService.UpdateCaregiverAvailabilityAsync(caregiverId, updateCaregiverAvailabilityRequest);
                return Ok(caregiver);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }

        }



        [HttpPut]
        [Route("SoftDeleteCaregiver/{caregiverId}")]
        //[Authorize(Roles = "Caregiver, Client, Admin")]
        public async Task<IActionResult> SoftDeleteCaregiverAsync(string caregiverId )
        {
            try
            {
                logger.LogInformation($"Caregiver with ID: {caregiverId} Soft Deleted");
                var caregiver = await careGiverService.SoftDeleteCaregiverAsync(caregiverId);
                return Ok(caregiver);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }

        }



        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                await careGiverService.ResetPasswordAsync(request);
                return Ok(new { message = "Password reset successful." });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                // Log exception here if needed
                return StatusCode(500, new { message = "An unexpected error occurred.", details = ex.Message });
            }
        }




        // ✅ This is for generating the token and sending the reset email
        [HttpPost("request-reset")]
        [AllowAnonymous] // Allow unauthenticated access
        public async Task<IActionResult> RequestPasswordReset([FromBody] PasswordResetRequestDto request)
        {
            await careGiverService.GeneratePasswordResetTokenAsync(request);
            return Ok(new { message = "A reset link has been sent to the registered Email ." });
        }


        // ✅ This is for resetting the password using the token
        [HttpPost("resetPassword")]
        [AllowAnonymous] // Allow unauthenticated access
        public async Task<IActionResult> ResetPassword([FromBody] PasswordResetDto request)
        {
            await careGiverService.ResetPasswordWithJwtAsync(request);
            return Ok(new { message = "Password reset successful." });
        }



        #region Validation Region

        private async Task<bool> ValidateAddJobCaregiverAsync(AddCaregiverRequest addCaregiverRequest)
        {
            if (addCaregiverRequest == null)
            {
                ModelState.AddModelError(nameof(addCaregiverRequest), $" cannot be empty.");
                return false;
            }

            // Email format validation
            var emailAttribute = new System.ComponentModel.DataAnnotations.EmailAddressAttribute();
            if (!emailAttribute.IsValid(addCaregiverRequest.Email))
            {
                ModelState.AddModelError(nameof(addCaregiverRequest.Email), "Invalid email format.");
                return false;
            }

            var user = await careProDbContext.CareGivers.FirstOrDefaultAsync(x => x.Email == addCaregiverRequest.Email);
            if (user != null)
            {
                ModelState.AddModelError(nameof(addCaregiverRequest.Email),
                    "Email already exists. Kindly sign in or click on 'Forget Password'.");
                return false;
            }


            if (string.IsNullOrWhiteSpace(addCaregiverRequest.FirstName))
            {
                ModelState.AddModelError(nameof(addCaregiverRequest.FirstName),
                    $"{nameof(addCaregiverRequest.FirstName)} is required.");
            }

            if (string.IsNullOrWhiteSpace(addCaregiverRequest.LastName))
            {
                ModelState.AddModelError(nameof(addCaregiverRequest.LastName),
                    $"{nameof(addCaregiverRequest.LastName)} is required");
            }

            if (string.IsNullOrWhiteSpace(addCaregiverRequest.PhoneNo))
            {
                ModelState.AddModelError(nameof(addCaregiverRequest.PhoneNo),
                    $"{nameof(addCaregiverRequest.PhoneNo)} is required.");
            }

            if (string.IsNullOrWhiteSpace(addCaregiverRequest.Role))
            {
                ModelState.AddModelError(nameof(addCaregiverRequest.Role),
                    $"{nameof(addCaregiverRequest.Role)} is required.");
            }



            if (ModelState.ErrorCount > 0)
            {
                return false;
            }

            return true;
        }



        #endregion
    }




}

