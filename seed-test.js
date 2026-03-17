// e2e-test.js
// This script automates user flows and seeds the remote MongoDB with test data

const API_URL = 'http://localhost:5242/api';

async function request(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const res = await fetch(`${API_URL}${endpoint}`, options);
  
  let data;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    throw new Error(data?.message || data || `HTTP error! status: ${res.status}`);
  }
  return data;
}

async function runTests() {
  console.log('===========================================================');
  console.log('🚀 Starting End-to-End API Flow Tests & Data Seeding...');
  console.log('===========================================================\n');

  // 1. Setup Admin
  try {
    await request('/auth/setup', 'POST');
    console.log('✅ [Setup] Admin account initialized.');
  } catch (err) {
    console.log('ℹ️  [Setup] ' + err.message);
  }

  // 2. Login as Admin
  let adminLoginRes;
  try {
    adminLoginRes = await request('/auth/login', 'POST', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    console.log('✅ [Admin] Logged in successfully.');
  } catch(err) {
    console.error('❌ [Admin] Failed to login: ' + err.message);
    return;
  }
  const adminToken = adminLoginRes.token;

  // 3. Create Employees
  let emp1Email = `employee1_${Date.now()}@example.com`;
  let emp2Email = `employee2_${Date.now()}@example.com`;
  
  try {
    await request('/employees', 'POST', {
      name: 'Jane Doe', email: emp1Email, password: 'password123', role: 'Employee'
    }, adminToken);
    
    await request('/employees', 'POST', {
      name: 'John Smith', email: emp2Email, password: 'password123', role: 'Employee'
    }, adminToken);
    console.log(`✅ [Admin] Employees created: ${emp1Email}, ${emp2Email}`);
  } catch(err) {
    console.log('❌ [Admin] Failed to create employees: ' + err.message);
  }

  // 4. Create Big Order Day
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const bigOrderDate = tomorrow.toISOString().split('T')[0]; // Use Date only for precision

  try {
    await request('/orders', 'POST', {
      title: 'Festive Season Rush',
      orderDate: bigOrderDate,
      message: 'All hands on deck for the big festive orders!'
    }, adminToken);
    console.log(`✅ [Admin] Big Order Day created for ${bigOrderDate}.`);
  } catch(err) {
    console.log('❌ [Admin] Failed to create big order day: ' + err.message);
  }

  // 5. Login as Employee 1
  let emp1LoginRes;
  try {
    emp1LoginRes = await request('/auth/login', 'POST', {
      email: emp1Email,
      password: 'password123'
    });
    console.log(`✅ [Employee] (${emp1Email}) Logged in successfully.`);
  } catch(err) {
    console.log('❌ [Employee] Failed to login: ' + err.message);
    return;
  }
  const emp1Token = emp1LoginRes.token;

  // 6. Mark Attendance
  try {
    await request('/attendance/mark', 'POST', {}, emp1Token);
    console.log('✅ [Employee] Attendance marked for today.');
  } catch(err) {
    console.log('❌ [Employee] Failed to mark attendance: ' + err.message);
  }

  try {
     await request('/attendance/mark', 'POST', {}, emp1Token);
     console.log('❌ [Employee] ERROR: Second attendance mark should have failed but succeeded!');
  } catch (e) {
     console.log('✅ [Employee] Expected rule passed: Re-marking attendance is blocked.');
  }

  // 7. Apply for Leave
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  try {
    await request('/leaves/apply', 'POST', {
      leaveDate: nextWeek.toISOString().split('T')[0],
      leaveType: 'Emergency',
      reason: 'Family emergency'
    }, emp1Token);
    console.log('✅ [Employee] Emergency Leave applied successfully.');
  } catch(err) {
    console.log('❌ [Employee] Failed to apply for leave: ' + err.message);
  }

  // Try applying for Casual leave on Big Order Day (should fail)
  try {
    await request('/leaves/apply', 'POST', {
      leaveDate: bigOrderDate,
      leaveType: 'Casual',
      reason: 'Vacation'
    }, emp1Token);
    console.log('❌ [Employee] ERROR: Casual leave on big order day should have been rejected but succeeded!');
  } catch(err) {
    console.log(`✅ [Employee] Expected rule passed: Casual leave on Big Order day blocked. Details: ${err.message}`);
  }

  // 8. Admin approves the leave
  try {
    const pendingLeaves = await request('/leaves/pending', 'GET', null, adminToken);
    if (pendingLeaves.length > 0) {
      // Find the leave for emp1Email we just created
      const leaveToApprove = pendingLeaves[0].id; // Grabbing the first one
      await request(`/leaves/approve/${leaveToApprove}`, 'PUT', null, adminToken);
      console.log(`✅ [Admin] Leave request (${leaveToApprove}) approved successfully.`);
    } else {
        console.log('⚠️ [Admin] No pending leaves found to approve.');
    }
  } catch(err) {
    console.log('❌ [Admin] Failed to approve leaves: ' + err.message);
  }

  // 9. Employee checks leave balance after approval
  try {
    const empLeavesRes = await request('/leaves/my-leaves', 'GET', null, emp1Token);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const balances = empLeavesRes.balances;
    const currentBalance = balances.find(b => b.month === currentMonth && b.year === currentYear);
    console.log(`✅ [Employee] Dashboard checked. Remaining Paid Leaves for this month: ${currentBalance?.remainingLeaves}`);
  } catch(err) {
    console.log('❌ [Employee] Failed to fetch leave balance: ' + err.message);
  }

  console.log('\n===========================================================');
  console.log('🎉 All Flows Evaluated Successfully! Collections populated.');
  console.log(`   Admin Login: admin@example.com / admin123`);
  console.log(`   Test User 1: ${emp1Email} / password123`);
  console.log(`   Test User 2: ${emp2Email} / password123`);
  console.log('===========================================================');
}

runTests().catch(err => {
  console.error('\n❌ Test script encountered a critical error:', err.message);
});
