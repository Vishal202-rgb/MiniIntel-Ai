import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Loader2, Lock, User, Mail, UserCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
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
        await axios.post('/api/auth/register', { username, email, password });
        await login(username, password);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <div className="w-full max-w-md bg-dark-card rounded-lg shadow-2xl border border-slate-700 p-5 relative overflow-hidden">
        
        {/* Decorative Top Accent — Blue for user identity */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-500"></div>

        {/* Back button (visible when registering, navigates back to sign-in) */}
        {isRegistering && (
          <button 
            onClick={() => setIsRegistering(false)}
            className="absolute top-6 left-6 text-slate-400 hover:text-neutral-300 transition-colors"
            aria-label="Back to Sign In"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Branding */}
        <div className="flex flex-col items-center text-center mb-5 mt-4">
          <div className="w-16 h-16 bg-blue-900/20 rounded-full flex items-center justify-center mb-4 ring-1 ring-blue-800/30">
            <UserCircle className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">MineIntel AI</h1>
          <p className="text-slate-400 text-sm">
            {isRegistering ? 'Create your account to get started.' : 'Sign in to your account.'}
          </p>
        </div>
        
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 bg-red-900/20 text-red-400 rounded-lg text-sm border border-red-900/30 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Enter your username"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-600 rounded-lg bg-dark-card/50 focus:bg-dark-card focus:ring-2 focus:ring-blue-500 text-white outline-none transition-all placeholder:text-neutral-600"
                value={username} onChange={e => setUsername(e.target.value)} required 
              />
            </div>
          </div>

          {/* Email (register only) */}
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="email" 
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-600 rounded-lg bg-dark-card/50 focus:bg-dark-card focus:ring-2 focus:ring-blue-500 text-white outline-none transition-all placeholder:text-neutral-600"
                  value={email} onChange={e => setEmail(e.target.value)} 
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-600 rounded-lg bg-dark-card/50 focus:bg-dark-card focus:ring-2 focus:ring-blue-500 text-white outline-none transition-all placeholder:text-neutral-600"
                value={password} onChange={e => setPassword(e.target.value)} required 
              />
            </div>
          </div>
          
          {/* Submit */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-900/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="text-sm">
            <span className="text-slate-400">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button 
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="ml-1.5 text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {isRegistering ? 'Sign in' : 'Register'}
            </button>
          </div>
          
          {/* Admin Portal link — subtle, only on sign-in */}
          {!isRegistering && (
            <div className="w-full border-t border-slate-700 pt-4 text-center">
              <button 
                type="button"
                onClick={() => navigate('/admin/login')}
                className="text-xs text-slate-400 hover:text-neutral-300 font-medium transition-colors tracking-wide"
              >
                Admin Portal &rarr;
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Login;
