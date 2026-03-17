import { useState, useEffect } from 'react';
import api from '../../../api';
import './DailyAttendance.css';

interface DailyAttendanceRecord {
  employeeId: string;
  employeeName: string;
  status: 'Present' | 'Absent' | 'On Leave';
  date: string;
}

export default function DailyAttendance() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<DailyAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDailyAttendance();
  }, [date]);

  const fetchDailyAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/attendance/daily?date=${date}`);
      setAttendance(response.data);
    } catch (err) {
      console.error('Error fetching daily attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="daily-attendance-container">
      <div className="attendance-summary-cards">
        <div className="summary-card">
          <h4>Total Employees</h4>
          <p className="count-value">{attendance.length}</p>
        </div>
        <div className="summary-card">
          <h4>Present</h4>
          <p className="count-value present">{attendance.filter(r => r.status === 'Present').length}</p>
        </div>
        <div className="summary-card">
          <h4>Absent</h4>
          <p className="count-value absent">{attendance.filter(r => r.status === 'Absent').length}</p>
        </div>
        <div className="summary-card">
          <h4>On Leave</h4>
          <p className="count-value on-leave" style={{ color: '#9a3412' }}>{attendance.filter(r => r.status === 'On Leave').length}</p>
        </div>
      </div>

      <div className="attendance-filters">
        <div className="filter-group">
          <label>Select Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="date-input"
          />
        </div>
      </div>

      <div className="attendance-table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={2} className="text-center py-4">Loading...</td></tr>
            ) : attendance.length > 0 ? (attendance.map(record => (
              <tr key={record.employeeId}>
                <td>{record.employeeName}</td>
                <td>
                  <span className={`status-badge status-${record.status.toLowerCase().replace(' ', '-')}`}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))) : (
              <tr><td colSpan={2} className="text-center py-4">No data available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
