import './ManageEmployees.css';
import { useState, useEffect } from 'react';
import api from '../../../api';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function ManageEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const [showPassword, setShowPassword] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // Explicitly clear pre-filled browser data on mount
    setName('');
    setEmail('');
    setPassword('');
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/employees', { name, email, password, role });
      setName('');
      setEmail('');
      setPassword('');
      setRole('Employee');
      fetchEmployees();
    } catch (err) {
      alert('Error creating employee.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/employees/${id}`);
      await fetchEmployees();
      setDeletingId(null);
    } catch (err: any) {
      setDeletingId(null);
      alert(err.response?.data?.message || err.response?.data || 'Error deleting employee.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Manage Employees</h2>
      
      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8" autoComplete="off">
        <input 
          required 
          type="text" 
          placeholder="Name" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="px-3 py-2 border rounded-lg focus:ring-teal-500" 
          autoComplete="off"
        />
        <input 
          required 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          className="px-3 py-2 border rounded-lg focus:ring-teal-500" 
          autoComplete="new-email"
        />
        <div className="password-input-container">
          <input 
            required 
            type={showPassword ? 'text' : 'password'} 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full px-3 py-2 border rounded-lg focus:ring-teal-500 pr-14" 
            autoComplete="new-password"
          />
          <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle-btn text-slate-400 hover:text-slate-700"
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>
        <select value={role} onChange={e => setRole(e.target.value)} className="px-3 py-2 border rounded-lg focus:ring-teal-500">
          <option value="Employee">Employee</option>
          <option value="Admin">Admin</option>
        </select>
        <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors py-2">Add User</button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Role</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(e => (
              <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 text-slate-800 font-medium">{e.name}</td>
                <td className="p-3 text-slate-600">{e.email}</td>
                <td className="p-3 text-slate-600">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${e.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                    {e.role}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {deletingId === e.id ? (
                    <div className="flex gap-2 justify-end animate-in fade-in duration-300">
                      <button 
                        onClick={() => handleDelete(e.id)}
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
                      onClick={() => setDeletingId(e.id)} 
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-slate-500">No employees found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
