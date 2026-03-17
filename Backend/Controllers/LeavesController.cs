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
    public class LeavesController : ControllerBase
    {
        private readonly MongoDbService _db;

        public LeavesController(MongoDbService db)
        {
            _db = db;
        }

        [HttpPost("apply")]
        public async Task<IActionResult> Apply([FromBody] ApplyLeaveDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            // Block re-application if a non-deleted leave already exists for this date
            // Normalize to UTC midnight — prevents IST timezone offset from shifting the date back by 1 day in MongoDB
            var leaveDate = DateTime.SpecifyKind(dto.LeaveDate.Date, DateTimeKind.Utc);

            var nextDay = leaveDate.AddDays(1);
            var existing = await _db.Leaves.Find(l =>
                l.EmployeeId == userId &&
                l.LeaveDate >= leaveDate &&
                l.LeaveDate < nextDay &&
                l.Status != "Deleted"
            ).FirstOrDefaultAsync();

            if (existing != null)
                return BadRequest(new { message = $"A leave already exists for this date with status '{existing.Status}'. You can only re-apply after deleting a Pending leave." });

            var existingAttendance = await _db.Attendances.Find(a => 
                a.EmployeeId == userId && 
                a.Date >= leaveDate && 
                a.Date < nextDay)
                .FirstOrDefaultAsync();

            if (existingAttendance != null)
                return BadRequest(new { message = "You're working today and your attendance is already marked for this date." });

            var error = await ValidateLeaveRules(leaveDate, dto.LeaveType, dto.Reason);
            if (error != null) return BadRequest(new { message = error });

            var leave = new Leave
            {
                EmployeeId = userId,
                LeaveDate = leaveDate,
                LeaveType = dto.LeaveType,
                Reason = dto.Reason,
                Status = "Pending"
            };

            await _db.Leaves.InsertOneAsync(leave);
            return Ok(new { message = "Leave applied successfully.", leave });
        }

        [HttpPut("edit/{id}")]
        public async Task<IActionResult> Edit(string id, [FromBody] ApplyLeaveDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var leave = await _db.Leaves.Find(l => l.Id == id && l.EmployeeId == userId).FirstOrDefaultAsync();

            if (leave == null) return NotFound("Leave not found.");
            if (leave.Status != "Pending") return BadRequest("Only pending leaves can be edited.");
            if (leave.LeaveDate.Date < DateTime.UtcNow.Date) return BadRequest("Past leave dates cannot be edited.");

            var normalizedLeaveDate = DateTime.SpecifyKind(dto.LeaveDate.Date, DateTimeKind.Utc);

            var error = await ValidateLeaveRules(normalizedLeaveDate, dto.LeaveType, dto.Reason);
            if (error != null) return BadRequest(new { message = error });

            var update = Builders<Leave>.Update
                .Set(l => l.LeaveDate, normalizedLeaveDate)
                .Set(l => l.LeaveType, dto.LeaveType)
                .Set(l => l.Reason, dto.Reason)
                .Set(l => l.UpdatedAt, DateTime.UtcNow);

            await _db.Leaves.UpdateOneAsync(l => l.Id == id, update);
            return Ok(new { message = "Leave updated successfully." });
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var leave = await _db.Leaves.Find(l => l.Id == id && l.EmployeeId == userId).FirstOrDefaultAsync();

            if (leave == null) return NotFound("Leave not found.");
            if (leave.Status != "Pending") return BadRequest("Only pending leaves can be deleted.");
            if (leave.LeaveDate.Date < DateTime.UtcNow.Date) return BadRequest("Past leave dates cannot be deleted.");

            var update = Builders<Leave>.Update
                .Set(l => l.Status, "Deleted")
                .Set(l => l.UpdatedAt, DateTime.UtcNow);

            await _db.Leaves.UpdateOneAsync(l => l.Id == id, update);
            // Balance logic is only affected upon 'Approve', so deleting 'Pending' leave doesn't change balances.

            return Ok(new { message = "Leave marked as deleted." });
        }

        [HttpGet("my-leaves")]
        public async Task<IActionResult> GetMyLeaves()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var leaves = await _db.Leaves.Find(l => l.EmployeeId == userId).SortByDescending(l => l.LeaveDate).ToListAsync();
            
            // Also fetch leave balances for the dashboard
            var balances = await _db.LeaveBalances.Find(b => b.EmployeeId == userId).ToListAsync();
            
            return Ok(new { leaves, balances });
        }

        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPending()
        {
            var leaves = await _db.Leaves.Find(l => l.Status == "Pending").SortByDescending(l => l.LeaveDate).ToListAsync();
            var result = new List<object>();
            foreach (var l in leaves)
            {
                var emp = await _db.Employees.Find(e => e.Id == l.EmployeeId).FirstOrDefaultAsync();
                result.Add(new
                {
                    id = l.Id,
                    employeeId = l.EmployeeId,
                    employeeName = emp?.Name ?? "Unknown",
                    leaveDate = l.LeaveDate,
                    leaveType = l.LeaveType,
                    reason = l.Reason,
                    status = l.Status,
                    isPaidLeave = l.IsPaidLeave
                });
            }
            return Ok(result);
        }

        [HttpPut("approve/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(string id)
        {
            var leave = await _db.Leaves.Find(l => l.Id == id).FirstOrDefaultAsync();
            if (leave == null) return NotFound("Leave not found.");
            if (leave.Status != "Pending") return BadRequest($"Leave is already {leave.Status}.");

            // Calculate paid/unpaid
            var month = leave.LeaveDate.Month;
            var year = leave.LeaveDate.Year;

            var balance = await _db.LeaveBalances.Find(b => b.EmployeeId == leave.EmployeeId && b.Month == month && b.Year == year).FirstOrDefaultAsync();
            if (balance == null)
            {
                balance = new LeaveBalance { EmployeeId = leave.EmployeeId, Month = month, Year = year };
                await _db.LeaveBalances.InsertOneAsync(balance);
            }

            bool isPaid = false;
            if (balance.UsedLeaves < balance.TotalLeaves)
            {
                isPaid = true;
                await _db.LeaveBalances.UpdateOneAsync(
                    b => b.Id == balance.Id,
                    Builders<LeaveBalance>.Update.Inc(b => b.UsedLeaves, 1)
                );
            }

            var update = Builders<Leave>.Update
                .Set(l => l.Status, "Approved")
                .Set(l => l.IsPaidLeave, isPaid)
                .Set(l => l.UpdatedAt, DateTime.UtcNow);

            await _db.Leaves.UpdateOneAsync(l => l.Id == id, update);
            return Ok(new { message = "Leave approved.", isPaid });
        }

        [HttpPut("reject/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reject(string id)
        {
            var leave = await _db.Leaves.Find(l => l.Id == id).FirstOrDefaultAsync();
            if (leave == null) return NotFound("Leave not found.");
            if (leave.Status != "Pending") return BadRequest($"Leave is already {leave.Status}.");

            var update = Builders<Leave>.Update
                .Set(l => l.Status, "Rejected")
                .Set(l => l.UpdatedAt, DateTime.UtcNow);

            await _db.Leaves.UpdateOneAsync(l => l.Id == id, update);
            return Ok(new { message = "Leave rejected." });
        }

        [HttpGet("history")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetHistory([FromQuery] string? employeeId, [FromQuery] string? range, [FromQuery] DateTime? date)
        {
            var filterBuilder = Builders<Leave>.Filter;
            var filter = filterBuilder.Empty;

            if (!string.IsNullOrEmpty(employeeId))
            {
                filter &= filterBuilder.Eq(l => l.EmployeeId, employeeId);

                var today = DateTime.UtcNow.Date;
                if (range == "current_month")
                {
                    var startOfMonth = new DateTime(today.Year, today.Month, 1);
                    filter &= filterBuilder.Gte(l => l.LeaveDate, startOfMonth);
                }
                else if (range == "previous_month")
                {
                    var firstDayOfLastMonth = today.AddMonths(-1).AddDays(1 - today.Day);
                    var lastDayOfLastMonth = firstDayOfLastMonth.AddMonths(1).AddDays(-1);
                    filter &= filterBuilder.Gte(l => l.LeaveDate, firstDayOfLastMonth) & filterBuilder.Lte(l => l.LeaveDate, lastDayOfLastMonth);
                }
                else if (range == "last_3_months")
                {
                    var threeMonthsAgo = today.AddMonths(-3);
                    filter &= filterBuilder.Gte(l => l.LeaveDate, threeMonthsAgo);
                }
            }
            else if (date.HasValue)
            {
                // All-employees view for a specific date
                var utcDate = DateTime.SpecifyKind(date.Value.Date, DateTimeKind.Utc);
                var nextDay = utcDate.AddDays(1);
                filter &= filterBuilder.Gte(l => l.LeaveDate, utcDate) & filterBuilder.Lt(l => l.LeaveDate, nextDay);
            }
            else
            {
                return BadRequest("Either employeeId or date must be provided.");
            }

            // Exclude 'Deleted' leaves from history view
            filter &= filterBuilder.Ne(l => l.Status, "Deleted");

            var leaves = await _db.Leaves.Find(filter).SortByDescending(l => l.LeaveDate).ToListAsync();
            
            var result = new List<object>();
            foreach (var l in leaves)
            {
                var emp = await _db.Employees.Find(e => e.Id == l.EmployeeId).FirstOrDefaultAsync();
                result.Add(new
                {
                    id = l.Id,
                    employeeName = emp?.Name ?? "Unknown",
                    leaveDate = l.LeaveDate,
                    leaveType = l.LeaveType,
                    reason = l.Reason,
                    status = l.Status
                });
            }

            return Ok(result);
        }

        private async Task<string?> ValidateLeaveRules(DateTime leaveDate, string leaveType, string? reason)
        {
            var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
            // Preserve UTC kind when stripping time — avoids MongoDB kind mismatch
            leaveDate = DateTime.SpecifyKind(leaveDate.Date, DateTimeKind.Utc);

            if (leaveType == "Casual")
            {
                var minDate = today.AddDays(2);
                if (leaveDate < minDate) return "Casual Leave must be applied at least 2 days in advance (Today and Tomorrow are blocked).";
                if (string.IsNullOrWhiteSpace(reason)) return "Reason is required for Casual Leave.";

                // Compare using date range to avoid time-component mismatches in MongoDB
                var nextDay = leaveDate.AddDays(1);
                var bigOrder = await _db.Orders
                    .Find(o => o.OrderDate >= leaveDate && o.OrderDate < nextDay)
                    .FirstOrDefaultAsync();
                if (bigOrder != null) return "Casual Leave cannot be applied on Big Order Days.";
            }
            else if (leaveType == "Sick" || leaveType == "Emergency")
            {
                var oneWeekAgo = today.AddDays(-7);
                if (leaveDate < oneWeekAgo || leaveDate > today) 
                    return $"{leaveType} Leave can only be applied for Today or within the past 7 days.";
            }
            else
            {
                return "Invalid leave type.";
            }

            return null; // No errors
        }
    }
}
