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
        Task<ClientDTO> CreateClientUserAsync(AddClientUserRequest addClientUserRequest);

        Task<ClientResponse> GetClientUserAsync(string clientId);

        Task<IEnumerable<ClientResponse>> GetAllClientUserAsync();

        Task<string> UpdateClientUserAsync(string clientId, UpdateClientUserRequest updateClientUserRequest );

    }
}
