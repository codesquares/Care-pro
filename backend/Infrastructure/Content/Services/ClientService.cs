using Application.DTOs;
using Application.Interfaces.Content;
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
    public class ClientService : IClientService
    {
        private readonly CareProDbContext careProDbContext;

        public ClientService(CareProDbContext careProDbContext)
        {
            this.careProDbContext = careProDbContext;
        }

        public async Task<ClientDTO> CreateClientUserAsync(AddClientUserRequest addClientUserRequest)
        {
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(addClientUserRequest.Password);

            var clientUserExist = await careProDbContext.CareGivers.FirstOrDefaultAsync(x => x.Email == addClientUserRequest.Email);

            if (clientUserExist != null)
            {
                throw new AuthenticationException("User already exist, Kindly Login or use forget password!");
            }

            /// CONVERT DTO TO DOMAIN OBJECT            
            var clientUser = new Client
            {
                FirstName = addClientUserRequest.FirstName,
                MiddleName = addClientUserRequest.MiddleName,
                LastName = addClientUserRequest.LastName,
                Email = addClientUserRequest.Email.ToLower(),
                Password = hashedPassword,
                HomeAddress = addClientUserRequest.HomeAddress,

                // Assign new ID
                Id = ObjectId.GenerateNewId(),
                Role = Roles.Client.ToString(),
                Status = true,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
            };

            await careProDbContext.Clients.AddAsync(clientUser);

            var careProAppUser = new AppUser
            {

                Email = addClientUserRequest.Email.ToLower(),
                Password = hashedPassword,

                // Assign new ID
                Id = ObjectId.GenerateNewId(),
                AppUserId = clientUser.Id,
                Role = Roles.Client.ToString(),
                IsDeleted = false,
                CreatedAt = clientUser.CreatedAt,
            };

            await careProDbContext.AppUsers.AddAsync(careProAppUser);

            await careProDbContext.SaveChangesAsync();

            var clientUserDTO = new ClientDTO()
            {
                Id = clientUser.Id.ToString(),
                FirstName = clientUser.FirstName,
                LastName = clientUser.LastName,
                MiddleName = clientUser.MiddleName,
                Email = clientUser.Email,
                HomeAddress= clientUser.HomeAddress,
                Role = clientUser.Role,
                CreatedAt = clientUser.CreatedAt,
            };

            return clientUserDTO;
        }

        public async Task<ClientResponse> GetClientUserAsync(string clientId)
        {
            var client = await careProDbContext.CareGivers.FirstOrDefaultAsync(x => x.Id.ToString() == clientId);

            if (client == null)
            {
                throw new KeyNotFoundException($"Client with ID '{clientId}' not found.");
            }

            var clientDTO = new ClientResponse()
            {
                Id = client.Id.ToString(),
                FirstName = client.FirstName,
                MiddleName = client.MiddleName,
                LastName = client.LastName,
                Email = client.Email,
                Role = client.Role,
                Status = client.Status,
                HomeAddress = client.HomeAddress,
                
                CreatedAt = client.CreatedAt,
            };

            return clientDTO;
        }
    }
}
