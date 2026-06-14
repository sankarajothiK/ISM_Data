import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiSliders, FiDownload, FiTrash2, FiEye, FiCalendar, FiChevronLeft, FiChevronRight, FiAlertCircle } from 'react-icons/fi';
import { applicationService, jobService } from '../services/api';

const ApplicationListPage = () => {
  // Candidate data & pagination states
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [jobs, setJobs] = useState([]);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [positionApplied, setPositionApplied] = useState('');
  const [experienceType, setExperienceType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Active filters applied to queries
  const getActiveFilters = () => {
    const params = { page, limit: 10 };
    if (search.trim()) params.search = search.trim();
    if (status) params.status = status;
    if (positionApplied) params.positionApplied = positionApplied;
    if (experienceType) params.experienceType = experienceType;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return params;
  };

  // Fetch applications list
  const fetchApplications = () => {
    setLoading(true);
    setError(null);
    const params = getActiveFilters();
    applicationService.getApplications(params)
      .then((res) => {
        if (res.success) {
          setApplications(res.data);
          setPagination(res.pagination);
        } else {
          setError(res.message || 'Failed to retrieve candidates.');
        }
      })
      .catch((err) => {
        console.error('Error fetching applications:', err);
        setError('Error fetching candidate logs. Ensure your database is connected.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Load jobs (for filter dropdown) and applications
  useEffect(() => {
    jobService.getActiveJobs()
      .then((res) => {
        if (res.success) setJobs(res.data);
      })
      .catch(err => console.error('Error fetching jobs:', err));
  }, []);

  // Fetch applications when query filter parameters change
  useEffect(() => {
    fetchApplications();
  }, [page, status, positionApplied, experienceType, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  // Delete Candidate record
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the application of ${name}? This will also delete their uploaded resume.`)) {
      try {
        const res = await applicationService.deleteApplication(id);
        if (res.success) {
          alert('Application deleted successfully');
          fetchApplications();
        } else {
          alert(res.message || 'Deletion failed');
        }
      } catch (err) {
        console.error(err);
        alert('An error occurred during deletion.');
      }
    }
  };

  // Trigger Excel/CSV Export
  const handleExport = async (format = 'xlsx') => {
    try {
      const activeFilters = getActiveFilters();
      // Remove page and limit for full data export
      delete activeFilters.page;
      delete activeFilters.limit;

      const blob = await applicationService.exportApplications(activeFilters, format);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ISM_Applications_Export_${new Date().toISOString().slice(0, 10)}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Export Error:', err);
      alert('Failed to generate export file.');
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      'New': 'bg-blue-50 text-blue-700 border-blue-100',
      'Under Review': 'bg-indigo-50 text-indigo-700 border-indigo-100',
      'Shortlisted': 'bg-amber-50 text-amber-700 border-amber-100',
      'Interview Scheduled': 'bg-purple-50 text-purple-700 border-purple-100',
      'Selected': 'bg-emerald-50 text-emerald-700 border-emerald-100',
      'Rejected': 'bg-rose-50 text-rose-700 border-rose-100',
    };
    return classes[status] || 'bg-slate-50 text-slate-700 border-slate-100';
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">Candidate Applications</h1>
          <p className="text-slate-500 mt-1">Review profiles, update statuses, and export candidate data sheets.</p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => handleExport('xlsx')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow transition-colors cursor-pointer"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export XLSX</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold shadow transition-colors cursor-pointer"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Filter Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            placeholder="Search Name, Email, or Mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="absolute left-3.5 top-3.5 text-slate-400 hover:text-brand-500">
            <FiSearch className="w-4 h-4" />
          </button>
        </form>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-4.5 py-2.5 border rounded-xl text-sm font-semibold transition-all cursor-pointer ${showFilters ? 'bg-indigo-50 border-brand-200 text-brand-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <FiSliders className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Application Status</label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Job Openings</label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={positionApplied}
              onChange={(e) => { setPositionApplied(e.target.value); setPage(1); }}
            >
              <option value="">All Openings</option>
              {jobs.map((job) => (
                <option key={job._id} value={job.title}>{job.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Experience Level</label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={experienceType}
              onChange={(e) => { setExperienceType(e.target.value); setPage(1); }}
            >
              <option value="">All Experience</option>
              <option value="Fresher">Fresher</option>
              <option value="Experienced">Experienced</option>
            </select>
          </div>

          {/* Date range filters */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <FiCalendar className="w-3.5 h-3.5" />
              <span>Applied Between</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-600"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 flex flex-col items-center space-y-3">
            <FiAlertCircle className="w-10 h-10" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <FiUsers className="w-16 h-16 mx-auto text-slate-200" />
            <p className="font-semibold text-lg">No Applications Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">No candidate matches found in database. Try resetting filters or checking back later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Application ID</th>
                  <th className="px-6 py-4">Candidate Details</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Role / Experience</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* ID */}
                    <td className="px-6 py-5 font-mono text-xs font-bold text-slate-500">
                      {app.applicationId || 'N/A'}
                    </td>
                    {/* Candidate Details */}
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-bold text-slate-800">{app.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Applied: {new Date(app.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-slate-700 font-semibold">{app.mobile}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[150px]">{app.email}</p>
                      </div>
                    </td>
                    {/* Role / Experience */}
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-slate-800 font-bold">{app.positionApplied}</p>
                        <p className="text-xs text-brand-600 font-semibold mt-0.5">
                          {app.experienceType} {app.experienceType === 'Experienced' ? `(${app.yearsOfExperience} yrs)` : ''}
                        </p>
                      </div>
                    </td>
                    {/* Status Badge */}
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <Link
                          to={`/admin/applications/${app._id}`}
                          className="p-2 bg-indigo-50 hover:bg-brand-600 text-brand-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <FiEye className="w-4.5 h-4.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(app._id, app.name)}
                          className="p-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Delete Application"
                        >
                          <FiTrash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
            <p className="text-xs text-slate-400 font-semibold">
              Showing page <span className="text-slate-700">{pagination.page}</span> of <span className="text-slate-700">{pagination.pages}</span> ({pagination.total} records total)
            </p>
            <div className="flex space-x-2.5">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={pagination.page === 1}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <FiChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, pagination.pages))}
                disabled={pagination.page === pagination.pages}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <FiChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ApplicationListPage;
