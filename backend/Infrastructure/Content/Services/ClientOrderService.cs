using Application.DTOs;
using Application.Interfaces;
using Application.Interfaces.Content;
using Domain.Entities;
using Infrastructure.Content.Data;
using Microsoft.EntityFrameworkCore;
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

        public async Task<Result<ClientOrderDTO>> CreateClientOrderAsync(AddClientOrderRequest addClientOrderRequest)
        {
            var errors = new List<string>();

            var client = await clientService.GetClientUserAsync(addClientOrderRequest.ClientId);
            if (client == null)
            {
                errors.Add("The ClientID entered is not a valid ID.");
            }

            var gig = await gigServices.GetGigAsync(addClientOrderRequest.GigId);
            if (gig == null)
            {
                errors.Add("The GigID entered is not a valid ID.");
            }

            if (errors.Any())
            {
                return Result<ClientOrderDTO>.Failure(errors);
            }

            // Convert DTO to domain object            
            var clientOrder = new ClientOrder
            {
                ClientId = client.Id,
                GigId = gig.Id,
                PaymentOption = addClientOrderRequest.PaymentOption,
                Amount = addClientOrderRequest.Amount,
                TransactionId = addClientOrderRequest.TransactionId,

                // Assign new ID
                Id = ObjectId.GenerateNewId(),
                CaregiverId = gig.CaregiverId,
                OrderCreatedAt = DateTime.Now,
            };

            await careProDbContext.ClientOrders.AddAsync(clientOrder);
            await careProDbContext.SaveChangesAsync();

            var clientOrderDTO = new ClientOrderDTO
            {
                Id = clientOrder.Id.ToString(),
                ClientId = clientOrder.ClientId,
                CaregiverId = clientOrder.CaregiverId,
                GigId = clientOrder.GigId,
                PaymentOption = clientOrder.PaymentOption,
                Amount = clientOrder.Amount,
                TransactionId = clientOrder.TransactionId,
                OrderCreatedAt = clientOrder.OrderCreatedAt,
            };

            return Result<ClientOrderDTO>.Success(clientOrderDTO);
        }



        //public async Task<ClientOrderDTO> CreateClientOrderAsync(AddClientOrderRequest addClientOrderRequest)
        //{
        //    var client = await clientService.GetClientUserAsync(addClientOrderRequest.ClientId);
        //    if (client == null)
        //    {
        //        throw new AuthenticationException("The ClientID entered is not a Valid ID");
        //    }

        //    var gig = await gigServices.GetGigAsync(addClientOrderRequest.GigId);
        //    if (gig == null)
        //    {
        //        throw new AuthenticationException("The GigID entered is not a Valid ID");
        //    }

        //    /// CONVERT DTO TO DOMAIN OBJECT            
        //    var clientOrder = new ClientOrder
        //    {
        //        ClientId = client.Id,
        //        GigId = gig.Id,
        //        PaymentOption = addClientOrderRequest.PaymentOption,
        //        Amount = addClientOrderRequest.Amount,
        //        TransactionId = addClientOrderRequest.TransactionId,

        //        // Assign new ID
        //        Id = ObjectId.GenerateNewId(),
        //        CaregiverId = gig.CaregiverId,
        //        OrderCreatedAt = DateTime.Now,
        //    };

        //    await careProDbContext.ClientOrders.AddAsync(clientOrder);

        //    await careProDbContext.SaveChangesAsync();


        //    var clientOrderDTO = new ClientOrderDTO()
        //    {
        //        Id = clientOrder.Id.ToString(),
        //        ClientId = clientOrder.ClientId,
        //        CaregiverId = clientOrder.CaregiverId,
        //        GigId = clientOrder.GigId,
        //        PaymentOption = clientOrder.PaymentOption,
        //        Amount = clientOrder.Amount,
        //        TransactionId = clientOrder.TransactionId,
        //        OrderCreatedAt = clientOrder.OrderCreatedAt,

        //    };

        //    return clientOrderDTO;

        //}

        public async Task<IEnumerable<ClientOrderResponse>> GetAllCaregiverOrderAsync(string caregiverId)
        {

            var orders = await careProDbContext.ClientOrders
               .Where(x => x.CaregiverId == caregiverId)
               .OrderBy(x => x.OrderCreatedAt)
               .ToListAsync();

            var caregiverOrders = new List<ClientOrderResponse>();

            foreach (var caregiverOrder in orders)
            {
                var gig = await gigServices.GetGigAsync(caregiverOrder.GigId);
                if (gig == null)
                {
                    throw new AuthenticationException("The GigID entered is not a Valid ID");
                }
                var caregiverOrderDTO = new ClientOrderResponse()
                {
                    Id = caregiverOrder.Id.ToString(),
                    ClientId = caregiverOrder.ClientId,
                    CaregiverId = gig.CaregiverId,
                    GigId = caregiverOrder.GigId,
                    PaymentOption = caregiverOrder.PaymentOption,
                    Amount = caregiverOrder.Amount,
                    TransactionId = caregiverOrder.TransactionId,
                    OrderCreatedOn = caregiverOrder.OrderCreatedAt,

                };

                caregiverOrders.Add(caregiverOrderDTO);
            }

            return caregiverOrders;
        }

        public async Task<IEnumerable<ClientOrderResponse>> GetAllClientOrderAsync(string clientUserId)
        {
            var orders = await careProDbContext.ClientOrders
               .Where(x => x.ClientId == clientUserId)
               .OrderBy(x => x.OrderCreatedAt)
               .ToListAsync();

            var clientOrdersDTOs = new List<ClientOrderResponse>();

            foreach (var clientOrder in orders)
            {
                var gig = await gigServices.GetGigAsync(clientOrder.GigId);
                if (gig == null)
                {
                    throw new AuthenticationException("The GigID entered is not a Valid ID");
                }
                var clientOrderDTO = new ClientOrderResponse()
                {
                    Id = clientOrder.Id.ToString(),
                    ClientId = clientOrder.ClientId,
                    CaregiverId = gig.CaregiverId,
                    GigId = clientOrder.GigId,
                    PaymentOption = clientOrder.PaymentOption,
                    Amount = clientOrder.Amount,
                    TransactionId = clientOrder.TransactionId,
                    OrderCreatedOn = clientOrder.OrderCreatedAt,
                    
                };

                clientOrdersDTOs.Add(clientOrderDTO);
            }

            return clientOrdersDTOs;
        }

        public async Task<ClientOrderResponse> GetClientOrderAsync(string orderId)
        {
            var order = await careProDbContext.ClientOrders.FirstOrDefaultAsync(x => x.Id.ToString() == orderId);

            if (order == null)
            {
                throw new KeyNotFoundException($"Gig with ID '{orderId}' not found.");
            }

            var gig = await gigServices.GetGigAsync(order.GigId);
            if (gig == null)
            {
                throw new AuthenticationException("The GigID entered is not a Valid ID");
            }

            var clientOrderDTO = new ClientOrderResponse()
            {
                Id = order.Id.ToString(),
                ClientId = order.ClientId,
                GigId = order.GigId,
                CaregiverId = gig.CaregiverId,
                PaymentOption = order.PaymentOption,
                Amount = order.Amount,
                TransactionId = order.TransactionId,
                OrderCreatedOn = order.OrderCreatedAt,
                
            };

            return clientOrderDTO;
        }

        

       
    }
}
