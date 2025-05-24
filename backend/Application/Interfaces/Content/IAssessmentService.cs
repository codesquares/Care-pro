using Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces.Content
{
    public interface IAssessmentService
    {
        Task<string> CreateAssessementAsync(AddAssessmentRequest addAssessmentRequest);

        Task<AssessmentDTO> GetAssesementAsync(string caregiverId);

    }
}
