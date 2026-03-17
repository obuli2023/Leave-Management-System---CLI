import './ApplyLeave.css';
import { useState, useEffect } from 'react';
import api from '../../../api';
import { FaArrowRotateLeft } from 'react-icons/fa6';

export default function ApplyLeave({ onLeaveApplied }: { onLeaveApplied?: () => void }) {
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveType, setLeaveType] = useState('Casual');
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const getMinMaxDate = () => {
    const today = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    if (leaveType === 'Casual') {
      const minDate = new Date(today);
      minDate.setDate(today.getDate() + 2);
      return { min: formatDate(minDate), max: undefined };
    } else {
      // Sick or Emergency - last 7 days + today
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return { min: formatDate(weekAgo), max: formatDate(today) };
    }
  };

  const { min, max } = getMinMaxDate();

  useEffect(() => {
    let timer: number;
    if (success || error) {
      timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [success, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    
    // Validate using local string comparisons to avoid timezone shift issues
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = formatDate(new Date());
    
    if (leaveType === 'Casual') {
      const minDate = new Date();
      minDate.setDate(new Date().getDate() + 2);
      const minStr = formatDate(minDate);
      
      if (leaveDate < minStr) {
        setError('Casual Leave must be applied at least 2 days in advance.');
        return;
      }
    } else {
      const weekAgo = new Date();
      weekAgo.setDate(new Date().getDate() - 7);
      const weekAgoStr = formatDate(weekAgo);

      if (leaveDate < weekAgoStr || leaveDate > todayStr) {
        setError(`${leaveType} Leave can only be applied for Today or within the past 7 days.`);
        return;
      }
    }

    try {
      await api.post('/leaves/apply', { leaveDate, leaveType, reason });
      setSuccess('Leave applied successfully.');
      setLeaveDate('');
      setReason('');
      setLeaveType('Casual');
      onLeaveApplied?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to apply for leave.');
    }
  };

  const handleReset = () => {
    setLeaveDate('');
    setLeaveType('Casual');
    setReason('');
    setSuccess('');
    setError('');
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 mt-6">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Apply for Leave</h2>
      
      {success && <div className="mb-4 text-emerald-700 bg-emerald-50 p-3 rounded-lg font-medium">{success}</div>}
      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Leave Date</label>
          <input 
            type="date" 
            required
            min={min}
            max={max}
            value={leaveDate}
            onChange={e => setLeaveDate(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Leave Type</label>
          <select 
            value={leaveType}
            onChange={e => setLeaveType(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-teal-500"
          >
            <option value="Casual">Casual Leave</option>
            <option value="Sick">Sick Leave</option>
            <option value="Emergency">Emergency Leave</option>
          </select>
        </div>

        {leaveType === 'Casual' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Reason</label>
            <textarea 
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-teal-500"
              placeholder="Provide a valid reason for casual leave..."
            ></textarea>
          </div>
        )}

        {(leaveType === 'Sick' || leaveType === 'Emergency') && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Reason (Optional)</label>
            <textarea 
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-teal-500"
              placeholder="Optional message..."
            ></textarea>
          </div>
        )}

        <div className="flex gap-4">
          <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
            Submit Leave Request
          </button>
          <button 
            type="button" 
            onClick={handleReset}
            className="p-3 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors flex items-center justify-center"
            title="Reset Form"
          >
            <FaArrowRotateLeft size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
