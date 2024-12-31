using Application.DTOs;
using Application.Interfaces.Authentication;
using Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Content.Services.Authentication
{
    public class TokenHandler : ITokenHandler
    {
        private readonly IConfiguration configuration;

        public TokenHandler(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        public Task<string> CreateTokenAsync(AppUserDTO  appUserDTO)
        {
            // Create Claims
            var claims = new List<Claim>();
            //claims.Add(new Claim(ClaimTypes.GivenName, appUser.FirstName));
            //claims.Add(new Claim(ClaimTypes.Surname, appUser.LastName));
            claims.Add(new Claim(ClaimTypes.Email, appUserDTO.Email));
            claims.Add(new Claim(ClaimTypes.Role, appUserDTO.Role));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                configuration["Jwt:Issuer"],
                configuration["Jwt:Audience"],
                claims,
                expires: DateTime.Now.AddMinutes(40),                
                

                signingCredentials: credentials);

            return Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
        }
    }
}
