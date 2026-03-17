import './Dashboard.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import ApproveLeaves from '../ApproveLeaves';
import ManageOrders from '../ManageOrders';
import ManageEmployees from '../ManageEmployees';
import LeaveHistory from '../LeaveHistory';
import DailyAttendance from '../DailyAttendance';
import api from '../../../api';

export default function AdminDashboard() {
  const { name, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'leaves' | 'orders' | 'employees' | 'history' | 'attendance'>('leaves');
  const [stats, setStats] = useState({ pending: 0, todayAttendance: 0, upcomingOrders: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [leaves, attendance, orders] = await Promise.all([
          api.get('/leaves/pending'),
          api.get('/attendance/today'),
          api.get('/orders/upcoming')
        ]);
        setStats({
          pending: leaves.data.length,
          todayAttendance: attendance.data.length,
          upcomingOrders: orders.data.length
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-4">
            <img src="/assets/logo.png" alt="Cotton Leaf India" className="h-16 w-16 object-contain drop-shadow-md" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
              <p className="text-slate-500">Welcome back, {name}</p>
            </div>
          </div>
          <button onClick={logout} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors">
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-2">Pending Leaves</h3>
            <p className="text-3xl font-bold text-teal-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-2">Today's Attendance</h3>
            <p className="text-3xl font-bold text-teal-600">{stats.todayAttendance} <span className="text-lg text-slate-500 font-normal">present</span></p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-2">Upcoming Orders</h3>
            <p className="text-3xl font-bold text-teal-600">{stats.upcomingOrders}</p>
          </div>
        </div>

        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          <button onClick={() => setActiveTab('leaves')} className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'leaves' ? 'bg-teal-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Leave Requests</button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'history' ? 'bg-teal-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Leave History</button>
          <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'attendance' ? 'bg-teal-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Daily Attendance</button>
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'orders' ? 'bg-teal-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Big Orders</button>
          <button onClick={() => setActiveTab('employees')} className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'employees' ? 'bg-teal-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Employees</button>
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'leaves' && <ApproveLeaves />}
          {activeTab === 'history' && <LeaveHistory />}
          {activeTab === 'attendance' && <DailyAttendance />}
          {activeTab === 'orders' && <ManageOrders />}
          {activeTab === 'employees' && <ManageEmployees />}
        </div>
      </div>
    </div>
  );
}
