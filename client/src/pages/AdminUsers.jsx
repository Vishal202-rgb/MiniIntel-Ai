import React, { useState, useEffect } from 'react';
import { Users, Shield, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole });
      setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Failed to change role: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto text-neutral-200">
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-8 h-8 text-indigo-400" />
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">User Management</h1>
          <p className="text-neutral-400">Manage system access and roles.</p>
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-neutral-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-indigo-400">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            <span>Loading users...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/30 text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#222] text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Username</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Created At</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-[#222] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{user.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-neutral-800 text-neutral-300'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="bg-[#111] border border-neutral-700 text-white rounded px-2 py-1 outline-none focus:border-indigo-500 text-xs"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
