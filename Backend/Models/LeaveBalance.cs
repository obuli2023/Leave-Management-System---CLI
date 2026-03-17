using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace LeaveManagementSystem.API.Models
{
    public class LeaveBalance
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string EmployeeId { get; set; } = null!;

        public int Month { get; set; }
        public int Year { get; set; }

        public int TotalLeaves { get; set; } = 2; // Default limit

        public int UsedLeaves { get; set; } = 0; // Automatically tracked

        public int RemainingLeaves => Math.Max(0, TotalLeaves - UsedLeaves);
    }
}
