using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain;
using Infrastructure.Content.Data;
using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Authentication;
using System.Text;
using System.Threading.Tasks;
using System.Threading;
using Application.Interfaces.Content;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Content.Services
{
    public class GigServices : IGigServices
    {
        private readonly CareProDbContext careProDbContext;
        private readonly ICareGiverService careGiverService;
        private readonly ILogger<GigServices> logger;

        public GigServices(CareProDbContext careProDbContext, ICareGiverService careGiverService, ILogger<GigServices> logger)
        {
            this.careProDbContext = careProDbContext;
            this.careGiverService = careGiverService;
            this.logger = logger;
        }

        public async Task<GigDTO> CreateGigAsync(AddGigRequest addGigRequest)
        {
            var gigExist = await careProDbContext.Gigs.FirstOrDefaultAsync(x => x.CaregiverId == addGigRequest.CaregiverId && x.Title == addGigRequest.Title && x.Category == addGigRequest.Category);

            if (gigExist != null)
            {
                throw new ArgumentException("This Gig already exist");
            }

            var careGiver = await careGiverService.GetCaregiverUserAsync(addGigRequest.CaregiverId);
            if (careGiver == null)
            {
                throw new KeyNotFoundException("The CaregiverID entered is not a Valid ID");
            }

            /// Check if caregiver select a category or sub-category before creating a gig
            if (string.IsNullOrWhiteSpace(addGigRequest.Category) || addGigRequest.SubCategory == null || !addGigRequest.SubCategory.Any(s => !string.IsNullOrWhiteSpace(s)))
            {
                throw new ArgumentException("At least A Service and Sub-Category must be selected before you create a new Gig");
            }

            //// Convert the IFormFile to a byte array
            //using var memoryStream = new MemoryStream();
            //await addGigRequest.Image1.CopyToAsync(memoryStream);
            //var imageBytes = memoryStream.ToArray();

            // Convert the Base 64 string to a byte array
            var imageBytes = Convert.FromBase64String(addGigRequest.Image1);

            

            /// CONVERT DTO TO DOMAIN OBJECT            
            var gig = new Gig
            {
                Title = addGigRequest.Title,
                Category = addGigRequest.Category,
               // SubCategory = addGigRequest.SubCategory,
                SubCategory = string.Join(",", addGigRequest.SubCategory
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim())),

                Tags = addGigRequest.Tags,
                PackageType = addGigRequest.PackageType,
                PackageName = addGigRequest.PackageName,
                
                PackageDetails = addGigRequest.PackageDetails
                        .Split(';', StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => x.Trim())
                        .ToList(),
                DeliveryTime = addGigRequest.DeliveryTime,
                Price = addGigRequest.Price,
                Image1 = imageBytes,
                //Image2 = addGigRequest.Image2,
                //Image3 = addGigRequest.Image3,
                VideoURL = addGigRequest.VideoURL,
                Status = addGigRequest.Status,
                CaregiverId = addGigRequest.CaregiverId,

                // Assign new ID
                Id = ObjectId.GenerateNewId(),
                IsUpdatedToPause = false,
                CreatedAt = DateTime.Now,
            };

            await careProDbContext.Gigs.AddAsync(gig);

            await careProDbContext.SaveChangesAsync();

            //// Determine the image format based on the binary data
            //string logoBase64 = null;
            //if (gig.Image1 != null)
            //{
            //    string imageFormat = GetImageFormat(gig.Image1);  // This method detects the image format
            //    logoBase64 = $"data:image/{imageFormat};base64,{Convert.ToBase64String(gig.Image1)}";
            //}

            var gigDTO = new GigDTO()
            {
                Id = gig.Id.ToString(),
                Title = gig.Title,
                Category= gig.Category,
                SubCategory= gig.SubCategory
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.Trim())
                    .ToList(),
                Tags= gig.Tags,
                PackageType= gig.PackageType,
                PackageName= gig.PackageName,
                PackageDetails= gig.PackageDetails,
                DeliveryTime= gig.DeliveryTime,
                Price = gig.Price,
                //Image1 = gig.Image1,
                Image2 = gig.Image2,
                Image3 = gig.Image3,
                VideoURL = gig.VideoURL,
                Status = gig.Status,
                CaregiverId = gig.CaregiverId,
                CreatedAt = gig.CreatedAt,
            };

            return gigDTO;
        }

        public async Task<IEnumerable<GigDTO>> GetAllCaregiverDraftGigsAsync(string caregiverId)
        {
            var caregiver = await careGiverService.GetCaregiverUserAsync(caregiverId);

            var gigs = await careProDbContext.Gigs
                .Where(x => x.CaregiverId == caregiverId && x.Status == "Draft")
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();

            var gigsDTOs = new List<GigDTO>();

            foreach (var gig in gigs)
            {
                // Determine the image format based on the binary data
                string logoBase64 = null;
                if (gig.Image1 != null)
                {
                    string imageFormat = GetImageFormat(gig.Image1);  // This method detects the image format
                    logoBase64 = $"data:image/{imageFormat};base64,{Convert.ToBase64String(gig.Image1)}";
                }

                var gigDTO = new GigDTO()
                {
                    Id = gig.Id.ToString(),
                    Title = gig.Title,

                    Category = gig.Category,
                    //SubCategory = gig.SubCategory,
                    SubCategory = gig.SubCategory
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => x.Trim())
                        .ToList(),
                    Tags = gig.Tags,
                    PackageType = gig.PackageType,
                    PackageName = gig.PackageName,
                    PackageDetails = gig.PackageDetails,
                    DeliveryTime = gig.DeliveryTime,
                    Price = gig.Price,
                    Image1 = logoBase64,
                    Image2 = gig.Image2,
                    Image3 = gig.Image3,
                    //VideoURL = gig.VideoURL,
                    VideoURL = caregiver.IntroVideo,
                    Status = gig.Status,
                    CaregiverId = gig.CaregiverId,
                    CreatedAt = gig.CreatedAt,

                };
                gigsDTOs.Add(gigDTO);
            }

            return gigsDTOs;
        }

        public async Task<IEnumerable<GigDTO>> GetAllCaregiverGigsAsync(string caregiverId)
        {
            var caregiver = await careGiverService.GetCaregiverUserAsync(caregiverId);

            if (caregiver == null)
            {
                throw new KeyNotFoundException($"Caregiver with ID:{caregiverId} Not found");
            }


            var gigs = await careProDbContext.Gigs
                .Where(x => x.CaregiverId == caregiverId)
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();

            var gigsDTOs = new List<GigDTO>();

            foreach (var gig in gigs)
            {
                // Determine the image format based on the binary data
                string logoBase64 = null;
                if (gig.Image1 != null)
                {
                    string imageFormat = GetImageFormat(gig.Image1);  // This method detects the image format
                    logoBase64 = $"data:image/{imageFormat};base64,{Convert.ToBase64String(gig.Image1)}";
                }

                var gigDTO = new GigDTO()
                {
                    Id = gig.Id.ToString(),
                    Title = gig.Title,

                    Category = gig.Category,
                    //SubCategory = gig.SubCategory,
                    SubCategory = gig.SubCategory
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => x.Trim())
                        .ToList(),
                    Tags = gig.Tags,
                    PackageType = gig.PackageType,
                    PackageName = gig.PackageName,
                    PackageDetails = gig.PackageDetails,
                    DeliveryTime = gig.DeliveryTime,
                    Price = gig.Price,
                    Image1 = logoBase64,
                    Image2 = gig.Image2,
                    Image3 = gig.Image3,
                    //VideoURL = gig.VideoURL,
                    VideoURL = caregiver.IntroVideo,
                    Status = gig.Status,
                    CaregiverId = gig.CaregiverId,
                    CreatedAt = gig.CreatedAt,
                    
                };
                gigsDTOs.Add(gigDTO);
            }

            return gigsDTOs;
        }

        public async Task<IEnumerable<GigDTO>> GetAllCaregiverPausedGigsAsync(string caregiverId)
        {
            var gigs = await careProDbContext.Gigs
                .Where(x => x.CaregiverId == caregiverId && x.Status == "Paused")
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();

            var gigsDTOs = new List<GigDTO>();

            foreach (var gig in gigs)
            {
                // Determine the image format based on the binary data
                string logoBase64 = null;
                if (gig.Image1 != null)
                {
                    string imageFormat = GetImageFormat(gig.Image1);  // This method detects the image format
                    logoBase64 = $"data:image/{imageFormat};base64,{Convert.ToBase64String(gig.Image1)}";
                }

                var gigDTO = new GigDTO()
                {
                    Id = gig.Id.ToString(),
                    Title = gig.Title,

                    Category = gig.Category,
                    //SubCategory = gig.SubCategory,
                    SubCategory = gig.SubCategory
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => x.Trim())
                        .ToList(),
                    Tags = gig.Tags,
                    PackageType = gig.PackageType,
                    PackageName = gig.PackageName,
                    PackageDetails = gig.PackageDetails,
                    DeliveryTime = gig.DeliveryTime,
                    Price = gig.Price,
                    Image1 = logoBase64,
                    Image2 = gig.Image2,
                    Image3 = gig.Image3,
                    VideoURL = gig.VideoURL,
                    Status = gig.Status,
                    CaregiverId = gig.CaregiverId,
                    CreatedAt = gig.CreatedAt,
                    UpdatedOn = gig.UpdatedOn,
                    IsUpdatedToPause = gig.IsUpdatedToPause,

                };
                gigsDTOs.Add(gigDTO);
            }

            return gigsDTOs;
        }

        public async Task<IEnumerable<GigDTO>> GetAllGigsAsync()
        {
            var gigs = await careProDbContext.Gigs
                .Where(x => x.Status == "Published" || x.Status == "Active")
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();

            var gigDTOs = new List<GigDTO>();

            foreach (var gig in gigs)
            {
                // Determine the image format based on the binary data
                string logoBase64 = null;
                if (gig.Image1 != null)
                {
                    string imageFormat = GetImageFormat(gig.Image1);  // This method detects the image format
                    logoBase64 = $"data:image/{imageFormat};base64,{Convert.ToBase64String(gig.Image1)}";
                }

                var serviceDTO = new GigDTO()
                {
                    Id = gig.Id.ToString(),
                    Title = gig.Title,
                    Category = gig.Category,
                    //SubCategory = gig.SubCategory,
                    SubCategory = gig.SubCategory
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => x.Trim())
                        .ToList(),
                    Tags = gig.Tags,
                    PackageType = gig.PackageType,
                    PackageName = gig.PackageName,
                    PackageDetails = gig.PackageDetails,
                    DeliveryTime = gig.DeliveryTime,
                    Price = gig.Price,
                    Image1 = logoBase64,
                    Image2 = gig.Image2,
                    Image3 = gig.Image3,
                    VideoURL = gig.VideoURL,
                    Status = gig.Status,
                    CaregiverId = gig.CaregiverId,
                    UpdatedOn = gig.UpdatedOn,
                    IsUpdatedToPause = gig.IsUpdatedToPause,
                    CreatedAt = gig.CreatedAt,
                };
                gigDTOs.Add(serviceDTO);
            }

            return gigDTOs;
        }



        public async Task<List<string>> GetAllSubCategoriesForCaregiverAsync(string caregiverId)
        {
            var subCategories = await careProDbContext.Gigs
                .Where(x => (x.Status == "Published" || x.Status == "Active") && x.CaregiverId == caregiverId)
                .Select(x => x.SubCategory)
                .ToListAsync();

            var allSubCategories = subCategories
                .Where(sc => !string.IsNullOrEmpty(sc))
                .SelectMany(sc => sc.Split(',', StringSplitOptions.RemoveEmptyEntries))
                .Select(sc => sc.Trim())
                .Distinct()
                .ToList();

            return allSubCategories;
        }


        public async Task<GigDTO> GetGigAsync(string gigId)
        {
            

            var gig = await careProDbContext.Gigs.FirstOrDefaultAsync(x => x.Id.ToString() == gigId);

            if (gig == null)
            {
                throw new KeyNotFoundException($"Gig with ID '{gigId}' not found.");
            }

            var caregiver = await careGiverService.GetCaregiverUserAsync(gig.CaregiverId);

            if (caregiver == null)
            {
                throw new KeyNotFoundException($"Caregiver with ID:{gig.CaregiverId} Not found");
            }


            // Determine the image format based on the binary data
            string logoBase64 = null;
            if (gig.Image1 != null)
            {
                string imageFormat = GetImageFormat(gig.Image1);  // This method detects the image format
                logoBase64 = $"data:image/{imageFormat};base64,{Convert.ToBase64String(gig.Image1)}";
            }

            var gigDTO = new GigDTO()
            {
                Id = gig.Id.ToString(),
                Title = gig.Title,
                Category = gig.Category,
                //SubCategory = gig.SubCategory,
                SubCategory = gig.SubCategory
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => x.Trim())
                        .ToList(),
                Tags = gig.Tags,
                PackageType = gig.PackageType,
                PackageName = gig.PackageName,
                PackageDetails = gig.PackageDetails,
                DeliveryTime = gig.DeliveryTime,
                Price = gig.Price,
                Image1 = logoBase64,
                Image2 = gig.Image2,
                Image3 = gig.Image3,
                //VideoURL = gig.VideoURL,
                VideoURL = caregiver.IntroVideo,
                Status = gig.Status,
                CaregiverId = gig.CaregiverId,
                CaregiverName = caregiver.FirstName + " " + caregiver.LastName,
                UpdatedOn = gig.UpdatedOn,
                IsUpdatedToPause = gig.IsUpdatedToPause,
                CreatedAt = gig.CreatedAt,
            };

            return gigDTO;
        }

        public async Task<string> UpdateGigStatusToPauseAsync(string gigId, UpdateGigStatusToPauseRequest updateGigStatusToPauseRequest)
        {
            try
            {
                if (!ObjectId.TryParse(gigId, out var objectId))
                {
                    throw new ArgumentException("Invalid Gig ID format.");
                }

                var existingGig = await careProDbContext.Gigs.FindAsync(objectId);

                if (existingGig == null)
                {
                    throw new KeyNotFoundException($"Gig with ID '{gigId}' not found.");
                }


                //var existingGig = await careProDbContext.Gigs.FindAsync(gigId);

                //if (existingGig == null)
                //{
                //    throw new KeyNotFoundException($"Gigs with ID '{gigId}' not found.");
                //}


                existingGig.Status = updateGigStatusToPauseRequest.Status;
                existingGig.UpdatedOn = DateTime.Now;
                existingGig.IsUpdatedToPause = true;
                

                careProDbContext.Gigs.Update(existingGig);
                await careProDbContext.SaveChangesAsync();

                LogAuditEvent($"Gig Status updated (ID: {gigId})", updateGigStatusToPauseRequest.CaregiverId);
                return $"Gig with ID '{gigId}' updated successfully.";
            }
            catch (Exception ex)
            {
                LogException(ex);
                throw new Exception(ex.Message);
            }
        }


        public async Task<string> UpdateGigAsync(string gigId, UpdateGigRequest updateGigRequest)
        {
            if (!ObjectId.TryParse(gigId, out var objectId))
            {
                throw new ArgumentException("Invalid Gig ID format.");
            }

            var existingGig = await careProDbContext.Gigs.FindAsync(objectId);

            if (existingGig == null)
            {
                throw new KeyNotFoundException($"Gig with ID '{gigId}' not found.");
            }


            /// Check if caregiver select a category or sub-category before creating a gig
            if (string.IsNullOrWhiteSpace(updateGigRequest.Category) || updateGigRequest.SubCategory == null || !updateGigRequest.SubCategory.Any(s => !string.IsNullOrWhiteSpace(s)))
            {
                throw new ArgumentException("At least A Service and Sub-Category must be selected before you update this Gig");
            }


            if (!string.IsNullOrWhiteSpace(updateGigRequest.Image1))
            {
                try
                {
                    existingGig.Image1 = Convert.FromBase64String(updateGigRequest.Image1);
                }
                catch (FormatException)
                {
                    throw new ArgumentException("Image1 is not a valid Base64 string.");
                }
            }


            //// Convert the Base 64 string to a byte array
            //var imageBytes = Convert.FromBase64String(updateGigRequest.Image1);



            existingGig.Category = updateGigRequest.Category;
            existingGig.SubCategory = string.Join(",", updateGigRequest.SubCategory
                                        .Where(x => !string.IsNullOrWhiteSpace(x))
                                        .Select(x => x.Trim()));
            existingGig.Tags = updateGigRequest.Tags;
            existingGig.PackageType = updateGigRequest.PackageType;
            existingGig.PackageName = updateGigRequest.PackageName;
            existingGig.PackageDetails = updateGigRequest.PackageDetails
                                        .Split(';', StringSplitOptions.RemoveEmptyEntries)
                                                .Select(x => x.Trim())
                                                .ToList();
            existingGig.DeliveryTime = updateGigRequest.DeliveryTime;
            existingGig.Price = updateGigRequest.Price;
           // existingGig.Image1 = imageBytes;
            existingGig.UpdatedOn = DateTime.Now;
            

            careProDbContext.Gigs.Update(existingGig);
            await careProDbContext.SaveChangesAsync();

            LogAuditEvent($"Gig with (ID: {gigId}) successfully updated", updateGigRequest.CaregiverId);
            return $"Gig with ID '{gigId}' updated successfully.";

        }

        public string GetImageFormat(byte[] imageData)
        {
            // Basic detection of common image formats based on header bytes
            if (imageData.Length >= 4)
            {
                // PNG: 89 50 4E 47
                if (imageData[0] == 0x89 && imageData[1] == 0x50 && imageData[2] == 0x4E && imageData[3] == 0x47)
                    return "png";

                // JPEG/JPG: FF D8 FF
                if (imageData[0] == 0xFF && imageData[1] == 0xD8 && imageData[2] == 0xFF)
                    return "jpeg";

                // GIF: 47 49 46
                if (imageData[0] == 0x47 && imageData[1] == 0x49 && imageData[2] == 0x46)
                    return "gif";
            }
            return "jpeg";  // Default to jpeg if format is not identifiable
        }


        private void LogException(Exception ex)
        {
            logger.LogError(ex, "Exception occurred");
        }

        private void LogAuditEvent(object message, string? caregiverId)
        {
            logger.LogInformation($"Audit Event: {message}. User ID: {caregiverId}. Timestamp: {DateTime.UtcNow}");
        }

        
    }
}