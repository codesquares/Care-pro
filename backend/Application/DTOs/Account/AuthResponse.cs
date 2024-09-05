using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Application.DTOs.Account
{
    public class AuthResponse
    {
        public string ApplicantId { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }

        public string? Message { get; set; }

        //by default false

        public bool IsAuthenticated { get; set; }
        public string? UserName { get; set; }

        public string? Email { get; set; }

        public List<string>? Roles { get; set; }

        public string? Token { get; set; }

        public DateTime? TokenExpiresOn { get; set; }

        [JsonIgnore]
        public string? RefreshToken { get; set; }

        public DateTime RefreshTokenExpiration { get; set; }
        public bool NeedsPasswordChange { get; set; }
    }
}
