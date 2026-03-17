using System.ComponentModel.DataAnnotations;

namespace LeaveManagementSystem.API.DTOs
{
    public class ApplyLeaveDto
    {
        [Required]
        public DateTime LeaveDate { get; set; }

        [Required]
        public string LeaveType { get; set; } = null!; // "Casual", "Sick", "Emergency"

        public string? Reason { get; set; }
    }
}
