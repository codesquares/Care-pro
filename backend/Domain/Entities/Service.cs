using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Service
    {
        public ObjectId Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public byte[]? Image { get; set; }
        public int Pricing { get; set; }
        public string ServiceWorkItems { get; set; }
        public string Location { get; set; }
        public string ServiceCategory { get; set; }

        public string CaregiverId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
