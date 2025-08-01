using Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces.Content
{
    public interface IClientService
    {
        Task<ClientDTO> CreateClientUserAsync(AddClientUserRequest addClientUserRequest, string? origin);

        Task<string> ConfirmEmailAsync(string token);
        Task<string> ResendEmailConfirmationAsync(string email, string? origin);

        Task<ClientResponse> GetClientUserAsync(string clientId);

        Task<IEnumerable<ClientResponse>> GetAllClientUserAsync();

        Task<string> UpdateClientUserAsync(string clientId, UpdateClientUserRequest updateClientUserRequest );

        Task<string> UpdateProfilePictureAsync(string clientId, UpdateProfilePictureRequest updateProfilePictureRequest);


        Task<string> SoftDeleteClientAsync(string clientId);

        Task ResetPasswordAsync(ResetPasswordRequest resetPasswordRequest);

        Task GeneratePasswordResetTokenAsync(PasswordResetRequestDto passwordResetRequestDto);

        Task ResetPasswordWithJwtAsync(PasswordResetDto request);

    }
}
