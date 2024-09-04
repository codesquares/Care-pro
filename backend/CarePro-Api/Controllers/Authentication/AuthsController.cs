using Application.Interfaces.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CarePro_Api.Controllers.Authentication
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthsController : ControllerBase
    {
        private readonly IAuthResponseService _authResponseService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthsController(IAuthResponseService authResponseService, IHttpContextAccessor httpContextAccessor)
        {
            _authResponseService = authResponseService;
            _httpContextAccessor = httpContextAccessor;
        }




    }
}
