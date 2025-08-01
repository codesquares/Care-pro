using Application.DTOs;
using Application.DTOs.Email;
using Application.Interfaces;
using Application.Interfaces.Authentication;
using Application.Interfaces.Content;
using Application.Interfaces.Email;
using Domain;
using Domain.Entities;
using Infrastructure.Content.Data;
using Infrastructure.Services;
using Microsoft.AspNet.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages;
using MongoDB.Bson;
using NuGet.Common;
using System;
using System.Buffers.Text;
using System.Collections.Generic;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Authentication;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using static NuGet.Packaging.PackagingConstants;
using static Org.BouncyCastle.Math.EC.ECCurve;

namespace Infrastructure.Content.Services
{
    public class CareGiverService : ICareGiverService
    {
        private readonly CareProDbContext careProDbContext;
        private readonly CloudinaryService cloudinaryService;
        private readonly ITokenHandler tokenHandler;
        private readonly IEmailService emailService;
        private readonly IConfiguration configuration;
        

        public CareGiverService(CareProDbContext careProDbContext, CloudinaryService cloudinaryService, ITokenHandler tokenHandler, IEmailService emailService, IConfiguration configuration)
        {
            this.careProDbContext = careProDbContext;
            this.cloudinaryService = cloudinaryService;
            this.tokenHandler = tokenHandler;
            this.emailService = emailService;
            this.configuration = configuration;
           
        }

        private bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                email = Regex.Replace(email, @"(@)(.+)$", DomainMapper, RegexOptions.None, TimeSpan.FromMilliseconds(200));

                // Examines the domain part of the email and normalizes it.
                string DomainMapper(Match match)
                {
                    var idn = new IdnMapping();
                    var domainName = idn.GetAscii(match.Groups[2].Value);
                    return match.Groups[1].Value + domainName;
                }
            }
            catch
            {
                return false;
            }

