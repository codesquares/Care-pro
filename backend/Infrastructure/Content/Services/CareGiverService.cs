using Application.DTOs;
using Application.Interfaces.Content;
using Domain;
using Domain.Entities;
using Infrastructure.Content.Data;
using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Authentication;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Content.Services
{
    public class CareGiverService : ICareGiverService
    {
        private readonly CareProDbContext careProDbContext;

        public CareGiverService(CareProDbContext careProDbContext)
        {
            this.careProDbContext = careProDbContext;
        }

        public async Task<CaregiverDTO> CreateCaregiverUserAsync(AddCaregiverRequest addCaregiverRequest)
        {
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(addCaregiverRequest.Password);

            var caregiverUserExist = await careProDbContext.CareGivers.FirstOrDefaultAsync(x => x.Email == addCaregiverRequest.Email);

            if (caregiverUserExist != null)
            {
                throw new AuthenticationException("User already exist, Kindly Login or use forget password!");
            }

            /// CONVERT DTO TO DOMAIN OBJECT            
            var caregiver = new Caregiver
            {
                FirstName = addCaregiverRequest.FirstName,
                MiddleName = addCaregiverRequest.MiddleName,
                LastName = addCaregiverRequest.LastName,
                Email = addCaregiverRequest.Email.ToLower(),
                PhoneNo = addCaregiverRequest.PhoneNo,
                Password = hashedPassword,

                // Assign new ID
                Id = ObjectId.GenerateNewId(),
                Role = Roles.Caregiver.ToString(),
                Status = true,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
            };

            await careProDbContext.CareGivers.AddAsync(caregiver);

            var careProAppUser = new AppUser
            {

                Email = addCaregiverRequest.Email.ToLower(),
                Password = hashedPassword,

                // Assign new ID
                Id = ObjectId.GenerateNewId(),
                AppUserId = caregiver.Id,
                Role = Roles.Caregiver.ToString(),
                IsDeleted = false,
                CreatedAt = caregiver.CreatedAt,
            };

            await careProDbContext.AppUsers.AddAsync(careProAppUser);

            await careProDbContext.SaveChangesAsync();

            var careGiverUserDTO = new CaregiverDTO()
            {
                Id = caregiver.Id.ToString(),
                FirstName = caregiver.FirstName,
                LastName = caregiver.LastName,
                MiddleName = caregiver.MiddleName,
                Email = caregiver.Email,
                PhoneNo = caregiver.PhoneNo,
                Role = caregiver.Role,
                CreatedAt = caregiver.CreatedAt,
            };

            return careGiverUserDTO;
        }
    }
}
