using Application.DTOs;
using Application.DTOs.Authentication;
using Application.Interfaces.Authentication;
using Domain;
using Domain.Entities;
using Infrastructure.Content.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Authentication;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Content.Services.Authentication
{
    public class AuthService : IAuthService
    {
        private readonly CareProDbContext careProDbContext;

        public AuthService(CareProDbContext careProDbContext)
        {
            this.careProDbContext = careProDbContext;
        }
        
        
        public async Task<AppUser> AuthenticateUserAsync(LoginRequest loginRequest)
        {      
            var appUser = await careProDbContext.AppUsers
                .FirstOrDefaultAsync(x => x.Email.ToLower() == loginRequest.Email.ToLower());

           

            if (appUser == null)
            {                
                return appUser;
            }


          
            return appUser;
        }



    }
}
