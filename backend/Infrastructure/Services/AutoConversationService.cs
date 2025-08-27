using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json;

namespace Infrastructure.Services
{
    public interface IAutoConversationService
    {
        Task CreateConversationForOrderAsync(string caregiverId, string clientId, string orderId);
        Task<bool> CheckConversationExistsAsync(string caregiverId, string clientId);
    }

    public class AutoConversationService : IAutoConversationService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AutoConversationService> _logger;
        private readonly string _messageApiBaseUrl;

        public AutoConversationService(
            HttpClient httpClient, 
            ILogger<AutoConversationService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            // This should come from configuration
            _messageApiBaseUrl = "https://carepro-api20241118153443.azurewebsites.net/api/Messages";
        }

        public async Task CreateConversationForOrderAsync(string caregiverId, string clientId, string orderId)
        {
            try
            {
                _logger.LogInformation($"Creating conversation for order {orderId} between caregiver {caregiverId} and client {clientId}");

                // Check if conversation already exists
                var conversationExists = await CheckConversationExistsAsync(caregiverId, clientId);
                
                if (conversationExists)
                {
                    _logger.LogInformation($"Conversation already exists between caregiver {caregiverId} and client {clientId}");
                    return;
                }

                // Create new conversation
                var conversationData = new
                {
                    participants = new[]
                    {
                        new { id = caregiverId, role = "Caregiver" },
                        new { id = clientId, role = "Client" }
                    },
                    createdBy = caregiverId, // Or could be system-generated
                    createdAt = DateTime.UtcNow.ToString("O"),
                    metadata = new
                    {
                        orderId = orderId,
                        createdReason = "OrderPlaced",
                        autoCreated = true
                    }
                };

                var json = JsonConvert.SerializeObject(conversationData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_messageApiBaseUrl}/conversations", content);
                
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Successfully created conversation for order {orderId}");
                    
                    // Optional: Send initial automated message
                    await SendInitialOrderMessageAsync(caregiverId, clientId, orderId);
                }
                else
                {
                    _logger.LogError($"Failed to create conversation for order {orderId}. Status: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating conversation for order {orderId}");
                // Don't throw - conversation creation shouldn't block order creation
            }
        }

        public async Task<bool> CheckConversationExistsAsync(string caregiverId, string clientId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_messageApiBaseUrl}/conversations/{caregiverId}");
                
                if (!response.IsSuccessStatusCode)
                {
                    return false;
                }

                var content = await response.Content.ReadAsStringAsync();
                var conversations = JsonConvert.DeserializeObject<dynamic[]>(content);

                return conversations?.Any(conv => 
                    conv.participants?.Any(p => p.id?.ToString() == clientId) == true) == true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking conversation between {caregiverId} and {clientId}");
                return false;
            }
        }

        private async Task SendInitialOrderMessageAsync(string caregiverId, string clientId, string orderId)
        {
            try
            {
                var initialMessage = new
                {
                    senderId = "system", // or caregiverId
                    recipientId = clientId,
                    message = $"A conversation has been set up for your order #{orderId}. Feel free to discuss any details about your care needs here.",
                    messageType = "system",
                    timestamp = DateTime.UtcNow.ToString("O"),
                    metadata = new
                    {
                        orderId = orderId,
                        isSystemMessage = true
                    }
                };

                var json = JsonConvert.SerializeObject(initialMessage);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                await _httpClient.PostAsync($"{_messageApiBaseUrl}/send", content);
                
                _logger.LogInformation($"Sent initial message for order {orderId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending initial message for order {orderId}");
                // Don't throw - this is optional
            }
        }
    }
}
