using Infrastructure.Content.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CarePro_Api.Controllers.Content
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly ChatRepository _chatRepository;

        public ChatController(ChatRepository chatRepository)
        {
            _chatRepository = chatRepository;
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetChatHistory(string user1, string user2)
        {
            var messages = await _chatRepository.GetChatHistoryAsync(user1, user2);
            return Ok(messages);
        }


        [HttpGet("ChatPreview")]
        public async Task<IActionResult> GetChatUsersHistory(string userId)
        {
            var messages = await _chatRepository.GetChatUserPreviewAsync(userId);
            return Ok(messages);
        }
    }
}
