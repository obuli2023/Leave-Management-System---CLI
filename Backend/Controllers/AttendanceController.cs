using LeaveManagementSystem.API.DTOs;
using LeaveManagementSystem.API.Models;
using LeaveManagementSystem.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Claims;

namespace LeaveManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly MongoDbService _db;

        public AttendanceController(MongoDbService db)
        {
            _db = db;
        }

        [HttpPost("mark")]
        public async Task<IActionResult> MarkAttendance([FromBody] MarkAttendanceDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            // Use the explicit local date sent from the frontend to match the Leave application logic exactly.
            var today = DateTime.SpecifyKind(dto.LocalStringDate.Date, DateTimeKind.Utc);

            var existing = await _db.Attendances
                .Find(a => a.EmployeeId == userId && a.Date == today)
                .FirstOrDefaultAsync();

            if (existing != null) return BadRequest(new { message = "Attendance already marked for today." });

            var approvedLeave = await _db.Leaves
                .Find(l => l.EmployeeId == userId && l.LeaveDate == today && l.Status == "Approved")
                .FirstOrDefaultAsync();

            if (approvedLeave != null) return BadRequest(new { message = "You have an approved leave for today." });

            var attendance = new Attendance
            {
                EmployeeId = userId,
                Date = today,
                Status = "Present"
            };

            await _db.Attendances.InsertOneAsync(attendance);
            return Ok(new { message = "Attendance marked successfully." });
        }

        [HttpGet("today")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetTodayAttendance()
        {
            var today = DateTime.UtcNow.Date;
            var employees = await _db.Employees.Find(e => e.Role == "Employee").ToListAsync();
            var employeeIds = employees.Select(e => e.Id).ToList();
            
            var attendances = await _db.Attendances.Find(a => a.Date == today && employeeIds.Contains(a.EmployeeId)).ToListAsync();
            
            return Ok(attendances);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var history = await _db.Attendances
                .Find(a => a.EmployeeId == userId)
                .SortByDescending(a => a.Date)
                .ToListAsync();

            return Ok(history);
        }

        [HttpGet("daily")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetDailyAttendance([FromQuery] DateTime date)
        {
            // Normalize to UTC midnight to match how attendance is stored (DateTime.UtcNow.Date)
            var targetDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);

            // Only fetch non-admin employees
            var employees = await _db.Employees.Find(e => e.Role == "Employee").ToListAsync();
            var attendances = await _db.Attendances.Find(a => a.Date == targetDate).ToListAsync();
            var leaves = await _db.Leaves.Find(l => l.LeaveDate == targetDate && l.Status == "Approved").ToListAsync();

            var result = employees.Select(e => {
                var hasAttendance = attendances.Any(a => a.EmployeeId == e.Id);
                var hasApprovedLeave = leaves.Any(l => l.EmployeeId == e.Id);
                
                string status = "Absent";
                if (hasAttendance) status = "Present";
                else if (hasApprovedLeave) status = "On Leave";

                return new
                {
                    employeeId = e.Id,
                    employeeName = e.Name,
                    status = status,
                    date = targetDate
                };
            });

            return Ok(result);
        }
    }
}
