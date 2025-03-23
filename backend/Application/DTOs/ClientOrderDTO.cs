using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class ClientOrderDTO
    {
        public string Id { get; set; }
        public string ClientId { get; set; }
        public string CaregiverId { get; set; }
        public string GigId { get; set; }
        public string PaymentOption { get; set; }
        public int Amount { get; set; }
        public string TransactionId { get; set; }
        public string ClientOrderStatus { get; set; }

        public DateTime OrderCreatedAt { get; set; }
    }


    public class ClientOrderResponse
    {
        public string Id { get; set; }
        public string ClientId { get; set; }

        public string CaregiverId { get; set; }
        public string CaregiverName { get; set; }

        public string GigId { get; set; }
        public string GigTitle { get; set; }
        public string GigPackageDetails { get; set; }
        public string GigImage { get; set; }
        public string GigStatus { get; set; }


        public string PaymentOption { get; set; }
        public int Amount { get; set; }
        public string TransactionId { get; set; }
        public string? ClientOrderStatus { get; set; }
        public DateTime OrderCreatedOn { get; set; }
    }

    public class AddClientOrderRequest
    {
        public string ClientId { get; set; }
        public string GigId { get; set; }
        public string PaymentOption { get; set; }
        public int Amount { get; set; }
        public string TransactionId { get; set; }
    }
}
