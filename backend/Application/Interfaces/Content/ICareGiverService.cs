using Application.DTOs;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces.Content
{
    public interface ICareGiverService
    {
        Task<CaregiverDTO> CreateCaregiverUserAsync(AddCaregiverRequest addCaregiverRequest);

        Task<IEnumerable<CaregiverResponse>> GetAllCaregiverUserAsync();
        Task<CaregiverResponse> GetCaregiverUserAsync(string caregiverId);

        Task<string> UpdateCaregiverInfornmationAsync(string caregiverId, UpdateCaregiverAdditionalInfoRequest updateCaregiverAdditionalInfoRequest);

        Task<string> UpdateCaregiverAvailabilityAsync(string caregiverId, UpdateCaregiverAvailabilityRequest updateCaregiverAvailabilityRequest);

        Task<string> SoftDeleteCaregiverAsync(string caregiverId);

        Task ResetPasswordAsync( ResetPasswordRequest resetPasswordRequest);


        Task GeneratePasswordResetTokenAsync(PasswordResetRequestDto passwordResetRequestDto);
        Task ResetPasswordWithJwtAsync(PasswordResetDto request);

    }
}
