import './ApproveLeaves.css';
import { useState, useEffect } from 'react';
import api from '../../../api';

interface Leave {
  id: string;
  employeeName: string;
  leaveDate: string;
  leaveType: string;
  reason: string;
  status: string;
  isPaidLeave: boolean;
}

export default function ApproveLeaves() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [confirmingAction, setConfirmingAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leaves/pending');
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleActionClick = (id: string, action: 'approve' | 'reject') => {
    setConfirmingAction({ id, action });
  };

  const handleConfirmAction = async () => {
    if (!confirmingAction) return;
    
    try {
      await api.put(`/leaves/${confirmingAction.action}/${confirmingAction.id}`);
      setConfirmingAction(null);
      fetchLeaves();
    } catch (err: any) {
      alert(err.response?.data?.message || `Error attempting to ${confirmingAction.action} leave.`);
    }
  };

  const handleCancelAction = () => {
    setConfirmingAction(null);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Pending Leave Requests</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Type</th>
              <th className="p-3 font-semibold">Employee Name</th>
              <th className="p-3 font-semibold">Reason</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map(l => (
              <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-800">{l.leaveDate.split('T')[0].split('-').reverse().join('-')}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                    ${l.leaveType === 'Sick' ? 'bg-blue-100 text-blue-700' : 
                      l.leaveType === 'Casual' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {l.leaveType}
                  </span>
                </td>
                <td className="p-3 text-slate-800 font-medium">{l.employeeName}</td>
                <td className="p-3 text-slate-600 max-w-xs truncate">{l.reason || '-'}</td>
                <td className="p-3">
                  {confirmingAction?.id === l.id ? (
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleConfirmAction} 
                        className={`px-3 py-1 rounded text-sm font-medium text-white transition-colors ${confirmingAction.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={handleCancelAction} 
                        className="px-3 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <button onClick={() => handleActionClick(l.id, 'approve')} className="px-3 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded text-sm font-medium">Approve</button>
                      <button onClick={() => handleActionClick(l.id, 'reject')} className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-sm font-medium">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-500">No pending leave requests.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
