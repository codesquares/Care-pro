using Application.DTOs;
using Application.Interfaces;
using Application.Interfaces.Content;
using Infrastructure.Content.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CarePro_Api.Controllers.Content
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientOrdersController : ControllerBase
    {
        private readonly IClientOrderService clientOrderService;
        private readonly ILogger<ClientOrdersController> logger;

        public ClientOrdersController(IClientOrderService clientOrderService, ILogger<ClientOrdersController> logger)
        {
            this.clientOrderService = clientOrderService;
            this.logger = logger;
        }

        /// ENDPOINT TO CREATE  ClientOrder Services TO THE DATABASE
        [HttpPost]
        // [Authorize(Roles = "Client")]
        public async Task<IActionResult> AddClientOrderAsync([FromBody] AddClientOrderRequest addClientOrderRequest)
        {
            try
            {
                // Pass Domain Object to Repository, to Persisit this
                var clientOrder = await clientOrderService.CreateClientOrderAsync(addClientOrderRequest);


                // Send DTO response back to ClientUser
                return Ok(clientOrder);

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
