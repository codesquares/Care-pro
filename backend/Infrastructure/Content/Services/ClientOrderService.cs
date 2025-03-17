using Application.DTOs;
using Application.Interfaces;
using Application.Interfaces.Content;
using Domain.Entities;
using Infrastructure.Content.Data;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Authentication;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Content.Services
{
    public class ClientOrderService : IClientOrderService
    {
        private readonly CareProDbContext careProDbContext;
        private readonly IGigServices gigServices;
        private readonly ICareGiverService careGiverService;
        private readonly IClientService clientService;
        private readonly ILogger<GigServices> logger;

        public ClientOrderService(CareProDbContext careProDbContext, IGigServices gigServices, ICareGiverService careGiverService, IClientService clientService, ILogger<GigServices> logger)
        {
            this.careProDbContext = careProDbContext;
            this.gigServices = gigServices;
            this.careGiverService = careGiverService;
            this.clientService = clientService;
            this.logger = logger;
        }

        public async Task<ClientOrderDTO> CreateClientOrderAsync(AddClientOrderRequest addClientOrderRequest)
        {
            var client = await careGiverService.GetCaregiverUserAsync(addClientOrderRequest.ClientId);
            if (client == null)
            {
                throw new AuthenticationException("The ClientID entered is not a Valid ID");
            }

            var gig = await gigServices.GetGigAsync(addClientOrderRequest.GigId);
            if (gig == null)
            {
                throw new AuthenticationException("The GigID entered is not a Valid ID");
            }

            /// CONVERT DTO TO DOMAIN OBJECT            
            var clientOrder = new ClientOrder
            {
                ClientId = client.Id,
                GigId = gig.Id,
                PaymentOption = addClientOrderRequest.PaymentOption,
                Amount = addClientOrderRequest.Amount,
                TransactionId = addClientOrderRequest.TransactionId,

                // Assign new ID
                Id = ObjectId.GenerateNewId(),
                OrderCreatedAt = DateTime.Now,
            };

            await careProDbContext.ClientOrders.AddAsync(clientOrder);

            await careProDbContext.SaveChangesAsync();
                       

            var clientOrderDTO = new ClientOrderDTO()
            {
                Id = clientOrder.Id.ToString(),
                ClientId = clientOrder.ClientId,
                GigId = clientOrder.GigId,
                PaymentOption = clientOrder.PaymentOption,
                Amount = clientOrder.Amount,
                TransactionId = clientOrder.TransactionId,
                OrderCreatedAt = clientOrder.OrderCreatedAt,
                
            };

            return clientOrderDTO;

        }
    }
}
