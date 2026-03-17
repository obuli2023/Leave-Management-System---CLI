import './Dashboard.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import ApplyLeave from '../ApplyLeave';
import LeaveHistory from '../LeaveHistory';
import api from '../../../api';

export default function EmployeeDashboard() {
  const { name, logout } = useAuth();
  const [balance, setBalance] = useState<number>(2);
  const [attendanceMsg, setAttendanceMsg] = useState('');
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [upcomingOrders, setUpcomingOrders] = useState<{title: string, orderDate: string}[]>([]);
  const [isOnLeaveToday, setIsOnLeaveToday] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leavesRes = await api.get('/leaves/my-leaves');
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const bal = leavesRes.data.balances?.find((b: any) => b.month === currentMonth && b.year === currentYear);
        if (bal) setBalance(bal.remainingLeaves);

        // Check if there is an approved leave for today
        const todayStr = new Date().toISOString().split('T')[0];
        const todayLeave = leavesRes.data.leaves?.find((l: any) => 
          l.leaveDate.split('T')[0] === todayStr && l.status === 'Approved'
        );
        if (todayLeave) {
          setIsOnLeaveToday(true);
          setAttendanceMsg('You have an approved leave for today.');
        } else {
          setIsOnLeaveToday(false);
        }

        const ordersRes = await api.get('/orders/upcoming');
        setUpcomingOrders(ordersRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [refreshFlag]);

  const markAttendance = async () => {
    try {
      const today = new Date();
      const localStringDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      await api.post('/attendance/mark', { localStringDate });
      setAttendanceMsg('Attendance marked successfully!');
    } catch (err: any) {
      setAttendanceMsg(err.response?.data?.message || 'Error marking attendance.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-4">
            <img src="/assets/logo.png" alt="Cotton Leaf India" className="h-16 w-16 object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Employee Dashboard</h1>
              <p className="text-slate-500">Welcome, {name}</p>
            </div>
          </div>
          <button onClick={logout} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors">
            Sign Out
          </button>
        </div>

        {upcomingOrders.length > 0 && (
          <div className="bg-orange-50 p-4 rounded-xl shadow-sm border border-orange-200">
            <h3 className="font-bold text-orange-800 mb-2 flex items-center">
              <span className="mr-2">🔥</span> Important Alert: Upcoming Big Order Days
            </h3>
            <ul className="list-disc list-inside text-orange-700 text-sm space-y-1">
              {upcomingOrders.map((o, i) => (
                <li key={i}><strong>{o.orderDate.split('T')[0].split('-').reverse().join('-')}</strong> - {o.title}</li>
              ))}
            </ul>
            <p className="text-xs text-orange-600 mt-2">* Casual leaves are not permitted on these dates.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center items-center">
            <h3 className="font-semibold text-slate-700 mb-4">Mark Daily Attendance</h3>
            <button 
              onClick={markAttendance} 
              disabled={isOnLeaveToday}
              className={`px-6 py-3 font-bold rounded-xl shadow-md transition-all ${
                isOnLeaveToday 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              {isOnLeaveToday ? 'On Leave' : 'Mark Present'}
            </button>
            {attendanceMsg && <p className="mt-3 text-sm font-medium text-slate-600">{attendanceMsg}</p>}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center items-center">
            <h3 className="font-semibold text-slate-700 mb-2">This Month's Paid Leave Balance</h3>
            <p className="text-4xl font-extrabold text-teal-600">{balance} <span className="text-lg text-slate-500 font-normal">remaining</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ApplyLeave onLeaveApplied={() => setRefreshFlag(f => !f)} />
          </div>
          <div className="lg:col-span-2">
            <LeaveHistory refreshFlag={refreshFlag} />
          </div>
        </div>
      </div>
    </div>
  );
}
