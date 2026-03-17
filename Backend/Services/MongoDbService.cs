using LeaveManagementSystem.API.Models;
using LeaveManagementSystem.API.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace LeaveManagementSystem.API.Services
{
    public class MongoDbService
    {
        private readonly IMongoDatabase _database;

        public MongoDbService(IOptions<MongoDbSettings> mongoDbSettings)
        {
            var client = new MongoClient(mongoDbSettings.Value.ConnectionString);
            _database = client.GetDatabase(mongoDbSettings.Value.DatabaseName);
        }

        public IMongoCollection<Employee> Employees => _database.GetCollection<Employee>("Employees");
        public IMongoCollection<Leave> Leaves => _database.GetCollection<Leave>("Leaves");
        public IMongoCollection<LeaveBalance> LeaveBalances => _database.GetCollection<LeaveBalance>("LeaveBalances");
        public IMongoCollection<Order> Orders => _database.GetCollection<Order>("Orders");
        public IMongoCollection<Attendance> Attendances => _database.GetCollection<Attendance>("Attendances");
    }
}
