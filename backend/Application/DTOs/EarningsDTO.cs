using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class EarningsDTO
    {
        public string Id { get; set; }
        public string CaregiverId { get; set; }
        public decimal TotalEarned { get; set; }
        public decimal WithdrawableAmount { get; set; }
        public decimal WithdrawnAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class EarningsResponse
    {
        public string Id { get; set; }
        public string CaregiverId { get; set; }
        public string CaregiverName { get; set; }
        public decimal TotalEarned { get; set; }
        public decimal WithdrawableAmount { get; set; }
        public decimal WithdrawnAmount { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class CreateEarningsRequest
    {
        public string CaregiverId { get; set; }
        public decimal TotalEarned { get; set; }
        public decimal WithdrawableAmount { get; set; }
        public decimal WithdrawnAmount { get; set; }
    }

    public class UpdateEarningsRequest
    {
        public decimal? TotalEarned { get; set; }
        public decimal? WithdrawableAmount { get; set; }
        public decimal? WithdrawnAmount { get; set; }
    }
}
