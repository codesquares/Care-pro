using Application.DTOs;
using Application.Interfaces;
using Application.Interfaces.Content;
using Domain.Entities;
using Infrastructure.Content.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using Org.BouncyCastle.Asn1.X509;
using System;
using System.Collections.Generic;
                existingOrder.ClientOrderStatus = updateClientOrderStatusRequest.ClientOrderStatus;
                existingOrder.OrderUpdatedOn = DateTime.Now;

                // If the order is marked as completed, update caregiver earnings
                if (updateClientOrderStatusRequest.ClientOrderStatus == "Completed")
                {
                    // Get the gig to find the caregiver
                    var gig = await gigServices.GetGigByIdAsync(existingOrder.GigId.ToString());
                    
                    if (gig != null)
                    {
                        // Update caregiver earnings
                        var updateEarningsRequest = new UpdateEarningsRequest
                        {
                            TotalEarned = existingOrder.Amount,
                            WithdrawableAmount = existingOrder.Amount
                        };
                        
                        // Check if earnings record exists for caregiver
                        bool earningsExist = await _earningsService.DoesEarningsExistForCaregiverAsync(gig.CareGiverId);
                        
                        if (earningsExist)
                        {
                            // Get earnings to update
                            var earnings = await _earningsService.GetEarningsByCaregiverIdAsync(gig.CareGiverId);
                            await _earningsService.UpdateEarningsAsync(earnings.Id, updateEarningsRequest);
                        }
                        else
                        {
                            // Create new earnings record
                            var createEarningsRequest = new CreateEarningsRequest
                            {
                                CaregiverId = gig.CareGiverId,
                                TotalEarned = existingOrder.Amount,
                                WithdrawableAmount = existingOrder.Amount,
                                WithdrawnAmount = 0
                            };
                            await _earningsService.CreateEarningsAsync(createEarningsRequest);
                        }
                        
                        // Create transaction history record
                        await _transactionHistoryService.AddEarningTransactionAsync(
                            gig.CareGiverId,
                            existingOrder.Amount,
                            $"Payment for completed gig: {existingOrder.ServiceName}",
                            existingOrder.Id.ToString()
                        );
                        
                        // Notify caregiver about the earning
                        await notificationService.AddNotificationAsync(new AddNotificationRequest
                        {
                            UserId = gig.CareGiverId,
                            Title = "Payment Received",
                            Message = $"You have received {existingOrder.Amount:C} for completing the gig: {existingOrder.ServiceName}",
                            Type = "Earning",
                            IsRead = false
                        });
                    }
                }

                careProDbContext.ClientOrders.Update(existingOrder);
                await careProDbContext.SaveChangesAsync();System.Linq;
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
        private readonly INotificationService notificationService;
        private readonly IEarningsService _earningsService;
        private readonly ITransactionHistoryService _transactionHistoryService;

        public ClientOrderService(
            CareProDbContext careProDbContext, 
            IGigServices gigServices, 
            ICareGiverService careGiverService, 
            IClientService clientService, 
            ILogger<GigServices> logger,
            INotificationService notificationService,
            IEarningsService earningsService,
            ITransactionHistoryService transactionHistoryService)
        {
            this.careProDbContext = careProDbContext;
            this.gigServices = gigServices;
            this.careGiverService = careGiverService;
            this.clientService = clientService;
            this.logger = logger;
            this.notificationService = notificationService;
            this._earningsService = earningsService;
            this._transactionHistoryService = transactionHistoryService;
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
                ClientOrderStatus = "In Progress",
                HasDispute = false,
                OrderCreatedAt = DateTime.Now,
            };

            await careProDbContext.ClientOrders.AddAsync(clientOrder);
            await careProDbContext.SaveChangesAsync();

            // Create notification for the caregiver
            var caregiver = await careGiverService.GetCaregiverUserAsync(clientOrder.CaregiverId);
            if (caregiver != null)
            {
                string notificationContent = $"New order received for your service: {gig.Title} - Amount: ${clientOrder.Amount}";
                
                await notificationService.CreateNotificationAsync(
                    clientOrder.CaregiverId,
                    clientOrder.ClientId,
                    NotificationType.Payment,
                    notificationContent,
                    clientOrder.Id.ToString()
                );
            }

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


        public async Task<CaregiverClientOrdersSummaryResponse> GetAllCaregiverOrderAsync(string caregiverId)
        {

            var orders = await careProDbContext.ClientOrders
               .Where(x => x.CaregiverId == caregiverId)
               .OrderBy(x => x.OrderCreatedAt)
               .ToListAsync();

            var caregiverOrders = new List<ClientOrderResponse>();
            decimal totalEarning = 0;

            foreach (var caregiverOrder in orders)
            {
                var gig = await gigServices.GetGigAsync(caregiverOrder.GigId);
                if (gig == null)
                {
                    throw new KeyNotFoundException("The GigID entered is not a Valid ID");
                }

                var caregiver = await careGiverService.GetCaregiverUserAsync(caregiverId);
                if (caregiver == null)
                {
                    throw new KeyNotFoundException("The UserId entered is not a Valid ID");
                }

                //var client = await careGiverService.GetCaregiverUserAsync(caregiverOrder.ClientId);
                var client = await clientService.GetClientUserAsync(caregiverOrder.ClientId);
                if (client == null)
                {
                    throw new KeyNotFoundException("The ClientId entered is not a Valid ID");
                }

                totalEarning += caregiverOrder.Amount;

                var caregiverOrderDTO = new ClientOrderResponse()
                {
                    Id = caregiverOrder.Id.ToString(),
                    ClientId = caregiverOrder.ClientId,
                    ClientName = client.FirstName + " " + client.LastName,

                    CaregiverId = gig.CaregiverId,
                    CaregiverName = caregiver.FirstName + " " + caregiver.LastName,

                    GigId = caregiverOrder.GigId,
                    GigTitle = gig.Title,
                    GigPackageDetails = gig.PackageDetails,
                    GigImage = gig.Image1,
                    GigStatus = gig.Status,
                    

                    PaymentOption = caregiverOrder.PaymentOption,
                    Amount = caregiverOrder.Amount,
                    TransactionId = caregiverOrder.TransactionId,
                    ClientOrderStatus = caregiverOrder.ClientOrderStatus,
                    OrderCreatedOn = caregiverOrder.OrderCreatedAt,

                };

                caregiverOrders.Add(caregiverOrderDTO);
            }

            return new CaregiverClientOrdersSummaryResponse
            {
                NoOfOrders = caregiverOrders.Count,
                TotalEarning = totalEarning,
                ClientOrders = caregiverOrders,
            };
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
                    throw new KeyNotFoundException("The GigID entered is not a Valid ID");
                }

                var caregiver = await careGiverService.GetCaregiverUserAsync(gig.CaregiverId);
                if (caregiver == null)
                {
                    throw new KeyNotFoundException("The UserId entered is not a Valid ID");
                }

                //var client = await careGiverService.GetCaregiverUserAsync(clientOrder.ClientId);
                var client = await clientService.GetClientUserAsync(clientOrder.ClientId);
                if (client == null)
                {
                    throw new KeyNotFoundException("The ClientId entered is not a Valid ID");
                }

                var clientOrderDTO = new ClientOrderResponse()
                {
                    Id = clientOrder.Id.ToString(),
                    ClientId = clientOrder.ClientId,
                    ClientName = client.FirstName + " " + client.LastName,

                    CaregiverId = gig.CaregiverId,
                    CaregiverName = caregiver.FirstName + " " + caregiver.LastName,

                    GigId = clientOrder.GigId,
                    GigTitle = gig.Title,
                    GigImage = gig.Image1,
                    GigPackageDetails = gig.PackageDetails,
                    GigStatus = gig.Status,
                    

                    PaymentOption = clientOrder.PaymentOption,
                    Amount = clientOrder.Amount,
                    TransactionId = clientOrder.TransactionId,
                    ClientOrderStatus = clientOrder.ClientOrderStatus,
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
                throw new KeyNotFoundException("The GigID entered is not a Valid ID");
            }

            var caregiver = await careGiverService.GetCaregiverUserAsync(gig.CaregiverId);
            if (caregiver == null)
            {
                throw new KeyNotFoundException("The UserId entered is not a Valid ID");
            }

            //var client = await careGiverService.GetCaregiverUserAsync(order.ClientId);
            var client = await clientService.GetClientUserAsync(order.ClientId);
            if (client == null)
            {
                throw new KeyNotFoundException("The ClientId entered is not a Valid ID");
            }

            var clientOrderDTO = new ClientOrderResponse()
            {
                Id = order.Id.ToString(),
                ClientId = order.ClientId,
                ClientName = client.FirstName + " " + client.LastName,

                GigId = order.GigId,
                GigTitle = gig.Title,
                GigPackageDetails = gig.PackageDetails,
                GigStatus = gig.Status,
                GigImage = gig.Image1,


                CaregiverId = gig.CaregiverId,
                CaregiverName = caregiver.FirstName + " " + caregiver.LastName,

                PaymentOption = order.PaymentOption,
                Amount = order.Amount,
                TransactionId = order.TransactionId,
                ClientOrderStatus = order.ClientOrderStatus,
                OrderCreatedOn = order.OrderCreatedAt,
                
            };

            return clientOrderDTO;
        }

        public async Task<string> UpdateClientOrderStatusAsync(string orderId, UpdateClientOrderStatusRequest updateClientOrderStatusRequest)
        {
           
           

            try
            {
                if (!ObjectId.TryParse(orderId, out var objectId))
                {
                    throw new ArgumentException("Invalid order ID format.");
                }

                var existingOrder = await careProDbContext.ClientOrders.FindAsync(objectId);

                if (existingOrder == null)
                {
                    throw new KeyNotFoundException($"Order with ID '{orderId}' not found.");
                }


                existingOrder.ClientOrderStatus = updateClientOrderStatusRequest.ClientOrderStatus;
                existingOrder.OrderUpdatedOn = DateTime.Now;


                careProDbContext.ClientOrders.Update(existingOrder);
                await careProDbContext.SaveChangesAsync();

                LogAuditEvent($"Order Status updated (ID: {orderId})", updateClientOrderStatusRequest.UserId);
                return $"Order with ID '{orderId}' updated successfully.";
            }
            catch (Exception ex)
            {
                LogException(ex);
                throw new Exception(ex.Message);
            }
        }

       
        public async Task<string> UpdateClientOrderStatusHasDisputeAsync(string orderId, UpdateClientOrderStatusHasDisputeRequest updateClientOrderStatusHasDisputeRequest)
        {
            try
            {
                if (!ObjectId.TryParse(orderId, out var objectId))
                {
                    throw new ArgumentException("Invalid order ID format.");
                }

                var existingOrder = await careProDbContext.ClientOrders.FindAsync(objectId);

                if (existingOrder == null)
                {
                    throw new KeyNotFoundException($"Order with ID '{orderId}' not found.");
                }



                //var existingOrder = await careProDbContext.ClientOrders.FindAsync(orderId);

                //if (existingOrder == null)
                //{
                //    throw new KeyNotFoundException($"Order with ID '{orderId}' not found.");
                //}


                existingOrder.ClientOrderStatus = updateClientOrderStatusHasDisputeRequest.ClientOrderStatus;
                existingOrder.HasDispute = true;
                existingOrder.DisputeReason = updateClientOrderStatusHasDisputeRequest.DisputeReason;
                existingOrder.OrderUpdatedOn = DateTime.Now;


                careProDbContext.ClientOrders.Update(existingOrder);
                await careProDbContext.SaveChangesAsync();

                LogAuditEvent($"Order Status updated (ID: {orderId})", updateClientOrderStatusHasDisputeRequest.UserId);
                return $"Order with ID '{orderId}' updated successfully.";
            }
            catch (Exception ex)
            {
                LogException(ex);
                throw new Exception(ex.Message);
            }
        }


        private void LogException(Exception ex)
        {
            logger.LogError(ex, "Exception occurred");
        }

        private void LogAuditEvent(object message, string? userId)
        {
            logger.LogInformation($"Audit Event: {message}. User ID: {userId}. Timestamp: {DateTime.UtcNow}");
        }

    }
}
