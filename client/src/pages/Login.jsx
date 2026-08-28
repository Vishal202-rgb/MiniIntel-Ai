import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Loader2, Lock, User } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        const res = await axios.post('/api/auth/register', { username, password });
        await login(username, password);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#111111]">
      <div className="w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">MineIntel AI</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Sign in to your account</p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 dark:bg-red-900/20 dark:border-red-900/30">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-shadow"
                value={username} onChange={e => setUsername(e.target.value)} required 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input 
                type="password" 
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-shadow"
                value={password} onChange={e => setPassword(e.target.value)} required 
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegistering ? 'Register' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-neutral-500">
            {isRegistering ? 'Already have an account?' : 'Need an account?'}
          </span>
          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="ml-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {isRegistering ? 'Sign in' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
