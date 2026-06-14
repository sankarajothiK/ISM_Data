import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiBookOpen, FiBriefcase, FiUploadCloud, FiAward, FiArrowLeft, FiArrowRight, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import Logo from '../components/Logo';
import { jobService, applicationService } from '../services/api';

const ApplyPage = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      qualification: 'UG',
      willingToRelocate: 'Yes',
      preferredShift: 'Day',
      experienceType: 'Fresher',
      yearsOfExperience: 0,
      currentCompany: '',
      currentJobRole: '',
      currentSalary: '',
      noticePeriod: 'Immediate',
    },
  });

  const watchExperience = watch('experienceType');
  const watchResume = watch('resume');
  const watchPhoto = watch('photo');

  // Load jobs list
  useEffect(() => {
    jobService.getActiveJobs()
      .then((res) => {
        if (res.success) setJobs(res.data);
      })
      .catch((err) => console.error('Error loading jobs:', err))
      .finally(() => setLoadingJobs(false));
  }, []);

  // Form step mappings for validation triggers
  const stepFields = {
    1: ['name', 'mobile', 'whatsappNumber', 'email', 'gender', 'dob', 'currentLocation'],
    2: ['qualification', 'degreeCourse', 'college', 'passingYear', 'percentage'],
    3: [
      'preferredJobRole', 'preferredLocation', 'expectedSalary', 'willingToRelocate', 'preferredShift',
      'experienceType', 'yearsOfExperience', 'currentCompany', 'currentJobRole', 'currentSalary', 'noticePeriod'
    ],
    4: ['technicalSkills', 'softSkills', 'languagesKnown', 'resume', 'photo', 'referralSource', 'additionalNotes'],
    5: ['declaration'],
  };

  const handleNext = async () => {
    const fieldsToValidate = stepFields[activeStep];
    const isStepValid = await trigger(fieldsToValidate);

    if (isStepValid) {
      setActiveStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    setActiveStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();

      // Append files
      if (data.resume && data.resume[0]) {
        formData.append('resume', data.resume[0]);
      }
      if (data.photo && data.photo[0]) {
        formData.append('photo', data.photo[0]);
      }

      // Append all other fields
      Object.keys(data).forEach((key) => {
        if (key !== 'resume' && key !== 'photo' && key !== 'declaration') {
          formData.append(key, data[key]);
        }
      });

      const res = await applicationService.createApplication(formData);

      if (res.success) {
        navigate('/application-success', {
          state: {
            applicationId: res.data.applicationId,
            name: res.data.name,
            positionApplied: res.data.preferredJobRole,
            appliedAt: res.data.appliedAt,
          },
        });
      } else {
        setSubmitError(res.message || 'Submission failed.');
      }
    } catch (err) {
      console.error(err);
      setSubmitError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'An error occurred during submission. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, name: 'Personal', icon: <FiUser /> },
    { num: 2, name: 'Education', icon: <FiBookOpen /> },
    { num: 3, name: 'Job & Experience', icon: <FiBriefcase /> },
    { num: 4, name: 'Skills & Uploads', icon: <FiAward /> },
    { num: 5, name: 'Confirmation', icon: <FiCheck /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Logo and branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <Logo variant="light" className="mb-4 scale-110" />
          <p className="mt-2 text-slate-500 text-sm max-w-md mx-auto">
            Submit your profile details. Our recruitment team will get in touch with you shortly.
          </p>
        </div>

        {/* Wizard Progress Bar */}
        <div className="mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          {stepsList.map((step) => (
            <div key={step.num} className="flex flex-col items-center flex-1 relative">
              {/* Connector line */}
              {step.num > 1 && (
                <div className={`absolute top-4.5 -left-1/2 w-full h-1 -z-10 ${activeStep >= step.num ? 'bg-brand-500' : 'bg-slate-100'}`} />
              )}
              
              {/* Badge Icon */}
              <button
                type="button"
                disabled={activeStep < step.num} // Lock future steps
                onClick={() => { setActiveStep(step.num); setSubmitError(null); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border transition-all z-10 ${
                  activeStep === step.num
                    ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-500/30 ring-4 ring-indigo-50'
                    : activeStep > step.num
                    ? 'bg-brand-50 border-brand-100 text-brand-600'
                    : 'bg-white border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {activeStep > step.num ? <FiCheck className="w-4.5 h-4.5" /> : step.num}
              </button>
              <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider hidden sm:block ${activeStep === step.num ? 'text-brand-600' : 'text-slate-400'}`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>

        {/* Form Content Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          
          <div className="bg-brand-600 px-6 sm:px-8 py-5 text-white flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-display">{stepsList[activeStep - 1].name} Details</h2>
              <p className="text-xs text-brand-100 mt-0.5">Step {activeStep} of 5</p>
            </div>
            <div className="p-2 bg-brand-500/30 rounded-xl text-lg text-white">
              {stepsList[activeStep - 1].icon}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6 text-sm">
            
            {submitError && (
              <div className="flex items-center space-x-2.5 p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl">
                <FiAlertTriangle className="w-5 h-5 shrink-0" />
                <span className="font-semibold text-xs">{submitError}</span>
              </div>
            )}

            {/* STEP 1: PERSONAL INFORMATION */}
            {activeStep === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.name ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                      placeholder="Enter your full name"
                      {...register('name', { required: 'Full Name is required' })}
                    />
                    {errors.name && <p className="text-red-500 text-xs font-semibold mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                    <input
                      type="text"
                      maxLength={10}
                      className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.mobile ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                      placeholder="10-digit mobile number"
                      {...register('mobile', { 
                        required: 'Mobile number is required',
                        pattern: { value: /^[6-9]\d{9}$/, message: 'Must be a valid 10-digit number' }
                      })}
                    />
                    {errors.mobile && <p className="text-red-500 text-xs font-semibold mt-1">{errors.mobile.message}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">WhatsApp Number *</label>
                    <input
                      type="text"
                      maxLength={10}
                      className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.whatsappNumber ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                      placeholder="10-digit WhatsApp number"
                      {...register('whatsappNumber', { 
                        required: 'WhatsApp number is required',
                        pattern: { value: /^[6-9]\d{9}$/, message: 'Must be a valid 10-digit number' }
                      })}
                    />
                    {errors.whatsappNumber && <p className="text-red-500 text-xs font-semibold mt-1">{errors.whatsappNumber.message}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                      placeholder="name@example.com"
                      {...register('email', { 
                        required: 'Email address is required',
                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address format' }
                      })}
                    />
                    {errors.email && <p className="text-red-500 text-xs font-semibold mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                    <select
                      className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.gender ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                      {...register('gender', { required: 'Gender is required' })}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-xs font-semibold mt-1">{errors.gender.message}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.dob ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                      {...register('dob', { required: 'Date of Birth is required' })}
                    />
                    {errors.dob && <p className="text-red-500 text-xs font-semibold mt-1">{errors.dob.message}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Current Location (City / District) *</label>
                    <input
                      type="text"
                      className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.currentLocation ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                      placeholder="e.g. Pune, Maharashtra"
                      {...register('currentLocation', { required: 'Current Location is required' })}
                    />
                    {errors.currentLocation && <p className="text-red-500 text-xs font-semibold mt-1">{errors.currentLocation.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: EDUCATIONAL DETAILS */}
            {activeStep === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Highest Qualification *</label>
                    <select
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all"
                      {...register('qualification')}
                    >
                      <option value="10th">10th</option>
                      <option value="12th">12th</option>
                      <option value="Diploma">Diploma</option>
                      <option value="UG">UG (Under Graduate)</option>
                      <option value="PG">PG (Post Graduate)</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Degree / Course Name *</label>
                    <input
                      type="text"
                      className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.degreeCourse ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                      placeholder="e.g. B.E. Computer Science, MCA"
                      {...register('degreeCourse', { required: 'Degree/Course name is required' })}
                    />
                    {errors.degreeCourse && <p className="text-red-500 text-xs font-semibold mt-1">{errors.degreeCourse.message}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">College / Institution Name *</label>
                    <input
                      type="text"
                      className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.college ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                      placeholder="Enter your college or institution name"
                      {...register('college', { required: 'College name is required' })}
                    />
                    {errors.college && <p className="text-red-500 text-xs font-semibold mt-1">{errors.college.message}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Year of Passing *</label>
                    <input
                      type="number"
                      className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.passingYear ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                      placeholder="e.g. 2024"
                      {...register('passingYear', { 
                        required: 'Passing year is required',
                        min: { value: 1980, message: 'Valid year is required' },
                        max: { value: 2035, message: 'Valid year is required' }
                      })}
                    />
                    {errors.passingYear && <p className="text-red-500 text-xs font-semibold mt-1">{errors.passingYear.message}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CGPA / Percentage *</label>
                    <input
                      type="text"
                      className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.percentage ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                      placeholder="e.g. 84.5% or 8.9 CGPA"
                      {...register('percentage', { required: 'CGPA or Percentage is required' })}
                    />
                    {errors.percentage && <p className="text-red-500 text-xs font-semibold mt-1">{errors.percentage.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: JOB PREFERENCES & EXPERIENCE */}
            {activeStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Preferences */}
                <div>
                  <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Job Preferences</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Preferred Job Role *</label>
                      {loadingJobs ? (
                        <div className="h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-xs">
                          Loading positions...
                        </div>
                      ) : jobs.length === 0 ? (
                        <div className="h-10 flex items-center px-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                          No active positions open.
                        </div>
                      ) : (
                        <select
                          className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.preferredJobRole ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                          {...register('preferredJobRole', { required: 'Please select job role' })}
                        >
                          <option value="">Select Role</option>
                          {jobs.map((job) => (
                            <option key={job._id} value={job.title}>{job.title}</option>
                          ))}
                        </select>
                      )}
                      {errors.preferredJobRole && <p className="text-red-500 text-xs font-semibold mt-1">{errors.preferredJobRole.message}</p>}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Preferred Location *</label>
                      <input
                        type="text"
                        className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.preferredLocation ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                        placeholder="e.g. Pune, Remote, Mumbai"
                        {...register('preferredLocation', { required: 'Preferred Location is required' })}
                      />
                      {errors.preferredLocation && <p className="text-red-500 text-xs font-semibold mt-1">{errors.preferredLocation.message}</p>}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Expected Salary *</label>
                      <input
                        type="text"
                        className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.expectedSalary ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                        placeholder="e.g. 6.5 LPA or 50k/month"
                        {...register('expectedSalary', { required: 'Expected Salary is required' })}
                      />
                      {errors.expectedSalary && <p className="text-red-500 text-xs font-semibold mt-1">{errors.expectedSalary.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Relocate? *</label>
                        <select
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all"
                          {...register('willingToRelocate')}
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Preferred Shift *</label>
                        <select
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all"
                          {...register('preferredShift')}
                        >
                          <option value="Day">Day</option>
                          <option value="Night">Night</option>
                          <option value="Rotational">Rotational</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Experience Detail */}
                <div>
                  <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Experience Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Experience Status *</label>
                      <select
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all"
                        {...register('experienceType')}
                      >
                        <option value="Fresher">Fresher</option>
                        <option value="Experienced">Experienced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Notice Period *</label>
                      <input
                        type="text"
                        className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.noticePeriod ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                        placeholder="e.g. Immediate, 1 Month"
                        {...register('noticePeriod', { required: 'Notice Period is required' })}
                      />
                      {errors.noticePeriod && <p className="text-red-500 text-xs font-semibold mt-1">{errors.noticePeriod.message}</p>}
                    </div>

                    {watchExperience === 'Experienced' && (
                      <>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Total Experience (Years) *</label>
                          <input
                            type="number"
                            step="0.1"
                            className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.yearsOfExperience ? 'border-red-400' : 'border-slate-200'}`}
                            placeholder="e.g. 2.5"
                            {...register('yearsOfExperience', { 
                              required: 'Total years of experience is required',
                              min: { value: 0.1, message: 'Must be greater than 0' }
                            })}
                          />
                          {errors.yearsOfExperience && <p className="text-red-500 text-xs font-semibold mt-1">{errors.yearsOfExperience.message}</p>}
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Current Company Name *</label>
                          <input
                            type="text"
                            className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.currentCompany ? 'border-red-400' : 'border-slate-200'}`}
                            placeholder="Enter current employer"
                            {...register('currentCompany', { required: 'Current Company is required' })}
                          />
                          {errors.currentCompany && <p className="text-red-500 text-xs font-semibold mt-1">{errors.currentCompany.message}</p>}
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Current Job Role *</label>
                          <input
                            type="text"
                            className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.currentJobRole ? 'border-red-400' : 'border-slate-200'}`}
                            placeholder="e.g. Software Engineer"
                            {...register('currentJobRole', { required: 'Current Job Role is required' })}
                          />
                          {errors.currentJobRole && <p className="text-red-500 text-xs font-semibold mt-1">{errors.currentJobRole.message}</p>}
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Current Salary (optional)</label>
                          <input
                            type="text"
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all"
                            placeholder="e.g. 5 LPA"
                            {...register('currentSalary')}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* STEP 4: SKILLS & UPLOADS */}
            {activeStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Skills Section */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Skills & Languages</h3>
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Technical Skills (Comma separated) *</label>
                      <input
                        type="text"
                        className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.technicalSkills ? 'border-red-400' : 'border-slate-200'}`}
                        placeholder="e.g. Java, React, Node.js, Git"
                        {...register('technicalSkills', { required: 'Technical skills are required' })}
                      />
                      {errors.technicalSkills && <p className="text-red-500 text-xs font-semibold mt-1">{errors.technicalSkills.message}</p>}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Soft Skills (Comma separated) *</label>
                      <input
                        type="text"
                        className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.softSkills ? 'border-red-400' : 'border-slate-200'}`}
                        placeholder="e.g. Communication, Problem Solving, Leadership"
                        {...register('softSkills', { required: 'Soft skills are required' })}
                      />
                      {errors.softSkills && <p className="text-red-500 text-xs font-semibold mt-1">{errors.softSkills.message}</p>}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Languages Known (Comma separated) *</label>
                      <input
                        type="text"
                        className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.languagesKnown ? 'border-red-400' : 'border-slate-200'}`}
                        placeholder="e.g. English, Hindi, Spanish"
                        {...register('languagesKnown', { required: 'Please specify languages' })}
                      />
                      {errors.languagesKnown && <p className="text-red-500 text-xs font-semibold mt-1">{errors.languagesKnown.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Uploads Section */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="font-bold text-slate-900">Document Uploads</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* Resume Upload */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-2">Resume Upload (PDF/DOC/DOCX - Max 5MB) *</label>
                      <div className="flex justify-center p-5 border-2 border-slate-300 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="space-y-1 text-center">
                          <FiUploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                          <div className="flex text-xs text-slate-600 justify-center">
                            <label className="relative cursor-pointer bg-white rounded font-bold text-brand-600 hover:text-brand-500">
                              <span>Select Resume</span>
                              <input
                                type="file"
                                className="sr-only"
                                accept=".pdf,.doc,.docx"
                                {...register('resume', { 
                                  required: 'Resume document is required',
                                  validate: {
                                    size: (value) => !value[0] || value[0].size <= 5 * 1024 * 1024 || 'File exceeds 5MB limit',
                                    format: (value) => {
                                      if (!value[0]) return true;
                                      const ext = value[0].name.split('.').pop().toLowerCase();
                                      return ['pdf', 'doc', 'docx'].includes(ext) || 'PDF, DOC, DOCX files only';
                                    }
                                  }
                                })}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                      {watchResume?.[0] && (
                        <div className="mt-2 text-xs text-brand-600 font-bold truncate bg-brand-50 p-2 rounded-lg max-w-full">
                          Resume: {watchResume[0].name}
                        </div>
                      )}
                      {errors.resume && <p className="text-red-500 text-xs font-semibold mt-1.5">{errors.resume.message}</p>}
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-2">Photo Upload (JPG/PNG/WEBP - Max 2MB)</label>
                      <div className="flex justify-center p-5 border-2 border-slate-300 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="space-y-1 text-center">
                          <FiUploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                          <div className="flex text-xs text-slate-600 justify-center">
                            <label className="relative cursor-pointer bg-white rounded font-bold text-brand-600 hover:text-brand-500">
                              <span>Select Photo</span>
                              <input
                                type="file"
                                className="sr-only"
                                accept=".png,.jpg,.jpeg,.webp"
                                {...register('photo', {
                                  validate: {
                                    size: (value) => !value[0] || value[0].size <= 2 * 1024 * 1024 || 'Photo exceeds 2MB limit',
                                    format: (value) => {
                                      if (!value[0]) return true;
                                      const ext = value[0].name.split('.').pop().toLowerCase();
                                      return ['png', 'jpg', 'jpeg', 'webp'].includes(ext) || 'Images (PNG/JPG/WEBP) only';
                                    }
                                  }
                                })}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                      {watchPhoto?.[0] && (
                        <div className="mt-2 text-xs text-brand-600 font-bold truncate bg-brand-50 p-2 rounded-lg max-w-full">
                          Photo: {watchPhoto[0].name}
                        </div>
                      )}
                      {errors.photo && <p className="text-red-500 text-xs font-semibold mt-1.5">{errors.photo.message}</p>}
                    </div>

                  </div>
                </div>

                {/* Additional Info Section */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="font-bold text-slate-900">Additional Information</h3>
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">How did you hear about us? *</label>
                      <input
                        type="text"
                        className={`w-full px-3.5 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all ${errors.referralSource ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                        placeholder="e.g. WhatsApp, Instagram, LinkedIn, Friend Referral"
                        {...register('referralSource', { required: 'Please specify how you heard about us' })}
                      />
                      {errors.referralSource && <p className="text-red-500 text-xs font-semibold mt-1">{errors.referralSource.message}</p>}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Additional Notes / Comments</label>
                      <textarea
                        rows={3}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all"
                        placeholder="Any additional information you want to share..."
                        {...register('additionalNotes')}
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* STEP 5: CONFIRMATION & DECLARATION */}
            {activeStep === 5 && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Summary Box */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-4">
                  <h3 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-2">Application Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    <p><span className="text-slate-400 font-semibold">Full Name:</span> <span className="font-bold text-slate-700">{watch('name')}</span></p>
                    <p><span className="text-slate-400 font-semibold">Email:</span> <span className="font-bold text-slate-700">{watch('email')}</span></p>
                    <p><span className="text-slate-400 font-semibold">Mobile:</span> <span className="font-bold text-slate-700">{watch('mobile')}</span></p>
                    <p><span className="text-slate-400 font-semibold">Job Role:</span> <span className="font-bold text-brand-600">{watch('preferredJobRole')}</span></p>
                    <p><span className="text-slate-400 font-semibold">Qualification:</span> <span className="font-bold text-slate-700">{watch('qualification')} - {watch('degreeCourse')}</span></p>
                    <p><span className="text-slate-400 font-semibold">Experience Status:</span> <span className="font-bold text-slate-700">{watch('experienceType')}</span></p>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Please check your email and mobile logs. Once submitted, your profile parameters will be locked for review by the HR manager.</p>
                </div>

                {/* Declaration Checkbox */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        className="h-4.5 w-4.5 text-brand-600 focus:ring-brand-500 border-slate-300 rounded cursor-pointer"
                        {...register('declaration', { required: 'Please confirm accuracy to submit application' })}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-bold text-slate-700 cursor-pointer">
                        I confirm that the information provided is accurate. *
                      </label>
                      {errors.declaration && <p className="text-red-500 text-xs font-semibold mt-1">{errors.declaration.message}</p>}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Navigation buttons */}
            <div className="pt-5 border-t border-slate-100 flex items-center justify-between shrink-0">
              {activeStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center space-x-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold cursor-pointer"
                >
                  <FiArrowLeft className="w-4.5 h-4.5" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {activeStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow transition-colors cursor-pointer"
                >
                  <span>Next Step</span>
                  <FiArrowRight className="w-4.5 h-4.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting ? 'Submitting Profile...' : 'Submit Profile Application'}
                </button>
              )}
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};

export default ApplyPage;
