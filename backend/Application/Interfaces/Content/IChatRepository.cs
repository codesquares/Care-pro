using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces.Content
{
    public interface IChatRepository
    {
        Task SaveMessageAsync(ChatMessage chatMessage);

        Task<List<ChatMessage>> GetChatHistoryAsync(string user1, string user2);


    }
}
