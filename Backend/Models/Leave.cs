using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace LeaveManagementSystem.API.Models
{
    public class Leave
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string EmployeeId { get; set; } = null!;

        public DateTime LeaveDate { get; set; }

        public string LeaveType { get; set; } = null!; // "Casual", "Sick", "Emergency"

        public string? Reason { get; set; } // Required for Casual

        public string Status { get; set; } = "Pending"; // "Pending", "Approved", "Rejected", "Deleted"

        public bool IsPaidLeave { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
