using Application.DTOs;
using Application.Interfaces.Content;
using Infrastructure.Content.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Authentication;

namespace CarePro_Api.Controllers.Content
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientsController : ControllerBase
    {
        private readonly IClientService clientService;
        private readonly ILogger<ClientsController> logger;

        public ClientsController(IClientService clientService, ILogger<ClientsController> logger)
        {
            this.clientService = clientService;
            this.logger = logger;
        }

        /// ENDPOINT TO CREATE  CLIENT USERS TO THE DATABASE
        [HttpPost]
        [Route("AddClientUser")]
        // [Authorize(Roles = "Caregiver")]
        public async Task<IActionResult> AddClientUserAsync([FromBody] AddClientUserRequest  addClientUserRequest)
        {
            try
            {
                // Pass Domain Object to Repository, to Persisit this
                var clientUser = await clientService.CreateClientUserAsync(addClientUserRequest);


                // Send DTO response back to ClientUser
                return Ok(clientUser);

            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { Message = ex.Message });
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
        [Route("{clientId}")]
        //[Authorize(Roles = "Client,Admin")]
        public async Task<IActionResult> GetClientUserAsync(string clientId)
        {
            try
            {
                logger.LogInformation($"Retrieving Client with ID : {clientId}");
                var client = await clientService.GetClientUserAsync(clientId);
                return Ok(client);
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
                return StatusCode(500, new { ex });
            }
        }

        [HttpGet]
        [Route("AllClientUsers")]
        //[Authorize(Roles = "Client,Admin")]
        public async Task<IActionResult> GetAllClientUsersAsync()
        {
            try
            {
                logger.LogInformation("Retrieving all Caregivers");
                var caregivers = await clientService.GetAllClientUserAsync();
                return Ok(caregivers);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { Message = ex.Message });
            }
            catch (AuthenticationException authEx)
            {
                return Unauthorized(new { StatusCode = 401, ErrorMessage = authEx.Message });
            }
            catch (HttpRequestException httpEx)
            {
                return StatusCode(503, new { StatusCode = 503, ErrorMessage = httpEx.Message });
            }
            catch (DbUpdateException dbEx)
            {
                return StatusCode(500, new { StatusCode = 500, ErrorMessage = dbEx.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { StatusCode = 500, ErrorMessage = ex.Message });
            }

        }


        [HttpPut]
        [Route("SoftDeleteClient/{clientId}")]
        //[Authorize(Roles = "Client, Admin")]
        public async Task<IActionResult> SoftDeleteClientAsync(string clientId)
        {
            try
            {
                logger.LogInformation($"Client with ID: {clientId} Soft Deleted");
                var client = await clientService.SoftDeleteClientAsync(clientId);
                return Ok(client);
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
                await clientService.ResetPasswordAsync(request);
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
            await clientService.GeneratePasswordResetTokenAsync(request);
            return Ok(new { message = "A reset link has been sent to the registered Email ." });
        }


        // ✅ This is for resetting the password using the token
        [HttpPost("resetPassword")]
        [AllowAnonymous] // Allow unauthenticated access
        public async Task<IActionResult> ResetPassword([FromBody] PasswordResetDto request)
        {
            await clientService.ResetPasswordWithJwtAsync(request);
            return Ok(new { message = "Password reset successful." });
        }



    }
}
