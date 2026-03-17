const baseURL = 'http://localhost:5242/api';
const adminEmail = 'admin@example.com';
const adminPassword = 'admin123';

async function run() {
  try {
    // 1. Login to get token
    console.log('Logging in...');
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Create a test employee
    console.log('Creating test employee...');
    const createRes = await fetch(`${baseURL}/employees`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ 
        name: 'Delete Test', 
        email: 'delete-test@example.com', 
        password: 'password123', 
        role: 'Employee' 
      })
    });
    const createData = await createRes.json();
    const id = createData.id;
    console.log(`Created employee with ID: ${id}`);

    // 3. Delete the test employee
    console.log(`Deleting employee with ID: ${id}...`);
    const deleteRes = await fetch(`${baseURL}/employees/${id}`, {
      method: 'DELETE',
      headers: headers
    });
    const deleteData = await deleteRes.json();
    console.log('Delete Response:', deleteData);

    console.log('Test PASSED: Employee created and deleted successfully.');
  } catch (err) {
    console.error('Test FAILED:', err.message);
  }
}

run();
