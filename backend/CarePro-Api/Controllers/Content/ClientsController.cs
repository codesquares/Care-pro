using Application.DTOs;
using Application.Interfaces.Content;
using Infrastructure.Content.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CarePro_Api.Controllers.Content
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientsController : ControllerBase
    {
        private readonly IClientService clientService;

        public ClientsController(IClientService clientService)
        {
            this.clientService = clientService;
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
