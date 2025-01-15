using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Caregiver 
    {
        public ObjectId Id { get; set; } 

        public string FirstName { get; set; }

        public string? MiddleName { get; set; }

        public string LastName { get; set; }

        public string Email { get; set; }

        public string PhoneNo { get; set; }
        public string? HomeAddress { get; set; }

        public string Role { get; set; }

        public string Password { get; set; }

        public string? Introduction { get; set; }
        public string? Description { get; set; }
        public string[]? Services { get; set; }
        public string? Location { get; set; }
       // public string[]? CertificationIDs { get; set; }
        public string? ReasonForDeactivation { get; set; }
        public string? IntroVideoUrl { get; set; }

        public bool IsDeleted { get; set; }       

        public bool Status { get; set; }
        

        public DateTime CreatedAt { get; set; }

    }
}
