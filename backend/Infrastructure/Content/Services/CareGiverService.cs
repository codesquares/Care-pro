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
               // Role = Roles.Caregiver.ToString(),
                Role = addCaregiverRequest.Role,
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
                //Role = Roles.Caregiver.ToString(),
                Role = caregiver.Role,
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

        public async Task<IEnumerable<CaregiverResponse>> GetAllCaregiverUserAsync()
        {
            var caregivers = await careProDbContext.CareGivers
                .Where(x => x.Status == true && x.IsDeleted == false)
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();

            var caregiversDTOs = new List<CaregiverResponse>();

            foreach (var caregiver in caregivers)
            {
                var caregiverDTO = new CaregiverResponse()
                {
                    Id = caregiver.Id.ToString(),
                    FirstName = caregiver.FirstName,
                    MiddleName = caregiver.MiddleName,
                    LastName = caregiver.LastName,
                    Email = caregiver.Email,
                    PhoneNo = caregiver.PhoneNo,
                    Role = caregiver.Role,
                    IsDeleted = caregiver.IsDeleted,
                    Status = caregiver.Status,
                    HomeAddress = caregiver.HomeAddress,
                    Introduction = caregiver.Introduction,
                    Description = caregiver.Description,
                    Services = caregiver.Services,
                    Location = caregiver.Location,
                    //CertificationIDs = caregiver.CertificationIDs,
                    IntroVideoUrl = caregiver.IntroVideoUrl,
                    CreatedAt = caregiver.CreatedAt,
                };
                caregiversDTOs.Add(caregiverDTO);
            }

            return caregiversDTOs;
        }

        public async Task<CaregiverResponse> GetCaregiverUserAsync(string caregiverId)
        {
            var caregiver = await careProDbContext.CareGivers.FirstOrDefaultAsync(x => x.Id.ToString() == caregiverId);

            if (caregiver == null)
            {
                throw new KeyNotFoundException($"Caregiver with ID '{caregiverId}' not found.");
            }

            var caregiverDTO = new CaregiverResponse()
            {
                Id = caregiver.Id.ToString(),
                FirstName = caregiver.FirstName,
                MiddleName = caregiver.MiddleName,
                LastName = caregiver.LastName,
                Email = caregiver.Email,
                PhoneNo = caregiver.PhoneNo,
                Role = caregiver.Role,
                IsDeleted = caregiver.IsDeleted,
                Status = caregiver.Status,
                HomeAddress = caregiver.HomeAddress,
                Introduction = caregiver.Introduction,
                Description = caregiver.Description,
                Services = caregiver.Services,
                Location = caregiver.Location,
                //CertificationIDs = caregiver.CertificationIDs,
                IntroVideoUrl = caregiver.IntroVideoUrl,
                CreatedAt = caregiver.CreatedAt,
            };

            return caregiverDTO;
        }

        public async Task<string> UpdateCaregiverInfornmationAsync(string caregiverId, UpdateCaregiverAdditionalInfoRequest updateCaregiverAdditionalInfoRequest)
        {
            try
            {
                var existingCareGiver = await careProDbContext.CareGivers.FindAsync(caregiverId);

                if (existingCareGiver == null)
                {
                    throw new KeyNotFoundException($"Caregiver with ID '{caregiverId}' not found.");
                }

                existingCareGiver.Introduction = updateCaregiverAdditionalInfoRequest.Introduction;
                existingCareGiver.Description = updateCaregiverAdditionalInfoRequest.Description;
                existingCareGiver.Location = updateCaregiverAdditionalInfoRequest.Location;
                existingCareGiver.IntroVideoUrl = updateCaregiverAdditionalInfoRequest.IntroVideoUrl;
                existingCareGiver.Services = updateCaregiverAdditionalInfoRequest.Services;

                careProDbContext.CareGivers.Update(existingCareGiver);
                await careProDbContext.SaveChangesAsync();

                return $"Caregiver with ID '{caregiverId}' Additional Information Updated successfully.";
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);               
            }
        }
    }
}
