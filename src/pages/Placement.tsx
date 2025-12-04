import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Edit2, Trash2, TrendingUp, Users, Briefcase, CheckCircle, Loader2, Download, Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';

const API_BASE_URL = 'https://jobflow-backend-ai.onrender.com';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface UserProfile {
  userId: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  year: number;
  cgpa: number;
  skills: string[];
  resumes: Resume[];
  linkedIn: string;
  github: string;
  preferredRoles: string[];
  preferredLocations: string[];
}

interface Resume {
  name: string;
  fileId: string;
  uploadDate: string;
  isActive: boolean;
}

interface OffCampusApplication {
  _id?: string;
  company: string;
  jobTitle: string;
  jobLink: string;
  salary?: number;
  currency: string;
  appliedDate: string;
  statusUpdatedDate: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'accepted';
  notes: string;
  followUpDates: string[];
  source: 'linkedin' | 'indeed' | 'naukri' | 'direct' | 'other';
}

interface OnCampusApplication {
  _id?: string;
  companyName: string;
  role: string;
  appliedDate: string;
  status: 'applied' | 'shortlisted' | 'interview_1' | 'interview_2' | 'interview_3' | 'rejected' | 'offer';
  interviewRounds: number;
  offerPackage?: number;
  offerLocation?: string;
}

interface CompanyDrive {
  _id?: string;
  companyName: string;
  roles: string[];
  cutoffCGPA: number;
  batchDate: string;
  resultsDate: string;
  averagePackage: number;
  numberOfSelected: number;
  totalApplied: number;
}

// ============================================================================
// RESUME MANAGER COMPONENT
// ============================================================================

