using Application.Interfaces.Content;
using Domain.Entities;
using Infrastructure.Content.Data;
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Content.Services
{
    public class ChatRepository : IChatRepository
    {
        private readonly CareProDbContext careProDbContext;


        public ChatRepository(CareProDbContext careProDbContext)
        {
            this.careProDbContext = careProDbContext;
        }

        public async Task SaveMessageAsync(ChatMessage chatMessage)
        {
            await careProDbContext.ChatMessages.AddAsync(chatMessage);
            await careProDbContext.SaveChangesAsync();
        }

        public async Task<List<ChatMessage>> GetChatHistoryAsync(string user1, string user2)
        {           
            return await careProDbContext.ChatMessages
                .Where(m => (m.SenderId == user1 && m.ReceiverId == user2) ||
                            (m.SenderId == user2 && m.ReceiverId == user1))
                .OrderBy(m => m.Timestamp)
                .ToListAsync();
        }
    }

}
