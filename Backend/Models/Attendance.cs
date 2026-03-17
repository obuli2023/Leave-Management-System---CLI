using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace LeaveManagementSystem.API.Models
{
    public class Attendance
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string EmployeeId { get; set; } = null!;

        public DateTime Date { get; set; }

        public string Status { get; set; } = "Present"; // Always "Present" or "Absent"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
