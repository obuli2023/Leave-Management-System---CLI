import './LeaveHistory.css';
import { useState, useEffect } from 'react';
import api from '../../../api';

interface Leave {
  id: string;
  leaveDate: string;
  leaveType: string;
  reason: string;
  status: string;
  isPaidLeave: boolean;
}

export default function LeaveHistory({ refreshFlag }: { refreshFlag?: boolean }) {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leaves/my-leaves');
      setLeaves(res.data.leaves);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [refreshFlag]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/leaves/delete/${id}`);
      await fetchLeaves();
      setDeletingId(null);
    } catch (err: any) {
      setDeletingId(null);
      alert(err.response?.data?.message || 'Error soft-deleting leave.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 mt-6">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Leave History</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Type</th>
              <th className="p-3 font-semibold">Reason</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Paid/Unpaid</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map(l => (
              <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-800">{l.leaveDate.split('T')[0].split('-').reverse().join('-')}</td>
                <td className="p-3 font-medium">{l.leaveType}</td>
                <td className="p-3 text-slate-600">{l.reason || '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                    ${l.status === 'Approved' ? 'bg-teal-100 text-teal-700' : 
                      l.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                      l.status === 'Deleted' ? 'bg-slate-200 text-slate-600' :
                      'bg-orange-100 text-orange-700'}`}>
                    {l.status}
                  </span>
                </td>
                <td className="p-3 text-slate-600">
                  {l.status === 'Approved' ? (l.isPaidLeave ? <span className="text-emerald-600 font-bold">Paid</span> : <span className="text-red-600 font-bold">Unpaid</span>) : '-'}
                </td>
                <td className="p-3">
                  {l.status === 'Pending' && (
                    <div className="flex flex-col gap-2">
                      {deletingId === l.id ? (
                        <div className="flex gap-2 animate-in fade-in duration-300">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(l.id);
                            }}
                            className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm hover:bg-red-700 transition-colors"
                          >
                            Confirm
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(null);
                            }}
                            className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold border border-slate-200 hover:bg-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeletingId(l.id);
                          }} 
                          style={{ cursor: 'pointer' }}
                          className="relative z-50 inline-block text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded border border-red-200 text-[10px] font-bold shadow-sm transition-all whitespace-nowrap"
                        >
                          Delete Request
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500">No leave history found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
