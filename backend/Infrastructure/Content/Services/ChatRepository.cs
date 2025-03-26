using Domain.Entities;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Content.Services
{
    public class ChatRepository
    {
        private readonly IMongoCollection<ChatMessage> _messages;

        public ChatRepository(IMongoDatabase database)
        {
            _messages = database.GetCollection<ChatMessage>("ChatMessages");
        }

        public async Task SaveMessageAsync(ChatMessage chatMessage)
        {
            await _messages.InsertOneAsync(chatMessage);
        }

        public async Task<List<ChatMessage>> GetChatHistoryAsync(string user1, string user2)
        {
            return await _messages.Find(m => (m.SenderId == user1 && m.ReceiverId == user2) ||
                                             (m.SenderId == user2 && m.ReceiverId == user1))
                                  .SortBy(m => m.Timestamp)
                                  .ToListAsync();
        }
    }

}
