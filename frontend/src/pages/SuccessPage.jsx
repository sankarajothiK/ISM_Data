import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { FiCheckCircle, FiCalendar, FiBriefcase, FiArrowLeft } from 'react-icons/fi';
import Logo from '../components/Logo';

const SuccessPage = () => {
  const location = useLocation();
  const state = location.state;

  // Safeguard: Redirect to application page if accessed directly without form submission data
  if (!state || !state.applicationId) {
    return <Navigate to="/apply" replace />;
  }

  const { applicationId, name, positionApplied, appliedAt } = state;
  const appliedDate = appliedAt ? new Date(appliedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-100 p-8 text-center space-y-8 flex flex-col items-center">
        
        {/* Logo */}
        <Logo variant="light" className="scale-100 mb-2" />

        {/* Animated Check Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-green-50 p-4 animate-bounce">
            <FiCheckCircle className="w-16 h-16 text-green-500" />
          </div>
        </div>

        {/* Heading */}
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Application Submitted!
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Hi <span className="font-semibold text-slate-800">{name}</span>, your job application has been successfully saved in our database.
          </p>
        </div>

        {/* Application Credentials Card */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Application ID</p>
              <p className="text-sm font-bold text-brand-600 font-mono">{applicationId}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
              <FiBriefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Applied Position</p>
              <p className="text-sm font-bold text-slate-800">{positionApplied}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
              <FiCalendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Submission Date</p>
              <p className="text-sm font-bold text-slate-800">{appliedDate}</p>
            </div>
          </div>
        </div>

        {/* Link back to application portal */}
        <div className="pt-4">
          <Link
            to="/apply"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Apply for another position</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default SuccessPage;
