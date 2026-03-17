import './ManageOrders.css';
import { useState, useEffect } from 'react';
import api from '../../../api';

interface Order {
  id: string;
  title: string;
  orderDate: string;
  message: string;
}

export default function ManageOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [title, setTitle] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [message, setMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/upcoming');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/orders/create', { title, orderDate, message });
      setTitle('');
      setOrderDate('');
      setMessage('');
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data || 'Error creating order.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/orders/${id}`);
      await fetchOrders();
      setDeletingId(null);
    } catch (err) {
      setDeletingId(null);
      alert('Error deleting order.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Big Order Days</h2>
      
      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 bg-orange-50 rounded-xl border border-orange-100">
        <input required type="text" placeholder="Title (e.g. Summer Release)" value={title} onChange={e => setTitle(e.target.value)} className="px-3 py-2 border rounded-lg focus:ring-orange-500" />
        <input required type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="px-3 py-2 border rounded-lg focus:ring-orange-500" />
        <input type="text" placeholder="Message (optional)" value={message} onChange={e => setMessage(e.target.value)} className="px-3 py-2 border rounded-lg focus:ring-orange-500" />
        <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors py-2">Add Date</button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Title</th>
              <th className="p-3 font-semibold">Message</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-medium text-orange-600">{o.orderDate.split('T')[0].split('-').reverse().join('-')}</td>
                <td className="p-3 text-slate-800">{o.title}</td>
                <td className="p-3 text-slate-600">{o.message || '-'}</td>
                <td className="p-3">
                  {deletingId === o.id ? (
                    <div className="flex gap-2 animate-in fade-in duration-300">
                      <button 
                        onClick={() => handleDelete(o.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => setDeletingId(null)}
                        className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-bold hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeletingId(o.id)} 
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-slate-500">No upcoming big orders.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
