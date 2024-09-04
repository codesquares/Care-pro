using Application.DTOs.Account;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Models
{
    public class AppUser : IdentityUser
    {
        

        [Required]
        [MaxLength(50)]
        public required string FirstName { get; set; }

        [MaxLength(50)]
        public required string? MiddleName { get; set; }

        [Required]
        [MaxLength(50)]
        public required string LastName { get; set; }

        public List<RefreshToken>? RefreshTokens { get; set; }
        public bool PasswordChanged { get; set; } = false;
    }
}
