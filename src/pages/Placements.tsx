import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Edit2, Trash2, TrendingUp, Users, Briefcase, CheckCircle, Loader2, Download, Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';

const API_BASE_URL = import.meta.env.VITE_API_URL;

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
  const [deleting, setDeleting] = useState<string | null>(null);

  // Upload resume with validation
  const handleResumeUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  /** ======================
   *  REQUIRED VALIDATION
   *  =====================*/

  // 1️⃣ Allowed extensions
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  if (!allowedTypes.includes(file.type)) {
    alert("Upload only PDF or Word document.");
    event.target.value = "";
    return;
  }

  // 2️⃣ 5MB Size limit
  if (file.size > 5 * 1024 * 1024) {
    alert("File size must be less than 5MB.");
    event.target.value = "";
    return;
  }

  setUploading(true);

  try {
    /** ======================
     *  REQUIRED DATA ONLY
     *  =====================*/
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    console.log("Uploading resume for user:", userId);

    const response = await fetch(
      `${API_BASE_URL}/api/placement/resume/upload`,
      {
        method: "POST",
        credentials: "include",
        body: formData
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Upload failed:", data);

      // Backend sends clean messages
      alert(data.error || "Failed to upload resume.");

      return;
    }

    console.log("Upload success:", data);
    alert("Resume uploaded successfully!");
    onUpdate(); // refresh data

  } catch (err) {
    console.error("Error uploading resume:", err);
    alert("Network error. Please try again.");
  } finally {
    setUploading(false);
    event.target.value = "";
  }
};


  // Delete resume
  const handleDeleteResume = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;

    setDeleting(fileId);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/placement/resume/${fileId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Deleted resumes:", data.resumes);
        alert("Resume deleted successfully!");
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete resume");
      }
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert("Error deleting resume");
    } finally {
      setDeleting(null);
    }
  };

  // Download resume
  const handleDownloadResume = async (
    fileId: string,
    fileName: string
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/placement/resume/download/${fileId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        alert("File not found");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading resume:", error);
      alert("Error downloading resume");
    }
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800 p-6 mb-8 backdrop-blur-xl">
      <h3 className="text-xl font-bold text-white mb-4">Resume Management</h3>

      {/* Upload */}
      <div className="mb-6">
        <Label htmlFor="resume-upload" className="text-gray-300 block mb-2">
          Upload Resume (PDF/DOCX, Max 5MB)
        </Label>

        <label
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition ${
            uploading 
              ? "border-blue-500 bg-blue-900/20 cursor-wait" 
              : "border-gray-600 bg-gray-800/50 hover:bg-gray-800 cursor-pointer"
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 mb-2 text-blue-400 animate-spin" />
                <p className="text-sm text-blue-400">Uploading your resume...</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX (max 5MB)</p>
              </>
            )}
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

      {/* List resumes */}
      {resumes && resumes.length > 0 ? (
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
                {/* Download */}
                <button
                  onClick={() =>
                    handleDownloadResume(resume.fileId, resume.name)
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center gap-2 transition"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Download</span>
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteResume(resume.fileId)}
                  className={`px-3 py-2 rounded flex items-center gap-2 transition ${
                    deleting === resume.fileId
                      ? "bg-red-800 text-white cursor-wait"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                  disabled={deleting === resume.fileId}
                >
                  {deleting === resume.fileId ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  <span className="hidden sm:inline">
                    {deleting === resume.fileId ? "Deleting..." : "Delete"}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !uploading && (
          <p className="text-gray-400 text-center py-4">
            No resumes uploaded yet. Upload one to get started!
          </p>
        )
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
        alert('Profile saved successfully!');
        setIsEditing(false);
        onProfileUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save profile');
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
            value={formData.cgpa ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setFormData({
                ...formData,
                cgpa: v === "" ? null : parseFloat(v),
              });
            }}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
            step="0.01"
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
          
          {/* Social Links */}
          <div className="flex gap-3 mt-3">
            {profile?.linkedIn && (
              <a
                href={profile.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded border border-blue-500/50 transition text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            )}
            
            {profile?.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 px-3 py-1.5 rounded border border-gray-500/50 transition text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            )}
          </div>
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
         <p className="text-white font-semibold">
          {profile?.cgpa != null
            ? profile.cgpa.toFixed(3)
            : "N/A"}
        </p>

        </div>
        <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
          <p className="text-gray-400 text-sm">Year</p>
          <p className="text-white font-semibold"> {profile?.year} Year</p>
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
        alert('Application added successfully!');
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add application');
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
        alert('Application deleted successfully!');
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete application');
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
        const data = await response.json();
        alert(data.error || 'Failed to update status');
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
        alert('Company drive added successfully!');
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add company drive');
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
        alert('Company drive deleted successfully!');
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete drive');
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