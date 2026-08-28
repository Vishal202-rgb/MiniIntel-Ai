import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Loader2, Lock, User, ShieldAlert, ArrowLeft } from 'lucide-react';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Pass requireAdmin = true to strictly reject non-admin users
      await login(username, password, true);
      navigate('/admin-dashboard');
    } catch (err) {
      logout(); // Instantly revoke token if any failure occurs
      setError(err.message || err.response?.data?.message || 'Admin authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900">
      <div className="w-full max-w-md bg-[#1A1A1A] rounded-2xl shadow-2xl border border-neutral-800 p-8 relative overflow-hidden">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>

        <button 
          onClick={() => navigate('/login')}
          className="absolute top-6 left-6 text-neutral-500 hover:text-neutral-300 transition-colors"
          aria-label="Back to User Login"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-8 mt-4">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Admin Portal</h1>
          <p className="text-neutral-400 text-sm">Secure access for authorized administrators only.</p>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-900/20 text-red-400 rounded-lg text-sm border border-red-900/30 flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Admin Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-700 rounded-lg bg-neutral-800/50 focus:bg-neutral-800 focus:ring-2 focus:ring-red-500 text-white outline-none transition-all placeholder:text-neutral-600"
                placeholder="Enter admin identity"
                value={username} onChange={e => setUsername(e.target.value)} required 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Secret Key</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
              <input 
                type="password" 
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-700 rounded-lg bg-neutral-800/50 focus:bg-neutral-800 focus:ring-2 focus:ring-red-500 text-white outline-none transition-all placeholder:text-neutral-600"
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required 
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mt-2 shadow-lg shadow-red-900/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authorize Access'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AdminLogin;
