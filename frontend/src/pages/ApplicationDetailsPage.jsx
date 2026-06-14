import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiMapPin, FiBookOpen, FiBriefcase, FiAlignLeft, FiFileText, FiDownload, FiCheckCircle, FiTrash, FiEdit2, FiSave, FiX, FiAlertCircle, FiPlus, FiMessageSquare, FiFlag, FiPrinter } from 'react-icons/fi';
import { applicationService } from '../services/api';
import { jsPDF } from 'jspdf';

const ApplicationDetailsPage = () => {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status updates
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // HR Notes State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Fetch candidate details
  const fetchCandidateDetails = () => {
    setLoading(true);
    applicationService.getApplicationById(id)
      .then((res) => {
        if (res.success) {
          setCandidate(res.data);
        } else {
          setError(res.message || 'Application details could not be found.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Error fetching candidate logs. Please check your backend connection.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCandidateDetails();
  }, [id]);

  // Handle status update
  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await applicationService.updateApplicationStatus(id, newStatus);
      if (res.success) {
        setCandidate((prev) => ({ ...prev, status: newStatus }));
        alert(`Status updated to ${newStatus}`);
      } else {
        alert(res.message || 'Status update failed.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating candidate status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Add HR Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    setAddingNote(true);
    try {
      const res = await applicationService.addNote(id, newNoteContent.trim());
      if (res.success) {
        setCandidate((prev) => ({ ...prev, hrNotes: res.data }));
        setNewNoteContent('');
      } else {
        alert(res.message || 'Failed to append note.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while appending notes.');
    } finally {
      setAddingNote(false);
    }
  };

  // Start Editing note inline
  const startEditNote = (noteId, content) => {
    setEditingNoteId(noteId);
    setEditNoteContent(content);
  };

  // Save Edit Note
  const handleSaveEditNote = async (noteId) => {
    if (!editNoteContent.trim()) return;

    setSavingNote(true);
    try {
      const res = await applicationService.editNote(id, noteId, editNoteContent.trim());
      if (res.success) {
        setCandidate((prev) => ({ ...prev, hrNotes: res.data }));
        setEditingNoteId(null);
        setEditNoteContent('');
      } else {
        alert(res.message || 'Failed to update note.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving note.');
    } finally {
      setSavingNote(false);
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        const res = await applicationService.deleteNote(id, noteId);
        if (res.success) {
          setCandidate((prev) => ({ ...prev, hrNotes: res.data }));
        } else {
          alert(res.message || 'Failed to delete note.');
        }
      } catch (err) {
        console.error(err);
        alert('An error occurred while deleting note.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center space-x-3">
        <FiAlertCircle className="w-6 h-6 shrink-0" />
        <div>
          <h4 className="font-bold">Error Accessing Candidate details</h4>
          <p className="text-sm">{error || 'Candidate profile not found.'}</p>
          <Link to="/admin/applications" className="text-sm underline mt-2 inline-block font-semibold">Back to List</Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
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

  const isPdf = candidate.resumeUrl?.toLowerCase().includes('.pdf') && !candidate.resumeUrl?.includes('/raw/upload/');

  const getDownloadUrl = (url) => {
    if (!url) return '#';
    // Cloudinary raw resources do not support transformation flags (like fl_attachment) and will throw a 401.
    // Only insert the fl_attachment flag for image/upload/ URLs (which are used for new PDF uploads).
    if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
      return url.replace('/image/upload/', '/image/upload/fl_attachment/');
    }
    return url;
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadProfilePDF = () => {
    if (!candidate) return;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 1. Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 45, 'F');

    // 2. Branding (Horizontal Centering)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('ISM DATA', 105, 20, { align: 'center' });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(129, 140, 248); // indigo-400
    doc.text("EMPOWERING RURAL WOMEN'S", 105, 27, { align: 'center', charSpace: 1 });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('CANDIDATE APPLICATION DOSSIER', 105, 34, { align: 'center' });

    // 3. Candidate Summary Header
    let y = 60;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(candidate.name, 20, y);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Application ID: ${candidate.applicationId || 'N/A'}  |  Applied Date: ${new Date(candidate.createdAt).toLocaleDateString('en-IN')}`, 20, y + 6);

    y += 16;

    const drawSectionHeader = (title) => {
      // Check for space
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(20, y, 170, 8, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(79, 70, 229); // brand-600
      doc.text(title.toUpperCase(), 25, y + 6);
      y += 14;
    };

    const drawField = (label, val, halfWidth = false, isLastInRow = false) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      const x = halfWidth && isLastInRow ? 110 : 25;
      doc.text(label, x, y);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(String(val || 'N/A'), x, y + 5);

      if (!halfWidth || isLastInRow) {
        y += 12;
      }
    };

    // Personal Details
    drawSectionHeader('Personal Details');
    drawField('Email Address', candidate.email, true, false);
    drawField('Mobile Number', candidate.mobile, true, true);
    drawField('WhatsApp Number', candidate.whatsappNumber, true, false);
    drawField('Current Location', candidate.currentLocation, true, true);
    drawField('Date of Birth', new Date(candidate.dob).toLocaleDateString('en-IN'), true, false);
    drawField('Gender', candidate.gender, true, true);
    y += 4;

    // Academic
    drawSectionHeader('Education Profile');
    drawField('Highest Qualification', candidate.qualification, true, false);
    drawField('Degree / Course Name', candidate.degreeCourse, true, true);
    drawField('College / Institution Name', candidate.college, false);
    drawField('Passing Year', candidate.passingYear, true, false);
    drawField('CGPA / Percentage', candidate.percentage, true, true);
    y += 4;

    // Job Preferences
    drawSectionHeader('Job Preferences');
    drawField('Preferred Job Role', candidate.preferredJobRole, true, false);
    drawField('Preferred Location', candidate.preferredLocation, true, true);
    drawField('Expected Salary', candidate.expectedSalary, true, false);
    drawField('Willing to Relocate', candidate.willingToRelocate, true, true);
    drawField('Preferred Shift', candidate.preferredShift, false);
    y += 4;

    // Experience
    drawSectionHeader('Work Experience Details');
    drawField('Experience Status', candidate.experienceType, true, false);
    drawField('Notice Period', candidate.noticePeriod, true, true);
    if (candidate.experienceType === 'Experienced') {
      drawField('Years of Experience', `${candidate.yearsOfExperience} Years`, true, false);
      drawField('Current Company', candidate.currentCompany, true, true);
      drawField('Current Job Role', candidate.currentJobRole, true, false);
      drawField('Current Salary', candidate.currentSalary, true, true);
      y += 4;
    }

    // Skills
    drawSectionHeader('Skills & Languages');
    drawField('Technical Skills', candidate.technicalSkills?.join(', ') || 'N/A', false);
    drawField('Soft Skills', candidate.softSkills?.join(', ') || 'N/A', false);
    drawField('Languages Known', candidate.languagesKnown?.join(', ') || 'N/A', false);
    y += 4;

    // HR Notes
    if (candidate.hrNotes && candidate.hrNotes.length > 0) {
      drawSectionHeader('HR Commentary Log');
      candidate.hrNotes.forEach((note) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(79, 70, 229);
        doc.text(`${note.author.toUpperCase()} (${new Date(note.createdAt).toLocaleDateString('en-IN')})`, 25, y);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);
        const splitText = doc.splitTextToSize(note.content, 150);
        doc.text(splitText, 25, y + 4.5);
        y += (splitText.length * 4.5) + 8;
      });
    }

    // Add Footer line on last page
    doc.setDrawColor(241, 245, 249);
    doc.line(20, 280, 190, 280);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated via ISM Data Technology RMS Portal', 105, 285, { align: 'center' });

    doc.save(`ISM_Profile_${candidate.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* Stylesheet for printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          aside, header, nav, button, .no-print, a[href="/admin/applications"] {
            display: none !important;
          }
          .main-content-wrapper {
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            grid-column: span 3 / span 3 !important;
          }
        }
      `}} />

      {/* Header links and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        {/* Back to list */}
        <Link to="/admin/applications" className="inline-flex items-center space-x-2 text-slate-500 hover:text-brand-600 text-sm font-semibold transition-colors">
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Applications</span>
        </Link>
        
        {/* Print & PDF Actions */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <FiPrinter className="w-4 h-4" />
            <span>Print Profile</span>
          </button>
          
          <button
            onClick={downloadProfilePDF}
            className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-brand-500/10"
          >
            <FiDownload className="w-4 h-4" />
            <span>Download Profile PDF</span>
          </button>
        </div>
      </div>

      {/* Profile Header card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        
        {/* Photo + Name summary */}
        <div className="flex items-center space-x-4">
          {candidate.photoUrl ? (
            <img
              src={candidate.photoUrl}
              alt={candidate.name}
              className="w-16 h-16 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
              <FiUser className="w-8 h-8" />
            </div>
          )}
          
          <div>
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">{candidate.applicationId}</span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">{candidate.name}</h2>
            <p className="text-slate-500 text-sm mt-0.5">Applied for Preferred Role: <span className="font-bold text-slate-700">{candidate.preferredJobRole}</span></p>
          </div>
        </div>
        
        {/* Status Dropdown */}
        <div className="flex items-center space-x-3 shrink-0 w-full md:w-auto justify-between md:justify-start border-t border-slate-100 pt-4 md:border-none md:pt-0">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Status</label>
          <select
            disabled={updatingStatus}
            className={`px-4 py-2 border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 ${getStatusColor(candidate.status)}`}
            value={candidate.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="New">New</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview Scheduled">Interview Scheduled</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Profile Details (Span 2) */}
        <div className="lg:col-span-2 space-y-6 print-full-width">
          
          {/* Details Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-8">
            
            {/* Personal Details */}
            <div>
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5 mb-4">
                <FiUser className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-950">Personal Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-semibold">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Email Address</p>
                  <p className="text-slate-800 mt-0.5">{candidate.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Mobile Number</p>
                  <p className="text-slate-800 mt-0.5">{candidate.mobile}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">WhatsApp Number</p>
                  <p className="text-slate-800 mt-0.5">{candidate.whatsappNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Current Location</p>
                  <p className="text-slate-800 mt-0.5">{candidate.currentLocation}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Date of Birth</p>
                  <p className="text-slate-800 mt-0.5">{new Date(candidate.dob).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Gender</p>
                  <p className="text-slate-800 mt-0.5">{candidate.gender}</p>
                </div>
              </div>
            </div>

            {/* Academic */}
            <div>
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5 mb-4">
                <FiBookOpen className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-950">Education Profile</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-semibold">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Highest Qualification</p>
                  <p className="text-slate-800 mt-0.5">{candidate.qualification}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Degree / Course Name</p>
                  <p className="text-slate-800 mt-0.5">{candidate.degreeCourse}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">College / Institution</p>
                  <p className="text-slate-800 mt-0.5">{candidate.college}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Passing Year</p>
                  <p className="text-slate-800 mt-0.5">{candidate.passingYear}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">CGPA / Percentage</p>
                  <p className="text-slate-800 mt-0.5">{candidate.percentage}</p>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div>
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5 mb-4">
                <FiMapPin className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-950">Job Preferences</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-semibold">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Preferred Location</p>
                  <p className="text-slate-800 mt-0.5">{candidate.preferredLocation}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Expected Salary</p>
                  <p className="text-slate-800 mt-0.5">{candidate.expectedSalary}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Willing to Relocate</p>
                  <p className="text-slate-800 mt-0.5">{candidate.willingToRelocate}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Preferred Shift</p>
                  <p className="text-slate-800 mt-0.5">{candidate.preferredShift}</p>
                </div>
              </div>
            </div>

            {/* Experience */}
            <div>
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5 mb-4">
                <FiBriefcase className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-950">Work Experience Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-semibold">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Experience Status</p>
                  <p className="text-slate-800 mt-0.5">{candidate.experienceType}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Notice Period</p>
                  <p className="text-slate-800 mt-0.5">{candidate.noticePeriod}</p>
                </div>
                {candidate.experienceType === 'Experienced' && (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Years of Experience</p>
                      <p className="text-slate-800 mt-0.5">{candidate.yearsOfExperience} Years</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Current Company</p>
                      <p className="text-slate-800 mt-0.5">{candidate.currentCompany || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Current Job Role</p>
                      <p className="text-slate-800 mt-0.5">{candidate.currentJobRole || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Current Salary</p>
                      <p className="text-slate-800 mt-0.5">{candidate.currentSalary || 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Skills & Languages */}
            <div>
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5 mb-4">
                <FiAlignLeft className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-950">Skills & Languages</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technical Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.technicalSkills?.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-brand-700 text-xs font-bold rounded-lg">{skill}</span>
                    )) || <span className="text-xs text-slate-400">None specified</span>}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Soft Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.softSkills?.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg">{skill}</span>
                    )) || <span className="text-xs text-slate-400">None specified</span>}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Languages Known</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.languagesKnown?.map((lang, index) => (
                      <span key={index} className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">{lang}</span>
                    )) || <span className="text-xs text-slate-400">None specified</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5 mb-4">
                <FiFlag className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-950">Additional Information</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 text-sm font-semibold">
                <div>
                  <p className="text-xs font-semibold text-slate-400">How did you hear about us?</p>
                  <p className="text-slate-800 mt-0.5">{candidate.referralSource || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Candidate Comments / Notes</p>
                  <p className="text-slate-700 mt-1 italic font-medium whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {candidate.additionalNotes || 'No additional comments provided by the candidate.'}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Resume Preview Box */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 no-print">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FiFileText className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-950">Candidate Resume</h3>
              </div>
              <a
                href={getDownloadUrl(candidate.resumeUrl)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-950 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <FiDownload className="w-3.5 h-3.5" />
                <span>Download Resume</span>
              </a>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              {isPdf ? (
                <iframe
                  src={candidate.resumeUrl}
                  title="Resume PDF Preview"
                  width="100%"
                  height="550px"
                  className="border-none"
                />
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm space-y-2">
                  <FiAlertCircle className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-semibold">Inline preview is available for new PDF uploads.</p>
                  <p className="text-xs">Word documents (.doc, .docx) or older system uploads can be accessed by clicking the "Download Resume" button above.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right column: HR Notes Section (Span 1) */}
        <div className="space-y-6 no-print">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-950 flex items-center space-x-2">
                <FiMessageSquare className="w-5 h-5 text-brand-600" />
                <span>HR Commentary Log</span>
              </h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">{candidate.hrNotes?.length || 0} Notes</span>
            </div>

            {/* Note logs list */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {!candidate.hrNotes || candidate.hrNotes.length === 0 ? (
                <div className="text-center p-6 text-slate-400 text-xs">
                  No notes recorded yet. Write a comment below to log interviews or profile details.
                </div>
              ) : (
                candidate.hrNotes.map((note) => (
                  <div key={note._id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/70 text-sm space-y-2 relative group font-semibold">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-brand-600 capitalize">{note.author}</span>
                      <span className="text-slate-400">{new Date(note.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>

                    {editingNoteId === note._id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                          value={editNoteContent}
                          onChange={(e) => setEditNoteContent(e.target.value)}
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleSaveEditNote(note._id)}
                            disabled={savingNote}
                            className="p-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors cursor-pointer"
                          >
                            <FiSave className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="p-1 bg-slate-300 text-slate-700 rounded text-xs hover:bg-slate-400 transition-colors cursor-pointer"
                          >
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">{note.content}</p>
                        
                        {/* Note Actions */}
                        <div className="flex space-x-2 justify-end pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditNote(note._id, note.content)}
                            className="text-slate-400 hover:text-indigo-600 p-1 cursor-pointer"
                            title="Edit Note"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note._id)}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                            title="Delete Note"
                          >
                            <FiTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Note Creation Form */}
            <form onSubmit={handleAddNote} className="space-y-3.5 border-t border-slate-100 pt-4">
              <textarea
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold animate-pulse"
                placeholder="Type profile feedback or interview status..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
              />
              <button
                type="submit"
                disabled={addingNote || !newNoteContent.trim()}
                className="w-full flex justify-center items-center space-x-1.5 py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
              >
                <FiPlus className="w-4 h-4" />
                <span>Save Log Note</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ApplicationDetailsPage;
