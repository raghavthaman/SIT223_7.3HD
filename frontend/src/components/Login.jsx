import React, { useState } from 'react';
import axios from 'axios';
import { Lock, User as UserIcon, LogIn, AlertCircle, UserPlus, KeyRound } from 'lucide-react';

export default function Login({ setAuth }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLoginView) {
        const response = await axios.post('/api/auth/login', { email, password });
        const { token, role: userRole, email: userEmail, _id } = response.data;
        const userData = { token, role: userRole, email: userEmail, id: _id };
        localStorage.setItem('auth', JSON.stringify(userData));
        setAuth(userData);
      } else {
        const response = await axios.post('/api/auth/register', { email, password, role });
        const { token, role: userRole, email: userEmail, _id } = response.data;
        const userData = { token, role: userRole, email: userEmail, id: _id };
        localStorage.setItem('auth', JSON.stringify(userData));
        setAuth(userData);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isLoginView ? 'authenticate' : 'register'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-200 flex items-center justify-center p-4 selection:bg-blue-200">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 transform transition-all">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/30">
            {isLoginView ? <KeyRound className="w-8 h-8 text-white" /> : <UserPlus className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isLoginView ? 'Secure Access' : 'Create Account'}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Smart Waste Management System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-slate-50/50 transition-all font-medium text-slate-900 placeholder-slate-400"
                placeholder={isLoginView ? "admin@system.local" : "newdriver@example.com"}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-slate-50/50 transition-all font-medium text-slate-900 placeholder-slate-400"
                placeholder="••••••••"
                required
                minLength={4}
              />
            </div>
          </div>

          {!isLoginView && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">System Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-slate-50/50 transition-all font-medium text-slate-900"
              >
                <option value="user">Standard User</option>
                <option value="driver">Truck Driver</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? 'Processing...' : (
              <>
                {isLoginView ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                {isLoginView ? 'Sign In' : 'Register Account'}
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-100 px-2 text-center">
          <p className="text-sm font-medium text-slate-500">
            {isLoginView ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLoginView(!isLoginView)}
              className="ml-2 text-blue-600 hover:text-blue-800 font-bold focus:outline-none"
            >
              {isLoginView ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
