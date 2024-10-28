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

        public async Task<Caregiver> AddCaregiverUserAsync(AddCaregiverRequest addCaregiverRequest)
        {
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(addCaregiverRequest.Password);

            var caregiverUserExist = await careProDbContext.CareGivers.FirstOrDefaultAsync(x => x.Email == addCaregiverRequest.Email);

            if (caregiverUserExist != null)
            {
                throw new AuthenticationException("User already exist, Kindly Login or use forget password!");
            }

            /// CONVERT DTO TO DOMAIN OBJECT            
            var caregiverUserDomain = new Caregiver
            {
                FirstName = addCaregiverRequest.FirstName,
                MiddleName = addCaregiverRequest.MiddleName,
                LastName = addCaregiverRequest.LastName,
                Email = addCaregiverRequest.Email.ToLower(),
                Password = hashedPassword,
                
                // Assign new ID
                Role = Roles.Caregiver.ToString(),
                Status = true,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
            };

            await careProDbContext.CareGivers.AddAsync(caregiverUserDomain);
            await careProDbContext.SaveChangesAsync();

            return caregiverUserDomain;

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
