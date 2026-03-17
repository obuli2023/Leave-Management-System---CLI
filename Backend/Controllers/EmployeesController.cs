using LeaveManagementSystem.API.DTOs;
using LeaveManagementSystem.API.Models;
using LeaveManagementSystem.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace LeaveManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class EmployeesController : ControllerBase
    {
        private readonly MongoDbService _db;

        public EmployeesController(MongoDbService db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var employees = await _db.Employees.Find(_ => true).ToListAsync();
            var result = employees.Select(e => new 
            { 
                id = e.Id, 
                name = e.Name, 
                email = e.Email, 
                role = e.Role, 
                createdAt = e.CreatedAt 
            });
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEmployeeDto dto)
        {
            var existing = await _db.Employees.Find(e => e.Email == dto.Email).FirstOrDefaultAsync();
            if (existing != null) return BadRequest("Email already in use.");

            var employee = new Employee
            {
                Name = dto.Name,
                Email = dto.Email,
                Role = dto.Role,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            await _db.Employees.InsertOneAsync(employee);

            // Initialize Leave Balance
            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;
            await _db.LeaveBalances.InsertOneAsync(new LeaveBalance { EmployeeId = employee.Id!, Month = currentMonth, Year = currentYear });

            return Ok(new { employee.Id, employee.Name, employee.Email, employee.Role });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] CreateEmployeeDto dto)
        {
            var filter = Builders<Employee>.Filter.Eq(e => e.Id, id);
            var update = Builders<Employee>.Update
                .Set(e => e.Name, dto.Name)
                .Set(e => e.Email, dto.Email)
                .Set(e => e.Role, dto.Role);
                
            if (!string.IsNullOrEmpty(dto.Password))
            {
                update = update.Set(e => e.PasswordHash, BCrypt.Net.BCrypt.HashPassword(dto.Password));
            }

            var result = await _db.Employees.UpdateOneAsync(filter, update);
            if (result.MatchedCount == 0) return NotFound();

            return Ok(new { message = "Employee updated." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _db.Employees.DeleteOneAsync(e => e.Id == id);
            if (result.DeletedCount == 0) return NotFound();

            // Cascade delete related data
            await _db.Leaves.DeleteManyAsync(l => l.EmployeeId == id);
            await _db.Attendances.DeleteManyAsync(a => a.EmployeeId == id);
            await _db.LeaveBalances.DeleteManyAsync(b => b.EmployeeId == id);

            return Ok(new { message = "Employee and related data deleted." });
        }
    }
}
