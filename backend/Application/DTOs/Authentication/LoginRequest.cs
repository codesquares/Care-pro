﻿using Domain.Entities;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Authentication
{
    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class LoginResponse
    {
        public string Id { get; set; }

        public string Email { get; set; }

        public string Token { get; set; }

        public string Role { get; set; }

        public string? Message { get; set; }
                
    }
}
