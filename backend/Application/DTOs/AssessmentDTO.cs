using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class AssessmentDTO
    {
        public string Id { get; set; }
        public string CaregiverId { get; set; }
        public DateTime AssessedDate { get; set; }
        public List<string> Questions { get; set; }
        public string Status { get; set; }
        public int Score { get; set; }
    }

    public class AddAssessmentRequest
    {
        public string CaregiverId { get; set; }
        public List<string> Questions { get; set; }
        public string Status { get; set; }
        public int Score { get; set; }
    }
}
