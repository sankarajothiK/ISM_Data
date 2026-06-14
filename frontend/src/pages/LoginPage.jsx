import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiLock, FiUser, FiAlertTriangle } from 'react-icons/fi';
import Logo from '../components/Logo';
import { authService } from '../services/api';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/admin');
    }
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await authService.login(data.username, data.password);
      if (res.success) {
        window.location.href = '/admin'; // Force full layout mount
      } else {
        setErrorMessage(res.message || 'Login failed. Invalid username or password.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Server error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <Logo variant="dark" className="mb-6 scale-110" />
        <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">
          Recruitment Dashboard
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to manage candidate applications and job postings.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-slate-700">
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {errorMessage && (
              <div className="flex items-center space-x-2 p-3.5 bg-red-950/50 border border-red-500/50 text-red-200 rounded-xl text-sm font-semibold">
                <FiAlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">
                Username
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <FiUser className="h-5 h-5" />
                </div>
                <input
                  type="text"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm ${errors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter admin username"
                  {...register('username', { required: 'Username is required' })}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs font-semibold text-red-400">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <FiLock className="h-5 h-5" />
                </div>
                <input
                  type="password"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-semibold text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
