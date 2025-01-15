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

namespace Infrastructure.Content.Services
{
    public class GigServices : IGigServices
    {
        private readonly CareProDbContext careProDbContext;

        public GigServices(CareProDbContext careProDbContext)
        {
            this.careProDbContext = careProDbContext;
        }

        public async Task<GigDTO> CreateGigAsync(AddGigRequest addGigRequest)
        {
            var gigExist = await careProDbContext.Gigs.FirstOrDefaultAsync(x => x.CaregiverId == addGigRequest.CaregiverId && x.Title == addGigRequest.Title && x.Category == addGigRequest.Category);

            if (gigExist != null)
            {
                throw new AuthenticationException("This Gig already exist");
            }

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
                Image1 = addGigRequest.Image1,
                Image2 = addGigRequest.Image2,
                Image3 = addGigRequest.Image3,
                VideoURL = addGigRequest.VideoURL,
                Status = addGigRequest.Status,
                CaregiverId = addGigRequest.CaregiverId,

                // Assign new ID
                Id = ObjectId.GenerateNewId(),
                
                CreatedAt = DateTime.Now,
            };

            await careProDbContext.Gigs.AddAsync(gig);

            await careProDbContext.SaveChangesAsync();

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
                Image1 = gig.Image1,
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
                    Image1 = gig.Image1,
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
                    Image1 = gig.Image1,
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
                Image1 = gig.Image1,
                Image2 = gig.Image2,
                Image3 = gig.Image3,
                VideoURL = gig.VideoURL,
                Status = gig.Status,
                CaregiverId = gig.CaregiverId,
                CreatedAt = gig.CreatedAt,
            };

            return gigDTO;
        }
    }
}