const ResumeManager: React.FC<{
  userId: string;
  resumes: Resume[];
  onUpdate: () => void;
}> = ({ userId, resumes, onUpdate }) => {
  const [uploading, setUploading] = useState(false);

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch(`${API_BASE_URL}/api/placement/resume/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to upload resume');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Error uploading resume');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResume = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/placement/resume/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to delete resume');
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Error deleting resume');
    }
  };

  const handleDownloadResume = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement/resume/download/${fileId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading resume:', error);
      alert('Error downloading resume');
    }
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800 p-6 mb-8 backdrop-blur-xl">
      <h3 className="text-xl font-bold text-white mb-4">Resume Management</h3>

      <div className="mb-6">
        <Label htmlFor="resume-upload" className="text-gray-300 block mb-2">
          Upload Resume (PDF/DOCX)
        </Label>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800/50 hover:bg-gray-800 transition">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-gray-400" />
            <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
          </div>
          <input
            id="resume-upload"
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={handleResumeUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {resumes && resumes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold mb-3">Your Resumes</h4>
          {resumes.map((resume, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-gray-800/50 p-4 rounded border border-gray-700 hover:border-gray-600 transition"
            >
              <div className="flex-1">
                <p className="text-white font-semibold">{resume.name}</p>
                <p className="text-gray-400 text-sm">
                  Uploaded: {new Date(resume.uploadDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadResume(resume.fileId, resume.name)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center gap-2 transition"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={() => handleDeleteResume(resume.fileId)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded flex items-center gap-2 transition"
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!resumes || resumes.length === 0 && (
        <p className="text-gray-400 text-center py-4">No resumes uploaded yet. Upload one to get started!</p>
      )}
    </Card>
  );
};

// ============================================================================
// PROFILE MANAGER COMPONENT
// ============================================================================

const ProfileManager: React.FC<{
  userId: string;
  profile: UserProfile | null;
  onProfileUpdate: () => void;
}> = ({ userId, profile, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    skills: [],
  });

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      const newSkills = [...(formData.skills || []), skillInput.trim()];
      setFormData({ ...formData, skills: newSkills });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    const newSkills = formData.skills?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, skills: newSkills });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, ...formData })
      });

      if (response.ok) {
        setIsEditing(false);
        onProfileUpdate();
      } else {
        alert('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  if (!profile && !isEditing) {
    return (
      <Card className="bg-gray-900/50 border-gray-800 p-8 mb-8 backdrop-blur-xl">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Create Your Profile</h3>
          <p className="text-gray-400 mb-6">Set up your placement profile to get started</p>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition"
          >
            Create Profile
          </button>
        </div>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <Card className="bg-gray-900/50 border-gray-800 p-8 mb-8 backdrop-blur-xl">
        <h3 className="text-2xl font-bold text-white mb-6">
          {profile ? 'Edit Profile' : 'Create Profile'}
        </h3>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
          <input
            type="text"
            placeholder="College"
            value={formData.college || ''}
            onChange={(e) => setFormData({ ...formData, college: e.target.value })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
          <input
            type="text"
            placeholder="Branch"
            value={formData.branch || ''}
            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
          <input
            type="number"
            placeholder="Year"
            value={formData.year || ''}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
          <input
            type="number"
            placeholder="CGPA"
            value={formData.cgpa || ''}
            onChange={(e) => setFormData({ ...formData, cgpa: parseFloat(e.target.value) })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
            step="0.1"
          />
          <input
            type="text"
            placeholder="LinkedIn Profile"
            value={formData.linkedIn || ''}
            onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
          <input
            type="text"
            placeholder="GitHub Profile"
            value={formData.github || ''}
            onChange={(e) => setFormData({ ...formData, github: e.target.value })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Skills Management */}
        <div className="mb-6">
          <label className="text-white mb-3 block font-semibold">Skills</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Enter a skill (e.g., React)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className="flex-1 bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
            />
            <button
              onClick={handleAddSkill}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded flex items-center gap-2 transition"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.skills?.map((skill, idx) => (
              <span
                key={idx}
                className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-blue-500/50"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(idx)}
                  className="hover:text-blue-100 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            Save Profile
          </button>
          <button
            onClick={() => setIsEditing(false)}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800 p-8 mb-8 backdrop-blur-xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">{profile?.name}</h3>
          <p className="text-gray-400">{profile?.email} | {profile?.phone}</p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
        >
          <Edit2 size={18} />
          Edit Profile
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
          <p className="text-gray-400 text-sm">College</p>
          <p className="text-white font-semibold">{profile?.college}</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
          <p className="text-gray-400 text-sm">Branch</p>
          <p className="text-white font-semibold">{profile?.branch}</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
          <p className="text-gray-400 text-sm">CGPA</p>
          <p className="text-white font-semibold">{profile?.cgpa?.toFixed(2) || 'N/A'}</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
          <p className="text-gray-400 text-sm">Year</p>
          <p className="text-white font-semibold">Year {profile?.year}</p>
        </div>
      </div>

      {profile?.skills && profile.skills.length > 0 && (
        <div className="mb-6">
          <h4 className="text-white font-semibold mb-3">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, idx) => (
              <span key={idx} className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-500/50">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// ============================================================================
// OFF-CAMPUS TRACKER COMPONENT
// ============================================================================

const OffCampusTracker: React.FC<{
  userId: string;
  applications: OffCampusApplication[];
  onUpdate: () => void;
}> = ({ userId, applications, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<OffCampusApplication>>({
    currency: 'INR',
    source: 'linkedin',
    status: 'applied'
  });

  const handleAddApplication = async () => {
    if (!formData.company || !formData.jobTitle) {
      alert('Company and Job Title are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement/off-campus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          ...formData,
          appliedDate: formData.appliedDate || new Date().toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        setFormData({ currency: 'INR', source: 'linkedin', status: 'applied' });
        setShowForm(false);
        onUpdate();
      } else {
        alert('Failed to add application');
      }
    } catch (error) {
      console.error('Error adding application:', error);
      alert('Error adding application');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/placement/off-campus/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to delete application');
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Error deleting application');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: OffCampusApplication['status']) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement/off-campus/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const statusStages = ['applied', 'screening', 'interview', 'offer', 'rejected', 'accepted'];

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-white">Off-Campus Applications</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
        >
          <Plus size={18} />
          Add Application
        </button>
      </div>

      {showForm && (
        <Card className="bg-gray-900/50 border-gray-800 p-6 mb-6 backdrop-blur-xl">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Company Name *"
              value={formData.company || ''}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Job Title *"
              value={formData.jobTitle || ''}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
            />
            <input
              type="url"
              placeholder="Job Link"
              value={formData.jobLink || ''}
              onChange={(e) => setFormData({ ...formData, jobLink: e.target.value })}
              className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
            />
            <input
              type="number"
              placeholder="Salary (Optional)"
              value={formData.salary || ''}
              onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
              className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
            />
            <input
              type="date"
              value={formData.appliedDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
              className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
            />
            <select
              value={formData.source || 'linkedin'}
              onChange={(e) => setFormData({ ...formData, source: e.target.value as OffCampusApplication["source"] })}
              className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
            >
              <option value="linkedin">LinkedIn</option>
              <option value="indeed">Indeed</option>
              <option value="naukri">Naukri</option>
              <option value="direct">Direct</option>
              <option value="other">Other</option>
            </select>
          </div>
          <textarea
            placeholder="Notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none mb-4 h-24"
          />
          <div className="flex gap-4">
            <button
              onClick={handleAddApplication}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              Add Application
            </button>
            <button
              onClick={() => setShowForm(false)}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statusStages.map((stage) => (
          <div key={stage} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <h4 className="text-white font-semibold mb-3 capitalize text-sm">{stage}</h4>
            <div className="space-y-3 min-h-96">
              {applications
                .filter(app => app.status === stage)
                .map(app => (
                  <Card key={app._id} className="bg-gray-800 border-gray-700 p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{app.company}</p>
                        <p className="text-gray-400 text-xs">{app.jobTitle}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteApplication(app._id!)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {app.salary && (
                      <p className="text-blue-400 text-xs mb-2">₹{app.salary.toLocaleString()}</p>
                    )}
                    <p className="text-gray-500 text-xs mb-2">{app.appliedDate}</p>
                    <select
                      value={app.status}
                      onChange={(e) => handleUpdateStatus(app._id!, e.target.value as OffCampusApplication['status'])}
                      className="w-full bg-gray-700 text-white text-xs p-1 rounded border border-gray-600"
                    >
                      {statusStages.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// ON-CAMPUS TRACKER COMPONENT
// ============================================================================

const OnCampusTracker: React.FC<{
  userId: string;
  applications: OnCampusApplication[];
  companyDrives: CompanyDrive[];
  userCGPA: number;
  onUpdate: () => void;
}> = ({ userId, applications, companyDrives, userCGPA, onUpdate }) => {
  const [showDriveForm, setShowDriveForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [driveFormData, setDriveFormData] = useState<Partial<CompanyDrive>>({});

  const handleAddDrive = async () => {
    if (!driveFormData.companyName) {
      alert('Company name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement/company-drives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, ...driveFormData })
      });

      if (response.ok) {
        setDriveFormData({});
        setShowDriveForm(false);
        onUpdate();
      } else {
        alert('Failed to add company drive');
      }
    } catch (error) {
      console.error('Error adding drive:', error);
      alert('Error adding drive');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDrive = async (id: string) => {
    if (!confirm('Are you sure you want to delete this drive?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/placement/company-drives/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to delete drive');
      }
    } catch (error) {
      console.error('Error deleting drive:', error);
      alert('Error deleting drive');
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-white">On-Campus Placements</h3>
        <button
          onClick={() => setShowDriveForm(!showDriveForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
        >
          <Plus size={18} />
          Add Company Drive
        </button>
      </div>

      {showDriveForm && (
        <Card className="bg-gray-900/50 border-gray-800 p-6 mb-6 backdrop-blur-xl">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Company Name *"
              value={driveFormData.companyName || ''}
              onChange={(e) => setDriveFormData({ ...driveFormData, companyName: e.target.value })}
              className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-green-500 outline-none"
            />
            <input
              type="number"
              placeholder="Cutoff CGPA"
              value={driveFormData.cutoffCGPA || ''}
              onChange={(e) => setDriveFormData({ ...driveFormData, cutoffCGPA: parseFloat(e.target.value) })}
              className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-green-500 outline-none"
              step="0.1"
            />
            <input
              type="date"
              placeholder="Batch Date"
              value={driveFormData.batchDate || ''}
              onChange={(e) => setDriveFormData({ ...driveFormData, batchDate: e.target.value })}
              className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-green-500 outline-none"
            />
            <input
              type="date"
              placeholder="Results Date"
              value={driveFormData.resultsDate || ''}
              onChange={(e) => setDriveFormData({ ...driveFormData, resultsDate: e.target.value })}
              className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-green-500 outline-none"
            />
            <input
              type="number"
              placeholder="Average Package (LPA)"
              value={driveFormData.averagePackage || ''}
              onChange={(e) => setDriveFormData({ ...driveFormData, averagePackage: parseFloat(e.target.value) })}
              className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-green-500 outline-none"
            />
            <input
              type="number"
              placeholder="Number Selected"
              value={driveFormData.numberOfSelected || ''}
              onChange={(e) => setDriveFormData({ ...driveFormData, numberOfSelected: parseInt(e.target.value) })}
              className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-green-500 outline-none"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleAddDrive}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              Add Drive
            </button>
            <button
              onClick={() => setShowDriveForm(false)}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {companyDrives.map((drive) => (
          <Card key={drive._id} className="bg-gray-900/50 border-gray-800 p-6 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h4 className="text-xl font-bold text-white">{drive.companyName}</h4>
                {drive.roles && drive.roles.length > 0 && (
                  <p className="text-gray-400 text-sm">{drive.roles.join(', ')}</p>
                )}
              </div>
              <div className="flex gap-2">
                {userCGPA >= drive.cutoffCGPA ? (
                  <span className="bg-green-600/30 text-green-300 px-3 py-1 rounded-full text-xs font-semibold">✓ Eligible</span>
                ) : (
                  <span className="bg-red-600/30 text-red-300 px-3 py-1 rounded-full text-xs font-semibold">✗ Not Eligible</span>
                )}
                <button
                  onClick={() => handleDeleteDrive(drive._id!)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-800/50 p-3 rounded">
                <p className="text-gray-400 text-xs">Cutoff CGPA</p>
                <p className="text-white font-semibold">{drive.cutoffCGPA?.toFixed(2) || 'N/A'}</p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded">
                <p className="text-gray-400 text-xs">Avg Package</p>
                <p className="text-white font-semibold">{drive.averagePackage || 'N/A'} LPA</p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded">
                <p className="text-gray-400 text-xs">Selected</p>
                <p className="text-white font-semibold">{drive.numberOfSelected || 0}</p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded">
                <p className="text-gray-400 text-xs">Batch Date</p>
                <p className="text-white font-semibold text-sm">{drive.batchDate || 'N/A'}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// ANALYTICS DASHBOARD COMPONENT
// ============================================================================

const AnalyticsDashboard: React.FC<{
  offCampusApps: OffCampusApplication[];
  onCampusApps: OnCampusApplication[];
}> = ({ offCampusApps, onCampusApps }) => {
  const stats = {
    totalApplications: offCampusApps.length + onCampusApps.length,
    totalOnCampus: onCampusApps.length,
    totalOffCampus: offCampusApps.length,
    responsesReceived: offCampusApps.filter(a => ['screening', 'interview', 'offer', 'accepted'].includes(a.status)).length,
    interviewsScheduled: offCampusApps.filter(a => ['interview', 'offer', 'accepted'].includes(a.status)).length,
    offersReceived: offCampusApps.filter(a => ['offer', 'accepted'].includes(a.status)).length,
    acceptedOffers: offCampusApps.filter(a => a.status === 'accepted').length + onCampusApps.filter(a => a.status === 'offer').length,
    responseRate: offCampusApps.length > 0 ? (offCampusApps.filter(a => ['screening', 'interview', 'offer', 'accepted'].includes(a.status)).length / offCampusApps.length * 100) : 0,
    conversionRate: offCampusApps.filter(a => ['interview', 'offer', 'accepted'].includes(a.status)).length > 0 ? (offCampusApps.filter(a => ['offer', 'accepted'].includes(a.status)).length / offCampusApps.filter(a => ['interview', 'offer', 'accepted'].includes(a.status)).length * 100) : 0
  };

  const statusDistributionData = [
    { name: 'Applied', value: offCampusApps.filter(a => a.status === 'applied').length, fill: '#3b82f6' },
    { name: 'Screening', value: offCampusApps.filter(a => a.status === 'screening').length, fill: '#f59e0b' },
    { name: 'Interview', value: offCampusApps.filter(a => a.status === 'interview').length, fill: '#a855f7' },
    { name: 'Offer', value: offCampusApps.filter(a => a.status === 'offer').length, fill: '#10b981' },
    { name: 'Rejected', value: offCampusApps.filter(a => a.status === 'rejected').length, fill: '#ef4444' }
  ];

  const sourceBreakdownData = [
    { name: 'LinkedIn', value: offCampusApps.filter(a => a.source === 'linkedin').length },
    { name: 'Indeed', value: offCampusApps.filter(a => a.source === 'indeed').length },
    { name: 'Naukri', value: offCampusApps.filter(a => a.source === 'naukri').length },
    { name: 'Direct', value: offCampusApps.filter(a => a.source === 'direct').length },
    { name: 'Other', value: offCampusApps.filter(a => a.source === 'other').length }
  ];

  const timelineData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      applications: offCampusApps.filter(a => a.appliedDate === dateStr).length
    };
  });

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-white mb-6">Analytics Dashboard</h3>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-700 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm mb-1">Total Applications</p>
              <p className="text-3xl font-bold text-white">{stats.totalApplications}</p>
              <p className="text-blue-300 text-xs mt-1">{stats.totalOffCampus} Off-Campus</p>
            </div>
            <Briefcase size={32} className="text-blue-400 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-700 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm mb-1">Response Rate</p>
              <p className="text-3xl font-bold text-white">{stats.responseRate.toFixed(1)}%</p>
              <p className="text-purple-300 text-xs mt-1">{stats.responsesReceived} responses</p>
            </div>
            <TrendingUp size={32} className="text-purple-400 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-700 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm mb-1">Interviews</p>
              <p className="text-3xl font-bold text-white">{stats.interviewsScheduled}</p>
              <p className="text-green-300 text-xs mt-1">Conversion: {stats.conversionRate.toFixed(1)}%</p>
            </div>
            <CheckCircle size={32} className="text-green-400 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-700 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-300 text-sm mb-1">Offers</p>
              <p className="text-3xl font-bold text-white">{stats.offersReceived}</p>
              <p className="text-yellow-300 text-xs mt-1">{stats.acceptedOffers} accepted</p>
            </div>
            <Users size={32} className="text-yellow-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution Pie Chart */}
        <Card className="bg-gray-900/50 border-gray-800 p-6 backdrop-blur-xl">
          <h4 className="text-white font-semibold mb-4">Application Status Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Application Timeline */}
        <Card className="bg-gray-900/50 border-gray-800 p-6 backdrop-blur-xl">
          <h4 className="text-white font-semibold mb-4">Applications (Last 7 Days)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="applications" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Source Breakdown & Comparison */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Source Breakdown */}
        <Card className="bg-gray-900/50 border-gray-800 p-6 backdrop-blur-xl">
          <h4 className="text-white font-semibold mb-4">Applications by Source</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sourceBreakdownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* On-Campus vs Off-Campus */}
        <Card className="bg-gray-900/50 border-gray-800 p-6 backdrop-blur-xl">
          <h4 className="text-white font-semibold mb-4">On-Campus vs Off-Campus</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Off-Campus Applications</span>
                <span className="text-white font-semibold">{stats.totalOffCampus}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full" 
                  style={{width: `${stats.totalApplications > 0 ? (stats.totalOffCampus / stats.totalApplications * 100) : 0}%`}}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">On-Campus Applications</span>
                <span className="text-white font-semibold">{stats.totalOnCampus}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full" 
                  style={{width: `${stats.totalApplications > 0 ? (stats.totalOnCampus / stats.totalApplications * 100) : 0}%`}}
                />
              </div>
            </div>
            <div className="mt-6 p-4 bg-gray-800/50 rounded border border-gray-700">
              <p className="text-gray-300 text-sm mb-2">Funnel Summary</p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-400">Applied: {stats.totalApplications}</p>
                <p className="text-gray-400">Responses: {stats.responsesReceived} ({stats.responseRate.toFixed(1)}%)</p>
                <p className="text-gray-400">Interviews: {stats.interviewsScheduled}</p>
                <p className="text-gray-400">Offers: {stats.offersReceived}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PLACEMENT PAGE COMPONENT
// ============================================================================

function Placement({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [offCampusApps, setOffCampusApps] = useState<OffCampusApplication[]>([]);
  const [onCampusApps, setOnCampusApps] = useState<OnCampusApplication[]>([]);
  const [companyDrives, setCompanyDrives] = useState<CompanyDrive[]>([]);

  useEffect(() => {
    loadAllData();
  }, [user.id]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profileRes, offCampusRes, onCampusRes, drivesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/placement/profile/${user.id}`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/placement/off-campus/${user.id}`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/placement/on-campus/${user.id}`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/placement/company-drives/${user.id}`, { credentials: 'include' })
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      if (offCampusRes.ok) {
        const offCampusData = await offCampusRes.json();
        setOffCampusApps(offCampusData);
      }

      if (onCampusRes.ok) {
        const onCampusData = await onCampusRes.json();
        setOnCampusApps(onCampusData);
      }

      if (drivesRes.ok) {
        const drivesData = await drivesRes.json();
        setCompanyDrives(drivesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-white text-lg">Loading your placement data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Placement Tracker
          </h1>
          <p className="text-gray-400">Manage your profile, resumes, and applications in one place</p>
        </div>

        {/* Profile Section */}
        <ProfileManager 
          userId={user.id}
          profile={profile} 
          onProfileUpdate={loadAllData}
        />

        {/* Resume Manager */}
        <ResumeManager 
          userId={user.id}
          resumes={profile?.resumes || []}
          onUpdate={loadAllData}
        />

        {/* Off-Campus Tracker */}
        <OffCampusTracker 
          userId={user.id}
          applications={offCampusApps} 
          onUpdate={loadAllData}
        />

        {/* On-Campus Tracker */}
        <OnCampusTracker 
          userId={user.id}
          applications={onCampusApps}
          companyDrives={companyDrives}
          userCGPA={profile?.cgpa || 0}
          onUpdate={loadAllData}
        />

        {/* Analytics Dashboard */}
        <AnalyticsDashboard 
          offCampusApps={offCampusApps}
          onCampusApps={onCampusApps}
        />
      </div>
    </div>
  );
}

export default Placement;