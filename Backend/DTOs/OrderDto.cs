namespace LeaveManagementSystem.API.DTOs
{
    public class CreateOrderDto
    {
        public string Title { get; set; } = null!;
        public DateTime OrderDate { get; set; }
        public string? Message { get; set; }
    }
}
