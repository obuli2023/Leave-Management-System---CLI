using LeaveManagementSystem.API.Models;
using LeaveManagementSystem.API.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace LeaveManagementSystem.API.Services
{
    public class MongoDbService
    {
        private readonly IMongoDatabase _database;

        public MongoDbService(IOptions<MongoDbSettings> mongoDbSettings, IConfiguration configuration)
        {
            var connectionString = mongoDbSettings.Value.ConnectionString;
            var databaseName = mongoDbSettings.Value.DatabaseName;

            // Fallback for Cloud environments (like Render/Docker) where flat variables are easier to set
            if (string.IsNullOrEmpty(connectionString))
            {
                connectionString = configuration["MONGODB_CONNECTION_STRING"];
            }
            if (string.IsNullOrEmpty(databaseName))
            {
                databaseName = configuration["MONGODB_DATABASE_NAME"];
            }

            if (string.IsNullOrEmpty(connectionString))
            {
                throw new Exception("MongoDB Connection String is missing. Set it in appsettings.json or via the MONGODB_CONNECTION_STRING environment variable.");
            }

            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName ?? "LeaveManagementSystem");
        }

        public IMongoCollection<Employee> Employees => _database.GetCollection<Employee>("Employees");
        public IMongoCollection<Leave> Leaves => _database.GetCollection<Leave>("Leaves");
        public IMongoCollection<LeaveBalance> LeaveBalances => _database.GetCollection<LeaveBalance>("LeaveBalances");
        public IMongoCollection<Order> Orders => _database.GetCollection<Order>("Orders");
        public IMongoCollection<Attendance> Attendances => _database.GetCollection<Attendance>("Attendances");
    }
}
