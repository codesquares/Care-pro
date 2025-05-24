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
using Infrastructure.Services;
using Application.Interfaces.Authentication;
using Application.Interfaces.Email;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

namespace Infrastructure.Content.Services
{
    public class ClientService : IClientService
    {
        private readonly CareProDbContext careProDbContext;
        private readonly ITokenHandler tokenHandler;
        private readonly IEmailService emailService;
        private readonly IConfiguration configuration;

        public ClientService(CareProDbContext careProDbContext, ITokenHandler tokenHandler, IEmailService emailService, IConfiguration configuration)
        {
            this.careProDbContext = careProDbContext;
            this.tokenHandler = tokenHandler;
            this.emailService = emailService;
            this.configuration = configuration;
        }

        public async Task<ClientDTO> CreateClientUserAsync(AddClientUserRequest addClientUserRequest)
        {
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(addClientUserRequest.Password);

            var clientUserExist = await careProDbContext.CareGivers.FirstOrDefaultAsync(x => x.Email == addClientUserRequest.Email);

            if (clientUserExist != null)
            {
                throw new InvalidOperationException("User already exist, Kindly Login or use forget password!");
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
                FirstName = addClientUserRequest.FirstName,
                LastName = addClientUserRequest.LastName,

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
            var client = await careProDbContext.Clients.FirstOrDefaultAsync(x => x.Id.ToString() == clientId);

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
                PhoneNo = client.PhoneNo,
                Role = client.Role,
                Status = client.Status,
                HomeAddress = client.HomeAddress,
                
                CreatedAt = client.CreatedAt,
            };

            return clientDTO;
        }


        public async Task<IEnumerable<ClientResponse>> GetAllClientUserAsync()
        {
            var clientUsers = await careProDbContext.Clients
                .Where(x => x.Status == true && x.IsDeleted == false)
                .OrderBy(x => x.FirstName)
                .ToListAsync();

            var clientUsersDTOs = new List<ClientResponse>();

            foreach (var clientUser in clientUsers)
            {
                var clientUserDTO = new ClientResponse()
                {
                    Id = clientUser.Id.ToString(),
                    FirstName = clientUser.FirstName,
                    MiddleName = clientUser.MiddleName,
                    LastName = clientUser.LastName,
                    Email = clientUser.Email,
                    PhoneNo = clientUser.PhoneNo,
                    Role = clientUser.Role,
                    IsDeleted = clientUser.IsDeleted,
                    Status = clientUser.Status,
                    HomeAddress = clientUser.HomeAddress,
                    
                    CreatedAt = clientUser.CreatedAt,
                };
                clientUsersDTOs.Add(clientUserDTO);
            }

            return clientUsersDTOs;
        }

        public Task<string> UpdateClientUserAsync(string clientId, UpdateClientUserRequest updateClientUserRequest)
        {
            throw new NotImplementedException();
        }

        public async Task<string> SoftDeleteClientAsync(string clientId)
        {
            if (!ObjectId.TryParse(clientId, out var objectId))
            {
                throw new ArgumentException("Invalid Client ID format.");
            }

            var client = await careProDbContext.Clients.FindAsync(objectId);
            if (client == null)
            {
                throw new KeyNotFoundException($"Client with ID '{clientId}' not found.");
            }

            client.IsDeleted = true;
            client.DeletedOn = DateTime.UtcNow;

            careProDbContext.Clients.Update(client);
            await careProDbContext.SaveChangesAsync();

            return $"Client with ID '{clientId}' Availability Status Updated successfully.";
        }

        public async Task ResetPasswordAsync(ResetPasswordRequest resetPasswordRequest)
        {
            var user = await careProDbContext.AppUsers.FirstOrDefaultAsync(u => u.Email == resetPasswordRequest.Email.ToLower());

            if (user == null)
                throw new InvalidOperationException("User not found.");

            if (!BCrypt.Net.BCrypt.Verify(resetPasswordRequest.CurrentPassword, user.Password))
                throw new UnauthorizedAccessException("Current password is incorrect.");

            user.Password = BCrypt.Net.BCrypt.HashPassword(resetPasswordRequest.NewPassword);


            var client = await careProDbContext.Clients.FirstOrDefaultAsync(c => c.Email == resetPasswordRequest.Email.ToLower());
            if (client != null)
            {
                client.Password = user.Password; 
            }

            await careProDbContext.SaveChangesAsync();
        }

        public async Task GeneratePasswordResetTokenAsync(PasswordResetRequestDto passwordResetRequestDto)
        {
            var user = await careProDbContext.AppUsers.FirstOrDefaultAsync(u => u.Email == passwordResetRequestDto.Email.ToLower());

            if (user == null)
                throw new InvalidOperationException("User not found, kindly enter a registered email.");

            var token = tokenHandler.GeneratePasswordResetToken(passwordResetRequestDto.Email);

            await emailService.SendPasswordResetEmailAsync(passwordResetRequestDto.Email, token);
        }

        public async Task ResetPasswordWithJwtAsync(PasswordResetDto request)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(configuration["JwtSettings:Secret"]);

            try
            {
                var claimsPrincipal = tokenHandler.ValidateToken(request.Token, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidIssuer = configuration["JwtSettings:Issuer"],
                    ValidAudience = configuration["JwtSettings:Audience"],
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero // no extra time
                }, out _);

                //var jwtToken = (JwtSecurityToken)validatedToken;
                //var email = jwtToken.Claims.First(x => x.Type == JwtRegisteredClaimNames.Sub).Value;
                var email = claimsPrincipal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                var user = await careProDbContext.AppUsers.FirstOrDefaultAsync(u => u.Email == email);
                if (user == null)
                    throw new InvalidOperationException("User not found.");

                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                user.Password = hashedPassword;

                var client = await careProDbContext.Clients.FirstOrDefaultAsync(c => c.Email == user.Email);
                if (client != null)
                {
                    client.Password = hashedPassword;
                }

                await careProDbContext.SaveChangesAsync();
            }
            catch (Exception)
            {
                throw new UnauthorizedAccessException("Invalid or expired reset token.");
            }
        }
    }
}
