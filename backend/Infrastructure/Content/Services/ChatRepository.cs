using Application.DTOs;
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



        //public async Task<IEnumerable<ChatPreviewResponse>> GetChatUserPreviewAsync(string userId)
        //{
        //    var latestMessages = await careProDbContext.ChatMessages
        //        .Where(x => x.SenderId == userId || x.ReceiverId == userId)
        //        .GroupBy(x => x.SenderId.CompareTo(x.ReceiverId) < 0
        //                        ? new { User1 = x.SenderId, User2 = x.ReceiverId }
        //                        : new { User1 = x.ReceiverId, User2 = x.SenderId })
        //        .Select(g => g.OrderByDescending(m => m.Timestamp).FirstOrDefault()) // get latest message in each unique conversation
        //        .ToListAsync();

        //    var userIds = latestMessages
        //        .Select(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
        //        .Distinct()
        //        .ToList();

        //    var appUsers = await careProDbContext.AppUsers
        //        .Where(u => userIds.Contains(u.Id.ToString()))
        //        .ToListAsync();

        //    var result = latestMessages
        //        .Select(m =>
        //        {
        //            var chatPartnerId = m.SenderId == userId ? m.ReceiverId : m.SenderId;
        //            var user = appUsers.FirstOrDefault(u => u.Id.ToString() == chatPartnerId);

        //            if (user == null) return null;

        //            return new ChatPreviewResponse
        //            {
        //                FullName = user.FirstName + " " + user.LastName,
        //                AppUserId = user.AppUserId.ToString(),
        //                Email = user.Email,
        //                Role = user.Role,
        //                LastMessage = m.Message,
        //                LastMessageTimestamp = m.Timestamp
        //            };
        //        })
        //        .Where(x => x != null)
        //        .OrderByDescending(x => x.LastMessageTimestamp)
        //        .ToList();

        //    return result;

        //}



        public async Task<IEnumerable<ChatPreviewResponse>> GetChatUserPreviewAsync(string userId)
        {
            // Step 1: Fetch messages involving the user into memory
            var messages = await careProDbContext.ChatMessages
                .Where(x => x.SenderId == userId || x.ReceiverId == userId)
                .ToListAsync(); // Bring data into memory first

            // Step 2: Group by unique conversation pair (ignores order of sender/receiver)
            var latestMessages = messages
                .GroupBy(x => string.Compare(x.SenderId, x.ReceiverId) < 0
                                ? new { User1 = x.SenderId, User2 = x.ReceiverId }
                                : new { User1 = x.ReceiverId, User2 = x.SenderId })
                .Select(g => g.OrderByDescending(m => m.Timestamp).FirstOrDefault())
                .Where(m => m != null)
                .ToList();

            // Step 3: Extract IDs of chat partners
            var userIds = latestMessages
                .Select(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Distinct()
                .ToList();

            // Step 4: Fetch user profiles for chat partners
            var appUsers = await careProDbContext.AppUsers
                .Where(u => userIds.Contains(u.Id.ToString()))
                .ToListAsync();

            // Step 5: Build chat preview responses
            var result = latestMessages
                .Select(m =>
                {
                    var chatPartnerId = m.SenderId == userId ? m.ReceiverId : m.SenderId;
                    var user = appUsers.FirstOrDefault(u => u.Id.ToString() == chatPartnerId);

                    if (user == null) return null;

                    return new ChatPreviewResponse
                    {
                        FullName = user.FirstName + " " + user.LastName,
                        AppUserId = user.AppUserId.ToString(),
                        Email = user.Email,
                        Role = user.Role,
                        LastMessage = m.Message,
                        LastMessageTimestamp = m.Timestamp
                    };
                })
                .Where(x => x != null)
                .OrderByDescending(x => x.LastMessageTimestamp)
                .ToList();

            return result;
        }



    }

}
