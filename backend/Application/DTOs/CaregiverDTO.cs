﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class CaregiverDTO
    {
        public string Id { get; set; }

        public string FirstName { get; set; } = null!;

        public string? MiddleName { get; set; }

        public string LastName { get; set; } = null!;

        public string Email { get; set; } = null!;

        public string PhoneNo { get; set; }

        public string Role { get; set; }

        public string Password { get; set; } = null!;

        public bool IsDeleted { get; set; }

        public DateTime CreatedAt { get; set; }

        public bool Status { get; set; }
    }

    public class AddCaregiverRequest
    {

        public string FirstName { get; set; } = null!;

        public string? MiddleName { get; set; }

        public string LastName { get; set; } = null!;

        public string Email { get; set; } = null!;

        public string PhoneNo { get; set; }

        public string Password { get; set; } = null!;

       
    }

    public class CaregiverResponse
    {
        public string Id { get; set; }

        public string FirstName { get; set; } = null!;

        public string? MiddleName { get; set; }

        public string LastName { get; set; } = null!;

        public string Email { get; set; } = null!;

        public string PhoneNo { get; set; } = null!;


        public string Role { get; set; }

        public string Password { get; set; } = null!;

        public bool IsDeleted { get; set; }

        public DateTime CreatedAt { get; set; }

        public bool Status { get; set; }
    }

}
