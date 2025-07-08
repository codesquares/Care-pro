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
        
        
        public async Task<AppUserDTO> AuthenticateUserAsync(LoginRequest loginRequest)
        {      
            var appUser = await careProDbContext.AppUsers
                .FirstOrDefaultAsync(x => x.Email.ToLower() == loginRequest.Email.ToLower());
           

            if (appUser != null)
            {
                //return appUser;
                var careGiverAppUser = await careProDbContext.CareGivers.FirstOrDefaultAsync(x => x.Id == appUser.AppUserId);
                var clientAppUser = await careProDbContext.Clients.FirstOrDefaultAsync(x => x.Id == appUser.AppUserId);
                var adminAppUser = await careProDbContext.AdminUsers.FirstOrDefaultAsync(x => x.Id == appUser.AppUserId);

                if (careGiverAppUser != null || clientAppUser != null || adminAppUser != null)
                {
                    var appUserDetails = new AppUserDTO()
                    {
                        AppUserId = appUser.AppUserId.ToString(),
                        Email = appUser.Email,
                       // FirstName = careGiverAppUser?.FirstName ?? clientAppUser?.FirstName,
                        FirstName = appUser?.FirstName,
                        MiddleName = careGiverAppUser?.MiddleName ?? clientAppUser?.MiddleName,
                        LastName = appUser?.LastName,
                        // Use PhoneNo from caregiver if available; otherwise, fallback to a default or null
                        PhoneNo = careGiverAppUser?.PhoneNo ?? clientAppUser?.PhoneNo ?? "Not Provided",
                        // Use HomeAddress from client if available; otherwise, fallback to a default or null
                        HomeAddress = clientAppUser?.HomeAddress ?? careGiverAppUser?.HomeAddress ?? "Not Provided",

                        

                        Role = appUser.Role,
                        Password = appUser.Password,
                        CreatedAt = appUser.CreatedAt,
                    };

                    return appUserDetails;
                }
            }

            
          
            return null;
        }



    }
}
