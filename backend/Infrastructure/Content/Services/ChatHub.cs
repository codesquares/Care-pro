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

        public async Task SendMessage(string senderId, string receiverId, string message)
        {
            var chatMessage = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Message = message
            };

            await _chatRepository.SaveMessageAsync(chatMessage);

            await Clients.User(receiverId).SendAsync("ReceiveMessage", senderId, message);
        }
       
    }
}
