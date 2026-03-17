using LeaveManagementSystem.API.DTOs;
using LeaveManagementSystem.API.Models;
using LeaveManagementSystem.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;

namespace LeaveManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly MongoDbService _db;
        private readonly IConfiguration _configuration;

        public AuthController(MongoDbService db, IConfiguration configuration)
        {
            _db = db;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _db.Employees.Find(e => e.Email == request.Email).FirstOrDefaultAsync();

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            var token = GenerateJwtToken(user);
            return Ok(new AuthResponse { Token = token, UserId = user.Id!, Name = user.Name, Role = user.Role });
        }

        [HttpPost("setup")]
        public async Task<IActionResult> SetupAdmin()
        {
            var count = await _db.Employees.CountDocumentsAsync(Builders<Employee>.Filter.Empty);
            if (count > 0) return BadRequest("Admin already exists. Setup cannot be run.");

            var admin = new Employee
            {
                Name = "Admin User",
                Email = "admin@example.com",
                Role = "Admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123")
            };

            await _db.Employees.InsertOneAsync(admin);

            // Initialize Leave Balance for admin
            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;
            await _db.LeaveBalances.InsertOneAsync(new LeaveBalance { EmployeeId = admin.Id!, Month = currentMonth, Year = currentYear });

            return Ok(new { message = "Admin setup successful." });
        }

        private string GenerateJwtToken(Employee user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Secret"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id!),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(ClaimTypes.Name, user.Name)
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
