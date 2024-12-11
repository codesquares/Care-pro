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
    public class ServiceServices : IServiceServices
    {
        private readonly CareProDbContext careProDbContext;

        public ServiceServices(CareProDbContext careProDbContext)
        {
            this.careProDbContext = careProDbContext;
        }

        public async Task<ServiceDTO> CreateServiceAsync(AddServiceRequest addServiceRequest)
        {
            var serviceExist = await careProDbContext.Services.FirstOrDefaultAsync(x => x.CaregiverId == addServiceRequest.CaregiverId && x.Title == addServiceRequest.Title && x.ServiceCategory == addServiceRequest.ServiceCategory);

            if (serviceExist != null)
            {
                throw new AuthenticationException("This Service already exist");
            }

            /// CONVERT DTO TO DOMAIN OBJECT            
            var service = new Service
            {
                Title = addServiceRequest.Title,
                Description = addServiceRequest.Description,
                //Image = addServiceRequest.Image,
                Pricing = addServiceRequest.Pricing,
                ServiceWorkItems = addServiceRequest.ServiceWorkItems,
                Location = addServiceRequest.Location,
                ServiceCategory = addServiceRequest.ServiceCategory,
                CaregiverId = addServiceRequest.CaregiverId,

                // Assign new ID
                Id = ObjectId.GenerateNewId(),
                
                CreatedAt = DateTime.Now,
            };

            await careProDbContext.Services.AddAsync(service);

            await careProDbContext.SaveChangesAsync();

            var serviceDTO = new ServiceDTO()
            {
                Id = service.Id.ToString(),
                Title = service.Title,
                Description= service.Description,
                //Image = service.Image,
                Pricing = service.Pricing,
                ServiceWorkItems = service.ServiceWorkItems,
                Location = service.Location,
                ServiceCategory = service.ServiceCategory,
                CaregiverId = service.CaregiverId,
                CreatedAt = service.CreatedAt,
            };

            return serviceDTO;
        }

        public async Task<IEnumerable<ServiceDTO>> GetAllCaregiverServicesAsync(string caregiverId)
        {
            var services = await careProDbContext.Services
                .Where(x => x.CaregiverId == caregiverId)
                .OrderBy(x => x.Title)
                .ToListAsync();

            var serviceDTOs = new List<ServiceDTO>();

            foreach (var service in services)
            {
                var serviceDTO = new ServiceDTO()
                {
                    Id = service.Id.ToString(),
                    Title = service.Title,
                    Description = service.Description,
                    Pricing = service.Pricing,
                    ServiceWorkItems = service.ServiceWorkItems,
                    Location = service.Location,
                    ServiceCategory = service.ServiceCategory,
                    CaregiverId= service.CaregiverId,
                    //Image = service.Image,
                };
                serviceDTOs.Add(serviceDTO);
            }

            return serviceDTOs;
        }

        public async Task<IEnumerable<ServiceDTO>> GetAllServicesAsync()
        {
            var services = await careProDbContext.Services
               // .Where(x => x.CaregiverId == caregiverId)
                .OrderBy(x => x.Pricing)
                .ToListAsync();

            var serviceDTOs = new List<ServiceDTO>();

            foreach (var service in services)
            {
                var serviceDTO = new ServiceDTO()
                {
                    Id = service.Id.ToString(),
                    Title = service.Title,
                    Description = service.Description,
                    Pricing = service.Pricing,
                    ServiceWorkItems = service.ServiceWorkItems,
                    Location = service.Location,
                    ServiceCategory = service.ServiceCategory,
                    CaregiverId = service.CaregiverId,
                    //Image = service.Image,
                };
                serviceDTOs.Add(serviceDTO);
            }

            return serviceDTOs;
        }

        public async Task<ServiceDTO> GetServiceAsync(string serviceId)
        {
            var service = await careProDbContext.Services.FirstOrDefaultAsync(x => x.Id.ToString() == serviceId);

            if (service == null)
            {
                throw new KeyNotFoundException($"Service with ID '{serviceId}' not found.");
            }

            var serviceDTO = new ServiceDTO()
            {
                Id = service.Id.ToString(),
                Title = service.Title,
                Description = service.Description,
                Pricing = service.Pricing,
                ServiceWorkItems = service.ServiceWorkItems,
                Location = service.Location,
                ServiceCategory = service.ServiceCategory,
                CaregiverId = service.CaregiverId,
                //Image = service.Image,
            };

            return serviceDTO;
        }
    }
}
