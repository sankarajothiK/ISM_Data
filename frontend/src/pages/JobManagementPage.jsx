import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiBriefcase, FiTrash2, FiEdit, FiCheck, FiX, FiAlertCircle, FiSettings, FiCheckCircle } from 'react-icons/fi';
import { jobService } from '../services/api';

const JobManagementPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal control states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [savingJob, setSavingJob] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  // Load all jobs
  const fetchJobs = () => {
    setLoading(true);
    jobService.getAllJobs()
      .then((res) => {
        if (res.success) {
          setJobs(res.data);
        } else {
          setError(res.message || 'Failed to fetch job roles.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Error fetching job logs. Ensure backend server is responsive.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const openAddModal = () => {
    setEditingJob(null);
    setModalError(null);
    reset({
      title: '',
      department: '',
      description: '',
      experienceRequired: '',
      salaryRange: '',
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    setModalError(null);
    reset({
      title: job.title,
      department: job.department,
      description: job.description,
      experienceRequired: job.experienceRequired,
      salaryRange: job.salaryRange,
      status: job.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSavingJob(true);
    setModalError(null);
    try {
      let res;
      if (editingJob) {
        res = await jobService.updateJob(editingJob._id, data);
      } else {
        res = await jobService.createJob(data);
      }

      if (res.success) {
        setModalOpen(false);
        fetchJobs();
      } else {
        setModalError(res.message || 'Operation failed.');
      }
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Server error saving position details.');
    } finally {
      setSavingJob(false);
    }
  };

  // Toggle Activation Switch
  const toggleJobStatus = async (job) => {
    const newStatus = job.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await jobService.updateJob(job._id, { ...job, status: newStatus });
      if (res.success) {
        setJobs(prev => prev.map(item => item._id === job._id ? { ...item, status: newStatus } : item));
      } else {
        alert(res.message || 'Failed to change status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status.');
    }
  };

  // Delete Job opening
  const handleDeleteJob = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete the job opening: "${title}"? Candidates will no longer be able to apply.`)) {
      try {
        const res = await jobService.deleteJob(id);
        if (res.success) {
          fetchJobs();
        } else {
          alert(res.message || 'Deletion failed.');
        }
      } catch (err) {
        console.error(err);
        alert('Error removing position.');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">Job Positions</h1>
          <p className="text-slate-500 mt-1">Configure open job roles and adjust recruitment availability status.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/10 transition-colors shrink-0 cursor-pointer"
        >
          <FiPlus className="w-5 h-5" />
          <span>Post New Job</span>
        </button>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-600"></div>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 flex flex-col items-center space-y-3 bg-red-50 border border-red-200 rounded-2xl">
          <FiAlertCircle className="w-10 h-10" />
          <p className="font-semibold">{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-16 text-center text-slate-400 space-y-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <FiBriefcase className="w-16 h-16 mx-auto text-slate-200" />
          <p className="font-semibold text-lg">No Job Openings Registered</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Create a job role so that candidates scanning the QR code can select it in the application form.</p>
          <button onClick={openAddModal} className="px-4 py-2 bg-indigo-50 hover:bg-brand-50 text-brand-600 rounded-xl text-xs font-bold transition-all border border-brand-200 mt-2">
            Create First Role
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job._id} className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow transition-shadow ${job.status === 'inactive' ? 'border-slate-100 opacity-75' : 'border-slate-100'}`}>
              <div>
                {/* Status indicator and department */}
                <div className="flex justify-between items-center mb-3">
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase">{job.department}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${job.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {job.status}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{job.title}</h3>
                
                {/* Specs */}
                <div className="grid grid-cols-2 gap-3 text-xs mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-semibold">
                  <div>
                    <span className="text-slate-400">Exp. Required:</span>
                    <p className="text-slate-700 mt-0.5">{job.experienceRequired}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Salary Range:</span>
                    <p className="text-slate-700 mt-0.5">{job.salaryRange}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-4 line-clamp-3 leading-relaxed font-semibold">{job.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <button
                  onClick={() => toggleJobStatus(job)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${job.status === 'active' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
                >
                  {job.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(job)}
                    className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-brand-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Edit Opening"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job._id, job.title)}
                    className="p-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-lg transition-colors cursor-pointer"
                    title="Delete Opening"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 overflow-hidden shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <div className="bg-slate-950 px-6 py-4.5 text-white flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold">{editingJob ? 'Edit Job Opening' : 'Post New Job Opening'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
              {modalError && (
                <div className="flex items-center space-x-2 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                  <FiAlertTriangle className="w-5 h-5 shrink-0" />
                  <span className="font-semibold">{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    className={`w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.title ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="e.g. Senior Full-Stack Engineer"
                    {...register('title', { required: 'Job Title is required' })}
                  />
                  {errors.title && <p className="text-red-500 text-xs font-semibold mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                  <input
                    type="text"
                    className={`w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.department ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="e.g. Engineering, HR, Sales"
                    {...register('department', { required: 'Department is required' })}
                  />
                  {errors.department && <p className="text-red-500 text-xs font-semibold mt-1">{errors.department.message}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Experience Required *</label>
                  <input
                    type="text"
                    className={`w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.experienceRequired ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="e.g. 2-5 Years, Freshers"
                    {...register('experienceRequired', { required: 'Experience range is required' })}
                  />
                  {errors.experienceRequired && <p className="text-red-500 text-xs font-semibold mt-1">{errors.experienceRequired.message}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Salary Range *</label>
                  <input
                    type="text"
                    className={`w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.salaryRange ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="e.g. 6 - 8 LPA"
                    {...register('salaryRange', { required: 'Salary range is required' })}
                  />
                  {errors.salaryRange && <p className="text-red-500 text-xs font-semibold mt-1">{errors.salaryRange.message}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Availability Status</label>
                  <select
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    {...register('status')}
                  >
                    <option value="active">Active (Candidates can apply)</option>
                    <option value="inactive">Inactive (Unavailable)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Description *</label>
                <textarea
                  rows={4}
                  className={`w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.description ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder="Summarize core competencies, required tech stack, and responsibilities..."
                  {...register('description', { required: 'Job Description is required' })}
                />
                {errors.description && <p className="text-red-500 text-xs font-semibold mt-1">{errors.description.message}</p>}
              </div>

              <div className="pt-3.5 border-t border-slate-100 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingJob}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors font-bold disabled:opacity-50 cursor-pointer"
                >
                  {savingJob ? 'Saving position...' : 'Save Job Position'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default JobManagementPage;