            try
            {
                return Regex.IsMatch(email,
                    @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
                    RegexOptions.IgnoreCase, TimeSpan.FromMilliseconds(250));
            }
            catch
            {
                return false;
            }
        }




        public async Task<CaregiverDTO> CreateCaregiverUserAsync(AddCaregiverRequest addCaregiverRequest, string? origin)
        {
            if (addCaregiverRequest.Role != "Caregiver")
            {
                throw new InvalidOperationException("This Service can only be used to create a user with Caregiver Role!");
            }

            if (!IsValidEmail(addCaregiverRequest.Email))
            {
                throw new InvalidOperationException("Please enter a valid email address.");
            }


            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(addCaregiverRequest.Password);

            var caregiverUserExist = await careProDbContext.CareGivers.FirstOrDefaultAsync(x => x.Email == addCaregiverRequest.Email);

            if (caregiverUserExist != null)
            {
                throw new InvalidOperationException("User already exists. Kindly login or use 'Forgot Password'!");
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

                IsAvailable = false,

                CreatedAt = DateTime.Now,
            };

            await careProDbContext.CareGivers.AddAsync(caregiver);

            var careProAppUser = new AppUser
            {

                Email = addCaregiverRequest.Email.ToLower(),
                Password = hashedPassword,
                FirstName = addCaregiverRequest.FirstName,
                LastName = addCaregiverRequest.LastName,

                // Assign new ID
                Id = ObjectId.GenerateNewId(),
                AppUserId = caregiver.Id,
                //Role = Roles.Caregiver.ToString(),
                Role = caregiver.Role,
                EmailConfirmed = false,
                IsDeleted = false,
                CreatedAt = caregiver.CreatedAt,
            };

            await careProDbContext.AppUsers.AddAsync(careProAppUser);

            await careProDbContext.SaveChangesAsync();


            #region SendVerificationEmail
                        
            var jwtSecretKey = configuration["JwtSettings:Secret"];
            var token = tokenHandler.GenerateEmailVerificationToken(
                careProAppUser.AppUserId.ToString(),
                careProAppUser.Email,
                jwtSecretKey // inject or get from config
            );
            var verificationLink = $"{origin}/verify-email?token={token}";

            await emailService.SendSignUpVerificationEmailAsync(
                careProAppUser.Email,
                verificationLink,
                careProAppUser.FirstName + " " + careProAppUser.LastName
            );    

            #endregion SendVerificationEmail


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


                
        public async Task<string> ConfirmEmailAsync(string token)
        {
            var jwtSecret = configuration["JwtSettings:Secret"];
            if (string.IsNullOrWhiteSpace(jwtSecret))
                throw new Exception("JWT Secret not configured.");

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(jwtSecret);

            try
            {
                var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                var userId = principal.FindFirst("userId")?.Value;

                if (string.IsNullOrEmpty(userId))
                    return "Invalid token. User ID not found.";

                var user = await careProDbContext.AppUsers.FindAsync(ObjectId.Parse(userId));

                if (user == null)
                    return "User not found.";

                if (user.EmailConfirmed)
                    return "Email already confirmed.";

                user.EmailConfirmed = true;
                await careProDbContext.SaveChangesAsync();

                return $"Account confirmed for {user.Email}. You can now log in.";
            }
            catch (SecurityTokenException)
            {
                return "Token is invalid or expired.";
            }
            catch (Exception ex)
            {
                return $"An error occurred: {ex.Message}";
            }
        }


        public async Task<string> ResendEmailConfirmationAsync(string email, string? origin)
        {
            var user = await careProDbContext.AppUsers.FirstOrDefaultAsync(x => x.Email.ToLower() == email.ToLower());

            if (user == null)
                throw new Exception("User does not exist");

            if (user.EmailConfirmed)
                return "Email already confirmed";


            #region SendVerificationEmail

            //var token = tokenHandler.GenerateEmailVerificationToken(careProAppUser, jwtSecret);
            //var verificationLink = $"{origin}/verify-email?token={token}";
            var jwtSecretKey = configuration["JwtSettings:Secret"];
            var token = tokenHandler.GenerateEmailVerificationToken(
                user.AppUserId.ToString(),
                user.Email,
                jwtSecretKey // inject or get from config
            );
            var verificationLink = $"{origin}/verify-email?token={token}";

            await emailService.SendSignUpVerificationEmailAsync(
                user.Email,
                verificationLink,
                user.FirstName + " " + user.LastName
            );




            #endregion

            //    var jwtSecret = configuration["JwtSettings:Secret"];
            //    if (string.IsNullOrWhiteSpace(jwtSecret))
            //        throw new Exception("JWT Secret not configured.");
            //    // Create a new JWT email confirmation token
            //    var tokenHandler = new JwtSecurityTokenHandler();
            //    var key = Encoding.UTF8.GetBytes(jwtSecret);

            //    var tokenDescriptor = new SecurityTokenDescriptor
            //    {
            //        Subject = new ClaimsIdentity(new[]
            //        {
            //    new Claim("userId", user.AppUserId.ToString()),
            //}),
            //        Expires = DateTime.UtcNow.AddHours(24),
            //        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            //    };



            //    var jwtSecretKey = configuration["JwtSettings:Secret"];
            //    var token = tokenHandler.GenerateEmailVerificationToken(
            //        user.AppUserId.ToString(),
            //        user.Email,
            //        jwtSecretKey // inject or get from config
            //    );
            //    var verificationLink = $"{origin}/verify-email?token={token}";




            //    var token = tokenHandler.CreateToken(tokenDescriptor);
            //    var tokenString = tokenHandler.WriteToken(token);
            //    var baseUrl = ;

            //    // Generate confirmation link
            //    var confirmUrl = $"{baseUrl}/confirm-email?token={tokenString}";

            //    // Send email with the link (You should plug in your real email sending service here)
            //    await emailService.SendSignUpVerificationEmailAsync(
            //        user.Email,
            //        confirmUrl,
            //        user.FirstName
            //    );




            return "A new confirmation link has been sent to your email.";
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
                    AboutMe = caregiver.AboutMe,
                    AboutMeIntro = string.IsNullOrWhiteSpace(caregiver.AboutMe)
                    ? null
                    : caregiver.AboutMe.Length <= 150
                        ? caregiver.AboutMe
                        : caregiver.AboutMe.Substring(0, 150) + "...",
                    
                    Location = caregiver.Location,
                    ReasonForDeactivation = caregiver.ReasonForDeactivation,
                    IsAvailable = caregiver.IsAvailable,
                    IntroVideo = caregiver.IntroVideo,

                    
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

            //var services = await gigServices.GetAllSubCategoriesForCaregiverAsync(caregiverId);
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

            // var clientOrder = await clientOrderService.GetAllCaregiverOrderAsync(caregiverId);
            //var clientOrder = await careProDbContext.ClientOrders(caregiverId);
            var clientOrders = await careProDbContext.ClientOrders
               .Where(x => x.CaregiverId == caregiverId)
                .OrderBy(x => x.OrderCreatedAt)
                   .ToListAsync();

            decimal totalEarning = 0;

            foreach (var clientOrder in clientOrders)
            {
                
                totalEarning += clientOrder.Amount;                
            }


            //var totalEarning = clientOrders.TotalEarning;
           // var noOfHoursSpent = ;
            var noOfOrders = clientOrders.Count;

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
                AboutMe = caregiver.AboutMe,
                AboutMeIntro = string.IsNullOrWhiteSpace(caregiver.AboutMe)
                    ? null
                    : caregiver.AboutMe.Length <= 150
                        ? caregiver.AboutMe
                        : caregiver.AboutMe.Substring(0, 150) + "...",
                
                Location = caregiver.Location,
                ReasonForDeactivation = caregiver.ReasonForDeactivation,
                IsAvailable = caregiver.IsAvailable,
                IntroVideo = caregiver.IntroVideo,
                //IntroVideo = await cloudinaryService.DownloadVideoAsBase64Async(caregiver.IntroVideo),
                Services = allSubCategories,

                TotalEarning = totalEarning,
               // NoOfHoursSpent = noOfHoursSpent,
                NoOfOrders = noOfOrders,

                
                CreatedAt = caregiver.CreatedAt,
            };

            return caregiverDTO;
        }

        public async Task<string> SoftDeleteCaregiverAsync(string caregiverId)
        {
            if (!ObjectId.TryParse(caregiverId, out var objectId))
            {
                throw new ArgumentException("Invalid Caregiver ID format.");
            }

            var careGiver = await careProDbContext.CareGivers.FindAsync(objectId);
            if (careGiver == null)
            {
                throw new KeyNotFoundException($"Caregiver with ID '{caregiverId}' not found.");
            }

            careGiver.IsDeleted = true;
            careGiver.DeletedOn = DateTime.UtcNow;

            careProDbContext.CareGivers.Update(careGiver);
            await careProDbContext.SaveChangesAsync();

            return $"Caregiver with ID '{caregiverId}' Availability Status Updated successfully.";

        }

        public async Task<string> UpdateCaregiverAvailabilityAsync(string caregiverId, UpdateCaregiverAvailabilityRequest updateCaregiverAvailabilityRequest)
        {
            if (!ObjectId.TryParse(caregiverId, out var objectId))
            {
                throw new ArgumentException("Invalid Caregiver ID format.");
            }

            var existingCareGiver = await careProDbContext.CareGivers.FindAsync(objectId);
            if (existingCareGiver == null)
            {
                throw new KeyNotFoundException($"Caregiver with ID '{caregiverId}' not found.");
            }

            existingCareGiver.IsAvailable = updateCaregiverAvailabilityRequest.IsAvailable;
            
            careProDbContext.CareGivers.Update(existingCareGiver);
            await careProDbContext.SaveChangesAsync();

            return $"Caregiver with ID '{caregiverId}' Availability Status Updated successfully.";

            
        }

        public async Task<string> UpdateCaregiverInfornmationAsync(string caregiverId, UpdateCaregiverAdditionalInfoRequest updateCaregiverAdditionalInfoRequest)
        {
            if (updateCaregiverAdditionalInfoRequest.IntroVideo == null &&
                string.IsNullOrWhiteSpace(updateCaregiverAdditionalInfoRequest.AboutMe) &&
                string.IsNullOrWhiteSpace(updateCaregiverAdditionalInfoRequest.Location))
            
            {
                throw new ArgumentException("At least one field must be provided to update caregiver information.");
            }



            if (!ObjectId.TryParse(caregiverId, out var objectId))
            {
                throw new ArgumentException("Invalid Caregiver ID format.");
            }
                               

            var existingCareGiver = await careProDbContext.CareGivers.FindAsync(objectId);

            if (existingCareGiver == null)
            {
                throw new KeyNotFoundException($"Caregiver with ID '{caregiverId}' not found.");
            }
                        

            if (updateCaregiverAdditionalInfoRequest.IntroVideo != null)
            {
                using var memoryStream = new MemoryStream();
                await updateCaregiverAdditionalInfoRequest.IntroVideo.CopyToAsync(memoryStream);
                var videoBytes = memoryStream.ToArray();

                // Now upload imageBytes to Cloudinary
                var videoUrl = await cloudinaryService.UploadVideoAsync(videoBytes, $"intro_{existingCareGiver.FirstName}{existingCareGiver.LastName}");

                existingCareGiver.IntroVideo = videoUrl; // Save Cloudinary URL to DB
            }

            // Update AboutMe if provided
            if (!string.IsNullOrWhiteSpace(updateCaregiverAdditionalInfoRequest.AboutMe))
            {
                existingCareGiver.AboutMe = updateCaregiverAdditionalInfoRequest.AboutMe;
            }

            // Update Location if provided
            if (!string.IsNullOrWhiteSpace(updateCaregiverAdditionalInfoRequest.Location))
            {
                existingCareGiver.Location = updateCaregiverAdditionalInfoRequest.Location;
            }
                        

            careProDbContext.CareGivers.Update(existingCareGiver);
            await careProDbContext.SaveChangesAsync();

            return $"Caregiver with ID '{caregiverId}' Additional Information Updated successfully.";
            
        }


        public async Task<string> UpdateCaregiverAboutMeAsync(string caregiverId, UpdateCaregiverAdditionalInfoRequest updateCaregiverAdditionalInfoRequest)
        {
            if (updateCaregiverAdditionalInfoRequest.IntroVideo == null &&
                string.IsNullOrWhiteSpace(updateCaregiverAdditionalInfoRequest.AboutMe) &&
                string.IsNullOrWhiteSpace(updateCaregiverAdditionalInfoRequest.Location))

            {
                throw new ArgumentException("At least one field must be provided to update caregiver information.");
            }



            if (!ObjectId.TryParse(caregiverId, out var objectId))
            {
                throw new ArgumentException("Invalid Caregiver ID format.");
            }


            var existingCareGiver = await careProDbContext.CareGivers.FindAsync(objectId);

            if (existingCareGiver == null)
            {
                throw new KeyNotFoundException($"Caregiver with ID '{caregiverId}' not found.");
            }


            if (updateCaregiverAdditionalInfoRequest.IntroVideo != null)
            {
                using var memoryStream = new MemoryStream();
                await updateCaregiverAdditionalInfoRequest.IntroVideo.CopyToAsync(memoryStream);
                var videoBytes = memoryStream.ToArray();

                // Now upload imageBytes to Cloudinary
                var videoUrl = await cloudinaryService.UploadVideoAsync(videoBytes, $"intro_{existingCareGiver.FirstName}{existingCareGiver.LastName}");

                existingCareGiver.IntroVideo = videoUrl; // Save Cloudinary URL to DB
            }

            // Update AboutMe if provided
            if (!string.IsNullOrWhiteSpace(updateCaregiverAdditionalInfoRequest.AboutMe))
            {
                existingCareGiver.AboutMe = updateCaregiverAdditionalInfoRequest.AboutMe;
            }

            // Update Location if provided
            if (!string.IsNullOrWhiteSpace(updateCaregiverAdditionalInfoRequest.Location))
            {
                existingCareGiver.Location = updateCaregiverAdditionalInfoRequest.Location;
            }


            careProDbContext.CareGivers.Update(existingCareGiver);
            await careProDbContext.SaveChangesAsync();

            return $"Caregiver with ID '{caregiverId}' Additional Information Updated successfully.";

        }

        public async Task<string> UpdateProfilePictureAsync(string caregiverId, UpdateProfilePictureRequest updateProfilePictureRequest)
        {

            if (!ObjectId.TryParse(caregiverId, out var objectId))
            {
                throw new ArgumentException("Invalid Caregiver ID format.");
            }


            var existingCareGiver = await careProDbContext.CareGivers.FindAsync(objectId);

            if (existingCareGiver == null)
            {
                throw new KeyNotFoundException($"Caregiver with ID '{caregiverId}' not found.");
            }


            if (updateProfilePictureRequest.ProfileImage != null)
            {
                using var memoryStream = new MemoryStream();
                await updateProfilePictureRequest.ProfileImage.CopyToAsync(memoryStream);
                var imageBytes = memoryStream.ToArray();

                // Now upload imageBytes to Cloudinary
                var imageURL = await cloudinaryService.UploadImageAsync(imageBytes, $"intro_{existingCareGiver.FirstName}{existingCareGiver.LastName}");

                existingCareGiver.ProfileImage = imageURL; // Save Cloudinary URL to DB
            }

            
            careProDbContext.CareGivers.Update(existingCareGiver);
            await careProDbContext.SaveChangesAsync();

            return $"Caregiver with ID '{caregiverId}' ProfilePicture Updated successfully.";

        }



        public async Task ResetPasswordAsync(ResetPasswordRequest resetPasswordRequest)
        {
            var user = await careProDbContext.AppUsers.FirstOrDefaultAsync(u => u.Email == resetPasswordRequest.Email.ToLower());

            if (user == null)
                throw new InvalidOperationException("User not found.");

            if (!BCrypt.Net.BCrypt.Verify(resetPasswordRequest.CurrentPassword, user.Password))
                throw new UnauthorizedAccessException("Current password is incorrect.");

            user.Password = BCrypt.Net.BCrypt.HashPassword(resetPasswordRequest.NewPassword);


            //var caregiver = await careProDbContext.CareGivers.FirstOrDefaultAsync(c => c.Email == resetPasswordRequest.Email.ToLower());
            //if (caregiver != null)
            //{
            //    caregiver.Password = user.Password; // Keep both in sync
            //}

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

                //var caregiver = await careProDbContext.CareGivers.FirstOrDefaultAsync(c => c.Email == user.Email);
                //if (caregiver != null)
                //{
                //    caregiver.Password = hashedPassword;
                //}

                await careProDbContext.SaveChangesAsync();
            }
            catch (Exception)
            {
                throw new UnauthorizedAccessException("Invalid or expired reset token.");
            }
        }

       
    }
}
