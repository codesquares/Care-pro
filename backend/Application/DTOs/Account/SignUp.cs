using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Account
{
    public class SignUp
    {
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; }

        public string? MiddleName { get; set; }

        [Required]
        [StringLength(100)]
        public string LastName { get; set; }



        [Required]
        [EmailAddress]
        [StringLength(128)]
        public string Email { get; set; }

        [Required]
        [StringLength(256)]
        public string Password { get; set; }

        //public string Role { get; set; }
    }
}
