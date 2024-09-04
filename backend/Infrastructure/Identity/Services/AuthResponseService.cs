using Application.Interfaces.Authentication;
using Application.Interfaces.Email;
using Domain.Settings;
using Infrastructure.Identity.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Services
{
    public class AuthResponseService : IAuthResponseService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IOptions<JWT> _Jwt;
        private readonly IEmailService _emailSender;

        public AuthResponseService(UserManager<AppUser> userManager, RoleManager<IdentityRole> roleManager, IOptions<JWT> jwt, IEmailService emailSender) 
        {
            this._userManager = userManager;
            this._roleManager = roleManager;
            this._Jwt = jwt;
            this._emailSender = emailSender;
        }

        
    }
}
