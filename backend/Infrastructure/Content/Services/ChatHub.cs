using Application.DTOs;
using Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Content.Services
{
    public class ChatHub : Hub
    {
        private readonly ChatRepository _chatRepository;

        public ChatHub(ChatRepository chatRepository)
        {
            _chatRepository = chatRepository;
        }


        /// Connection Management
        public override async Task OnConnectedAsync()
        {
            // Get user ID from authenticated context
            var userId = Context.User.FindFirst("id")?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                // Associate connection ID with user ID
                await Groups.AddToGroupAsync(Context.ConnectionId, userId);

                // Set user as online
                await Clients.All.SendAsync("UserStatusChanged", userId, "Online");

                // Store user connection info in database/cache
                await _chatRepository.UpdateUserConnectionStatus(userId, true, Context.ConnectionId);
            }

            await base.OnConnectedAsync();
        }


        public override async Task OnDisconnectedAsync(Exception exception)
        {
            // Get user ID from authenticated context
            var userId = Context.User.FindFirst("id")?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                // Remove connection ID from user's group
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);

                // Set user as offline
                await Clients.All.SendAsync("UserStatusChanged", userId, "Offline");

                // Update user connection status in database/cache
                await _chatRepository.UpdateUserConnectionStatus(userId, false, null);
            }

            await base.OnDisconnectedAsync(exception);
        }


        /// Message Operations
        //public async Task SendMessage(string senderId, string receiverId, string message)
        //{
        //    try
        //    {
        //        var chatMessage = new ChatMessage
        //        {
        //            SenderId = senderId,
        //            ReceiverId = receiverId,
        //            Message = message,
        //            Timestamp = DateTime.UtcNow
        //        };

        //        await _chatRepository.SaveMessageAsync(chatMessage);

        //        await Clients.User(receiverId).SendAsync("ReceiveMessage", senderId, message);

        //    }
        //    catch (Exception)
        //    {

        //        await Clients.Caller.SendAsync("Error", "Message failed to send.");
        //    }

        //}


        public async Task<string> SendMessage(string senderId, string receiverId, string message)
        {
            // Validate input
            if (string.IsNullOrEmpty(senderId) || string.IsNullOrEmpty(receiverId) || string.IsNullOrEmpty(message))
            {
                throw new HubException("Invalid message parameters");
            }

            // Create message object
            //var messageId = Guid.NewGuid().ToString();
            //var timestamp = DateTime.UtcNow;

            var chatMessage = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Message = message,
                MessageId = Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow
            };

            // Save message to database
            await _chatRepository.SaveMessageAsync(chatMessage);

            // Send to recipient if online (their connection ID is in their user group)
            await Clients.Group(receiverId).SendAsync("ReceiveMessage", senderId, message, chatMessage.MessageId, "sent");

            // Return message ID to sender for tracking
            return chatMessage.MessageId;
        }


        public async Task<List<MessageDTO>> GetMessageHistory(string user1Id, string user2Id, int skip = 0, int take = 50)
        {
            // Get message history between two users
            var messages = await _chatRepository.GetMessageHistory(user1Id, user2Id, skip, take);
            return messages;
        }


        public async Task<bool> GetOnlineStatus(string userId)
        {
            // Check if user is online
            var isOnline = await _chatRepository.IsUserOnline(userId);
            return isOnline;
        }

        public async Task<List<string>> GetOnlineUsers()
        {
            // Get all online users
            var onlineUsers = await _chatRepository.GetOnlineUsers();
            return onlineUsers;
        }

        /// Message Status Update
        public async Task MessageReceived(string messageId)
        {
            // Update message status to "delivered"
            var message = await _chatRepository.UpdateMessageStatus(messageId, "delivered");

            // Notify sender that message was delivered
            if (message != null)
            {
                await Clients.Group(message.SenderId).SendAsync("MessageStatusChanged", messageId, "delivered");
            }
        }


        public async Task MessageRead(string messageId)
        {
            // Update message status to "read"
            var message = await _chatRepository.UpdateMessageStatus(messageId, "read");

            // Notify sender that message was read
            if (message != null)
            {
                await Clients.Group(message.SenderId).SendAsync("MessageStatusChanged", messageId, "read");
            }
        }


    }
}
