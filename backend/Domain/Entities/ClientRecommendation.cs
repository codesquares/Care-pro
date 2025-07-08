using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MongoDB.Bson;

namespace Domain.Entities
{
    public class CaregiverRecommendation
    {
        public ObjectId Id { get; set; }
        public string CaregiverId { get; set; }
        public int MatchScore { get; set; }
        public List<string> MatchDetails { get; set; }
    }

    public class GigRecommendation
    {
        public ObjectId Id { get; set; }
        public string GigId { get; set; }
        public int MatchScore { get; set; }
        public List<string> MatchDetails { get; set; }
    }

    public class ClientRecommendation
    {
        public ObjectId Id { get; set; }
        public string ClientId { get; set; }
        public List<CaregiverRecommendation> CaregiverRecommendations { get; set; }
        public List<GigRecommendation> GigRecommendations { get; set; }
        public DateTime GeneratedAt { get; set; }
        public DateTime? UpdatedOn { get; set; }
    }
}
