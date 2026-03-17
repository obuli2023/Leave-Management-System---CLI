using System.ComponentModel.DataAnnotations;

namespace LeaveManagementSystem.API.DTOs
{
    public class MarkAttendanceDto
    {
        [Required]
        public DateTime LocalStringDate { get; set; }
    }
}
