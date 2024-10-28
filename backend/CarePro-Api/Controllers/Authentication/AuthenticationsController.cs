using Application.DTOs;
using Application.DTOs.Authentication;
using Application.Interfaces.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NuGet.Protocol.Plugins;

namespace CarePro_Api.Controllers.Authentication
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthenticationsController : ControllerBase
    {
        private readonly IAuthService authService;
        private readonly ITokenHandler tokenHandler;

        public AuthenticationsController(IAuthService authService, ITokenHandler tokenHandler)
        {
            this.authService = authService;
            this.tokenHandler = tokenHandler;
        }


        [HttpPost]
        [Route("UserLogin")]
        [AllowAnonymous]
        public async Task<IActionResult> UserLogin([FromBody] LoginRequest loginRequest)
        {
            try
            {
                // Call repository to login client user
                var careProUserDomain = await authService.AuthenticateUserAsync(loginRequest);
                var auth = new LoginResponse();

                if (careProUserDomain == null)
                {
                    return Unauthorized(new { message = "Email Entered does not exist, Please Check!" });
                }

                bool isValidPassword = BCrypt.Net.BCrypt.Verify(loginRequest.Password, careProUserDomain.Password);

                if (careProUserDomain != null && isValidPassword)
                {

                    // Generate a JWT Token
                    var token = await tokenHandler.CreateTokenAsync(careProUserDomain);

                    // Return both token and clientUserDomain
                    var response = new LoginResponse
                    {
                        Id = careProUserDomain.Id.ToString(),
                        Email = loginRequest.Email,
                        Role = careProUserDomain.Role,
                        Token = token,
                    };

                    return Ok(response);

                }
                else if (careProUserDomain != null && !isValidPassword)
                {
                    return Unauthorized(new { message = "Incorrect Password." });
                }
                else
                {
                    return BadRequest("Bad Request (Email or Password incorrect)");
                }

            }

            catch (ApplicationException appEx)
            {
                // Handle application-specific exceptions
                return BadRequest(new { ErrorMessage = appEx.Message });
            }
            catch (HttpRequestException httpEx)
            {
                // Handle HTTP request-related exceptions
                return StatusCode(500, new { ErrorMessage = "An error occurred on the server. \n ", httpEx.Message });
            }
            catch (Exception Ex)
            {
                // Handle application-specific exceptions
                return BadRequest(new { ErrorMessage = Ex.Message });
            }

        }

        /// ENDPOINT TO CREATE  CARE GIVER USERS TO THE DATABASE
        [HttpPost]
        [Route("AddCaregiverUser")]
        public async Task<IActionResult> AddCaregiverUserAsync([FromBody] AddCaregiverRequest addCaregiverRequest)
        {
            try
            {
                // Pass Domain Object to Repository, to Persisit this
                var clientUserDomain = await authService.AddCaregiverUserAsync(addCaregiverRequest);

                // Convert the Domain Object back to DTO
                var careGiverUserDTO = new CaregiverResponse
                {
                    Id = clientUserDomain.Id.ToString(),
                    FirstName = clientUserDomain.FirstName,
                    MiddleName = clientUserDomain.MiddleName,
                    LastName = clientUserDomain.LastName,
                    Email = clientUserDomain.Email,
                    Role = clientUserDomain.Role,
                    Status = clientUserDomain.Status,
                    IsDeleted = clientUserDomain.IsDeleted,
                    CreatedAt = clientUserDomain.CreatedAt
                };

                // Send DTO response back to ClientUser
                return Ok(careGiverUserDTO);

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
