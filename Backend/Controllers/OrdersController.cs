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
    public class OrdersController : ControllerBase
    {
        private readonly MongoDbService _db;

        public OrdersController(MongoDbService db)
        {
            _db = db;
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
        {
            var existing = await _db.Orders.Find(o => o.OrderDate.Date == dto.OrderDate.Date).FirstOrDefaultAsync();
            if (existing != null) return BadRequest("An order already exists for this date.");

            var order = new Order
            {
                Title = dto.Title,
                OrderDate = dto.OrderDate.Date,
                Message = dto.Message
            };

            await _db.Orders.InsertOneAsync(order);
            return Ok(order);
        }

        [HttpGet("upcoming")]
        [Authorize]
        public async Task<IActionResult> GetUpcoming()
        {
            var today = DateTime.UtcNow.Date;
            var upcoming = await _db.Orders
                .Find(o => o.OrderDate >= today)
                .SortBy(o => o.OrderDate)
                .ToListAsync();

            return Ok(upcoming);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _db.Orders.DeleteOneAsync(o => o.Id == id);
            if (result.DeletedCount == 0) return NotFound();
            return Ok(new { message = "Order deleted." });
        }
    }
}
