using Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IServiceServices
    {
        Task<ServiceDTO> CreateServiceAsync(AddServiceRequest addServiceRequest);

        Task<IEnumerable<ServiceDTO>> GetAllServicesAsync(string caregiverId);

        Task<ServiceDTO> GetServiceAsync(string serviceId);

    }
}
