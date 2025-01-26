using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class AppUser
    {
        public ObjectId Id { get; set; }    

        public ObjectId AppUserId { get; set; }    
        
        public string Email { get; set; } = null!;
         
        public string Role { get; set; }

        public string Password { get; set; } = null!;

        public bool IsDeleted { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
