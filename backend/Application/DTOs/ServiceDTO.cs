using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class ServiceDTO
    {
        public string Id { get; set; }
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

    public class AddServiceRequest
    {
        public string Title { get; set; }
        public string Description { get; set; }
        //public byte[] Image { get; set; }
        public int Pricing { get; set; }
        public string ServiceWorkItems { get; set; }
        public string Location { get; set; }
        public string ServiceCategory { get; set; }
        public string CaregiverId { get; set; }
    }
}
