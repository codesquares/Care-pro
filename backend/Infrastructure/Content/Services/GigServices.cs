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

namespace Infrastructure.Content.Services
{
    public class GigServices : IGigServices
    {
        private readonly CareProDbContext careProDbContext;
        private readonly ICareGiverService careGiverService;

        public GigServices(CareProDbContext careProDbContext, ICareGiverService careGiverService)
        {
            this.careProDbContext = careProDbContext;
            this.careGiverService = careGiverService;
        }

        public async Task<GigDTO> CreateGigAsync(AddGigRequest addGigRequest)
        {
            var gigExist = await careProDbContext.Gigs.FirstOrDefaultAsync(x => x.CaregiverId == addGigRequest.CaregiverId && x.Title == addGigRequest.Title && x.Category == addGigRequest.Category);

            if (gigExist != null)
            {
                throw new AuthenticationException("This Gig already exist");
            }

            var careGiver = await careGiverService.GetCaregiverUserAsync(addGigRequest.CaregiverId);
            if (careGiver != null)
            {
                throw new AuthenticationException("The CaregiverID entered is not a Valid ID");
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
                SubCategory = addGigRequest.SubCategory,
                Tags = addGigRequest.Tags,
                PackageType = addGigRequest.PackageType,
                PackageName = addGigRequest.PackageName,
                PackageDetails = addGigRequest.PackageDetails,
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
                SubCategory= gig.SubCategory,
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

        public async Task<IEnumerable<GigDTO>> GetAllCaregiverGigsAsync(string caregiverId)
        {
            var gigs = await careProDbContext.Gigs
                .Where(x => x.CaregiverId == caregiverId)
                .OrderBy(x => x.Title)
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
                    SubCategory = gig.SubCategory,
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
                    
                };
                gigsDTOs.Add(gigDTO);
            }

            return gigsDTOs;
        }

        public async Task<IEnumerable<GigDTO>> GetAllGigsAsync()
        {
            var gigs = await careProDbContext.Gigs
               // .Where(x => x.CaregiverId == caregiverId)
                .OrderBy(x => x.PackageType)
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
                    SubCategory = gig.SubCategory,
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
                };
                gigDTOs.Add(serviceDTO);
            }

            return gigDTOs;
        }

        public async Task<GigDTO> GetGigAsync(string gigId)
        {
            var gig = await careProDbContext.Gigs.FirstOrDefaultAsync(x => x.Id.ToString() == gigId);

            if (gig == null)
            {
                throw new KeyNotFoundException($"Gig with ID '{gigId}' not found.");
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
                SubCategory = gig.SubCategory,
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
            };

            return gigDTO;
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
    }
}
