import { useState, useEffect } from 'react';
import api from '../../../api';
import './LeaveHistory.css';
import { FaRotateLeft } from 'react-icons/fa6';

interface LeaveRecord {
  id: string;
  employeeName: string;
  leaveDate: string;
  leaveType: string;
  reason: string;
  status: string;
}

interface Employee {
  id: string;
  name: string;
}

export default function LeaveHistory() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [viewMode, setViewMode] = useState<'date' | 'employee'>('date'); // default to date view
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [range, setRange] = useState<string>('current_month');
  const [history, setHistory] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Load employees (excluding admins) on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get('/employees');
        // Filter out admin employees
        const nonAdmin = response.data.filter((e: any) => e.role !== 'Admin');
        setEmployees(nonAdmin);
      } catch (err) {
        console.error('Error fetching employees:', err);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch history whenever filter criteria change
  useEffect(() => {
    const fetchHistory = async () => {
      if (viewMode === 'employee' && !selectedEmployee) {
        setHistory([]);
        return;
      }
      if (viewMode === 'date' && !selectedDate) {
        setHistory([]);
        return;
      }

      setLoading(true);
      try {
        let url = '/leaves/history?';
        if (viewMode === 'employee') {
          url += `employeeId=${selectedEmployee}&range=${range}`;
        } else {
          url += `date=${selectedDate}`;
        }
        const response = await api.get(url);
        setHistory(response.data);
      } catch (err) {
        console.error('Error fetching history:', err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [selectedEmployee, selectedDate, range, viewMode]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEmployee(e.target.value);
    setRange('current_month');
  };

  const toggleViewMode = (mode: 'date' | 'employee') => {
    setViewMode(mode);
    setHistory([]);
    if (mode === 'date') {
      setSelectedEmployee('');
      if (!selectedDate) setSelectedDate(new Date().toISOString().split('T')[0]);
    } else {
      setSelectedDate('');
      setRange('current_month');
    }
  };

  const handleReset = () => {
    setViewMode('date');
    setSelectedEmployee('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setRange('current_month');
    setHistory([]);
  };

  const isDefault = viewMode === 'date' && 
                    selectedDate === new Date().toISOString().split('T')[0] && 
                    selectedEmployee === '' && 
                    range === 'current_month';

  return (
    <div className="leave-history-container">
      <div className="view-mode-toggle">
        <button 
          className={`mode-btn ${viewMode === 'date' ? 'active' : ''}`}
          onClick={() => toggleViewMode('date')}
        >
          View All by Date
        </button>
        <button 
          className={`mode-btn ${viewMode === 'employee' ? 'active' : ''}`}
          onClick={() => toggleViewMode('employee')}
        >
          View by Employee
        </button>
      </div>

      <div className="history-filters">
        {viewMode === 'employee' ? (
          <>
            <div className="filter-group">
              <label>Employee</label>
              <select value={selectedEmployee} onChange={handleEmployeeChange}>
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            {selectedEmployee && (
              <div className="filter-group">
                <label>Range</label>
                <select value={range} onChange={e => setRange(e.target.value)}>
                  <option value="current_month">Current Month</option>
                  <option value="previous_month">Previous Month</option>
                  <option value="last_3_months">Last 3 Months</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            )}
          </>
        ) : (
          <div className="filter-group">
            <label>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
        )}

        <div className="filter-group">
          <label className="invisible block mb-2">Reset</label>
          <button 
            type="button" 
            onClick={handleReset}
            disabled={isDefault}
            className={`p-2 rounded-lg border transition-colors flex items-center justify-center ${
              isDefault 
                ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200' 
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 shadow-sm'
            }`}
            title={isDefault ? 'Already at default filters' : 'Reset to Default'}
          >
            <FaRotateLeft size={18} />
          </button>
        </div>
      </div>

      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
            ) : history.length > 0 ? (
              history.map(record => (
                <tr key={record.id}>
                  <td>{formatDate(record.leaveDate)}</td>
                  <td>{record.employeeName}</td>
                  <td><span className={`status-badge type-${record.leaveType.toLowerCase()}`}>{record.leaveType}</span></td>
                  <td>{record.reason}</td>
                  <td><span className={`status-badge status-${record.status.toLowerCase()}`}>{record.status}</span></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-4">No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
