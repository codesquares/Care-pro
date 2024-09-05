using Application.DTOs.Account;
using Application.DTOs.Email;
using Application.Interfaces.Authentication;
using Application.Interfaces.Email;
using Domain.Settings;
using Infrastructure.Identity.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.CodeAnalysis.Elfie.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Services
{
    public class AuthResponseService : IAuthResponseService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly JWT _Jwt;
        private readonly IEmailService _emailSender;
        private readonly ILogger<AuthResponseService> logger;

        public AuthResponseService(UserManager<AppUser> userManager, RoleManager<IdentityRole> roleManager, IOptions<JWT> jwt, IEmailService emailSender, ILogger<AuthResponseService> logger) 
        {
            this._userManager = userManager;
            this._roleManager = roleManager;
            this._Jwt = jwt.Value;
            this._emailSender = emailSender;
            this.logger = logger;
        }


        #region create JWT

        //create JWT
        private async Task<JwtSecurityToken> CreateJwtAsync(AppUser user)
        {
            var userClaims = await _userManager.GetClaimsAsync(user);
            var roles = await _userManager.GetRolesAsync(user);
            var roleClaims = new List<Claim>();

            foreach (var role in roles)
                roleClaims.Add(new Claim("roles", role));

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("userId", user.Id),
            }
            .Union(userClaims)
            .Union(roleClaims);

            //generate the symmetricSecurityKey by the s.key
            var symmetricSecurityKey =
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_Jwt.Key));

            //generate the signingCredentials by symmetricSecurityKey
            var signingCredentials = new SigningCredentials(symmetricSecurityKey, SecurityAlgorithms.HmacSha256);

            //define the  values that will be used to create JWT
            var jwtSecurityToken = new JwtSecurityToken(
                issuer: _Jwt.Issuer,
                audience: _Jwt.Audience,
                claims: claims,
                expires: DateTime.Now.AddHours(_Jwt.DurationInHours),
                signingCredentials: signingCredentials);

            return jwtSecurityToken;
        }

        #endregion create JWT



        #region Generate RefreshToken

        //Generate RefreshToken
        private RefreshToken GenerateRefreshToken()
        {
            var randomNumber = new byte[32];

            using var generator = new RNGCryptoServiceProvider();

            generator.GetBytes(randomNumber);

            return new RefreshToken
            {
                Token = Convert.ToBase64String(randomNumber),
                ExpireOn = DateTime.UtcNow.AddDays(10),
                CreateOn = DateTime.UtcNow
            };
        }

        #endregion Generate RefreshToken



        #region SignUp Method

        //SignUp
        public async Task<AuthResponse> SignUpAsync(SignUp signUpModel, string? orgin)
        {
            var auth = new AuthResponse();

            var userEmail = await _userManager.FindByEmailAsync(signUpModel.Email);
            //var userName = await _userManager.FindByNameAsync(model.Username);

            //checking the EmailTemplate and username
            if (userEmail is not null)
                return new AuthResponse { Message = "Email is Already used ! " };

            /* if (userName is not null)
                 return new AuthResponse { Message = "Username is Already used ! " };*/

            //fill
            var user = new AppUser
            {
                FirstName = signUpModel.FirstName,
                MiddleName = signUpModel.MiddleName,
                LastName = signUpModel.LastName,
                UserName = signUpModel.Email,
                Email = signUpModel.Email,
            };

            var result = await _userManager.CreateAsync(user, signUpModel.Password);

            //check result
            if (!result.Succeeded)
            {
                var errors = string.Empty;
                foreach (var error in result.Errors)
                {
                    errors += $"{error.Description}, ";
                }

                return new AuthResponse { Message = errors };
            }

            //assign role to user by default
            await _userManager.AddToRoleAsync(user, "User");

            #region SendVerificationEmail

            var verificationUri = await SendVerificationEmail(user, orgin);

            EmailRequest emailRequest = new EmailRequest();
            emailRequest.ToEmail = user.Email;
            emailRequest.FirstName = user.FirstName;
            emailRequest.TokenUrl = verificationUri;


            string emailTemplate = Infrastructure.Services.EmailTemplates.ConfirmUserEmailTemplate.EmailTemplate;

            var body = ComposeConfirmApplicantEmailDef(emailRequest, emailTemplate);

            await _emailSender.SendEmailAsync2(emailRequest.ToEmail, "Confirm Registration", body);


            #endregion SendVerificationEmail

            var jwtSecurityToken = await CreateJwtAsync(user);

            auth.ApplicantId = user.Id;
            auth.Email = user.Email;
            auth.Roles = new List<string> { "User" };
            auth.IsAuthenticated = true;
            auth.UserName = user.UserName;
            auth.Token = new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
            auth.TokenExpiresOn = jwtSecurityToken.ValidTo.ToLocalTime();
            auth.Message = "SignUp Succeeded";

            // create new refresh token
            var newRefreshToken = GenerateRefreshToken();
            auth.RefreshToken = newRefreshToken.Token;
            auth.RefreshTokenExpiration = newRefreshToken.ExpireOn;

            user.RefreshTokens.Add(newRefreshToken);
            await _userManager.UpdateAsync(user);

            return auth;
        }


        /// Email Template Definition
        public string ComposeConfirmApplicantEmailDef(EmailRequest emailModel, string body)
        {

            //string body = EmailTemplates.MailTemplate;

            if (!string.IsNullOrEmpty(body))
            {
                body = body;
            }

            //replace static variable on the template
            body = body.Replace("{{ FirstName }}", emailModel.FirstName);
            body = body.Replace("{{ TokenUrl }}", emailModel.TokenUrl);

            return body;
        }

        #endregion SignUp Method



        #region Login Method

        //login
        public async Task<AuthResponse> LoginAsync(Login model)
        {
            var auth = new AuthResponse();

            var user = await _userManager.FindByEmailAsync(model.Email);
            var userpass = await _userManager.CheckPasswordAsync(user, model.Password);

            if (user == null || !userpass)
            {
                auth.Message = "EmailTemplate or Password is incorrect";
                return auth;
            }

            var jwtSecurityToken = await CreateJwtAsync(user);

            var roles = await _userManager.GetRolesAsync(user);

            auth.ApplicantId = user.Id;
            auth.Email = user.Email;
            auth.UserName = user.FirstName + " " + user.LastName;
            auth.Roles = roles.ToList();
            auth.IsAuthenticated = true;
            //auth.UserName = user.UserName;
            auth.Token = new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
            auth.TokenExpiresOn = jwtSecurityToken.ValidTo;
            auth.Message = "Login Succeeded ";

            //check if the user has any active refresh token
            if (user.RefreshTokens.Any(t => t.IsActive))
            {
                var activeRefreshToken = user.RefreshTokens.FirstOrDefault(t => t.IsActive);
                auth.RefreshToken = activeRefreshToken.Token;
                auth.RefreshTokenExpiration = activeRefreshToken.ExpireOn;
            }
            else
            //in case user has no active refresh token
            {
                var newRefreshToken = GenerateRefreshToken();
                auth.RefreshToken = newRefreshToken.Token;
                auth.RefreshTokenExpiration = newRefreshToken.ExpireOn;

                user.RefreshTokens.Add(newRefreshToken);
                await _userManager.UpdateAsync(user);
            }

            return auth;
        }

        #endregion Login Method



        #region Assign Roles Method

        //Assign Roles
        public async Task<string> AssignRolesAsync(AssignRolesDto model)
        {
            var user = await _userManager.FindByIdAsync(model.UserId);
            var role = await _roleManager.RoleExistsAsync(model.Role);

            //check the user Id and role
            if (user == null || !role)
                return "Invalid ID or Role";

            //check if user is already assiged to selected role
            if (await _userManager.IsInRoleAsync(user, model.Role))
                return "User already assigned to this role";

            var result = await _userManager.AddToRoleAsync(user, model.Role);

            //check result
            if (!result.Succeeded)
                return "Something went wrong ";

            return string.Empty;
        }

        #endregion Assign Roles Method



        #region check Refresh Tokens method

        //check Refresh Tokens
        public async Task<AuthResponse> RefreshTokenCheckAsync(string token)
        {
            var auth = new AuthResponse();

            //find the user that match the sent refresh token
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.RefreshTokens.Any(t => t.Token == token));

            if (user == null)
            {
                auth.Message = "Invalid Token";
                return auth;
            }

            // check if the refreshtoken is active
            var refreshToken = user.RefreshTokens.Single(t => t.Token == token);

            if (!refreshToken.IsActive)
            {
                auth.Message = "Inactive Token";
                return auth;
            }

            //revoke the sent Refresh Tokens
            refreshToken.RevokedOn = DateTime.UtcNow;

            var newRefreshToken = GenerateRefreshToken();
            user.RefreshTokens.Add(newRefreshToken);
            await _userManager.UpdateAsync(user);

            var jwtSecurityToken = await CreateJwtAsync(user);

            var roles = await _userManager.GetRolesAsync(user);

            auth.Email = user.Email;
            auth.Roles = roles.ToList();
            auth.IsAuthenticated = true;
            auth.UserName = user.UserName;
            auth.Token = new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
            auth.TokenExpiresOn = jwtSecurityToken.ValidTo;
            auth.RefreshToken = newRefreshToken.Token;
            auth.RefreshTokenExpiration = newRefreshToken.ExpireOn;

            return auth;
        }


        #endregion check Refresh Tokens method



        #region revoke Refresh Tokens method

        //revoke Refresh token
        public async Task<bool> RevokeTokenAsync(string token)
        {
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.RefreshTokens.Any(t => t.Token == token));

            if (user == null)
                return false;

            // check if the refreshtoken is active
            var refreshToken = user.RefreshTokens.Single(t => t.Token == token);

            if (!refreshToken.IsActive)
                return false;

            //revoke the sent Refresh Tokens
            refreshToken.RevokedOn = DateTime.UtcNow;

            var newRefreshToken = GenerateRefreshToken();

            await _userManager.UpdateAsync(user);

            return true;
        }

        #endregion revoke Refresh Tokens method

        #region SendVerificationEmail

        private async Task<string> SendVerificationEmail(AppUser user, string origin)
        {
            //var code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var code = await _userManager.GenerateEmailConfirmationTokenAsync(user);

            code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));
            var route = "api/Auth/confirm-email/";

            var _enpointUri = new Uri(string.Concat("https://", $"{origin}/", route));

            var verificationUri = QueryHelpers.AddQueryString(_enpointUri.ToString(), "userId", user.Id);
            verificationUri = QueryHelpers.AddQueryString(verificationUri, "code", code);
            //EmailTemplate Service Call Here
            return verificationUri;
        }

        public async Task<string> ConfirmEmailAsync(string userId, string code)
        {
            var user = await _userManager.FindByIdAsync(userId);
            code = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(code));
            var result = await _userManager.ConfirmEmailAsync(user, code);
            if (result.Succeeded)
            {
                return $"Account Confirmed for {user.Email}. You can now use the /api/Account/authenticate endpoint.";
            }
            else
            {
                throw new Exception($"An error occured while confirming {user.Email}.");
            }
        }

        #endregion SendVerificationEmail



        #region Get Applicant Users
        public async Task<List<AuthResponse>> GetAllApplicantUsersAsync(int pageNumber, int pageSize)
        {

            try
            {
                //var users = _userManager.Users.ToList();
                var users = await _userManager.Users
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
                var userDtos = new List<AuthResponse>();

                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    var role = roles.FirstOrDefault();

                    if (role != "User")
                    {
                        continue; // Skip this user if the role is not "User"
                    }


                    var userDto = new AuthResponse
                    {
                        ApplicantId = user.Id,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        Email = user.Email,
                    };

                    userDtos.Add(userDto);
                }

                return userDtos;
            }
            catch (Exception ex)
            {
                throw;
            }
        }


        public async Task<AuthResponse> GetApplicantUserAsync(string applicantUserId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(applicantUserId);
                if (user == null)
                {
                    logger.LogWarning($"User with ID {applicantUserId} not found.");
                    return null;
                }

                var roles = await _userManager.GetRolesAsync(user);

                var userDto = new AuthResponse
                {
                    ApplicantId = user.Id,
                    FirstName = user.FirstName,
                    MiddleName = user.MiddleName,
                    LastName = user.LastName,
                    Email = user.Email,
                };

                logger.LogInformation($"Retrieved user with ID {applicantUserId}.");

                return userDto;
            }
            catch (Exception ex)
            {
                logger.LogError($"Error occurred while retrieving user with ID {applicantUserId}: {ex.Message}");
                throw;
            }
        }

        #endregion Get All Back End users

    }
}
