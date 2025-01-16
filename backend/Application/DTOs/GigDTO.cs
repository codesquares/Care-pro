using Microsoft.AspNetCore.Http;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class GigDTO
    {
        public string Id { get; set; }

       
        public string Title { get; set; }
        public string Category { get; set; }
        public string SubCategory { get; set; }
        public string Tags { get; set; }
        public string PackageType { get; set; }
        public string PackageName { get; set; }
        public string PackageDetails { get; set; }
        public string DeliveryTime { get; set; }
        public int Price { get; set; }
        public string Image1 { get; set; }
        public byte[]? Image2 { get; set; }
        public byte[]? Image3 { get; set; }
        public string? VideoURL { get; set; }
        public string Status { get; set; }

        public string CaregiverId { get; set; }
        public DateTime CreatedAt { get; set; }        
    }

    public class AddGigRequest
    {
        public string Title { get; set; }
        public string Category { get; set; }
        public string SubCategory { get; set; }
        public string Tags { get; set; }
        public string PackageType { get; set; }
        public string PackageName { get; set; }
        public string PackageDetails { get; set; }
        public string DeliveryTime { get; set; }
        public int Price { get; set; }
        //public byte[]? Image1 { get; set; }

        //public IFormFile Image1 { get; set; }
        public string Image1 { get; set; }

        //public byte[]? Image2 { get; set; }
        //public byte[]? Image3 { get; set; }
        public string? VideoURL { get; set; }
        public string Status { get; set; }

        public string CaregiverId { get; set; }        
    }
}
