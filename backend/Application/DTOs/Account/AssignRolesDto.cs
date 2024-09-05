using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Account
{
    public class AssignRolesDto
    {
        public string UserId { get; set; }
                
        public string Role { get; set; }
    }
}
