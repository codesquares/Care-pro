using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class VerificationDTO
    {
        public string VerificationId { get; set; }
        public string CaregiverId { get; set; }
        public string VerificationMode { get; set; }
        public string VerificationStatus { get; set; }
        public DateTime VerifiedOn { get; set; }
        public DateTime UpdatedOn { get; set; }
    }


    public class AddVerificationRequest
    {       
        public string CaregiverId { get; set; }
        public string VerificationMode { get; set; }
        public string VerificationStatus { get; set; } 
        
    }

    public class VerificationResponse
    {
        public string VerificationId { get; set; }
        public string CaregiverId { get; set; }
        public string VerificationMode { get; set; }
        public string VerificationStatus { get; set; }
        public DateTime VerifiedOn { get; set; }
        public DateTime? UpdatedOn { get; set; }
    }


    public class UpdateVerificationRequest
    {
        public string VerificationMode { get; set; }
        public string VerificationStatus { get; set; }

    }
}
