using Application.DTOs;
using Application.Interfaces.Content;
using Infrastructure.Content.Services;
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
        public async Task<IActionResult> GetCaregiverAsync(string clientId)
        {
            logger.LogInformation($"Retrieving Client with ID : {clientId}");
            var client = await clientService.GetClientUserAsync(clientId);
            return Ok(client);
        }

    }
}
