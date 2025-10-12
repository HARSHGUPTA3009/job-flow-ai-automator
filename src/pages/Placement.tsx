import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Edit2, Trash2, Download, TrendingUp, Users, Briefcase, CheckCircle } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserProfile {
  id: string;
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
  id: string;
  name: string;
  url: string;
  uploadDate: string;
  isActive: boolean;
}

interface OffCampusApplication {
  id: string;
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
  id: string;
  companyName: string;
  role: string;
  appliedDate: string;
  status: 'applied' | 'shortlisted' | 'interview_1' | 'interview_2' | 'interview_3' | 'rejected' | 'offer';
  interviewRounds: number;
  offerPackage?: number;
  offerLocation?: string;
}

interface CompanyDrive {
  id: string;
  companyName: string;
  roles: string[];
  cutoffCGPA: number;
  batchDate: string;
  resultsDate: string;
  averagePackage: number;
  numberOfSelected: number;
  totalApplied: number;
}

interface Analytics {
  totalApplications: number;
  totalOnCampus: number;
  totalOffCampus: number;
  responsesReceived: number;
  interviewsScheduled: number;
  offersReceived: number;
  acceptedOffers: number;
  responseRate: number;
  conversionRate: number;
}

// ============================================================================
// PROFILE MANAGER COMPONENT
// ============================================================================

const ProfileManager: React.FC<{
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
}> = ({ profile, setProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);

  const handleSave = () => {
    setProfile(formData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="bg-gray-900/50 border-gray-800 p-8 mb-8">
        <h3 className="text-2xl font-bold text-white mb-6">Edit Profile</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
          <input
            type="text"
            placeholder="College"
            value={formData.college}
            onChange={(e) => setFormData({ ...formData, college: e.target.value })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
          <input
            type="text"
            placeholder="Branch"
            value={formData.branch}
            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
          <input
            type="number"
            placeholder="CGPA"
            value={formData.cgpa}
            onChange={(e) => setFormData({ ...formData, cgpa: parseFloat(e.target.value) })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
            step="0.1"
          />
          <input
            type="text"
            placeholder="LinkedIn Profile"
            value={formData.linkedIn}
            onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
          <input
            type="text"
            placeholder="GitHub Profile"
            value={formData.github}
            onChange={(e) => setFormData({ ...formData, github: e.target.value })}
            className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
        </div>
        
        <div className="mb-6">
          <label className="text-white mb-2 block">Skills (comma-separated)</label>
          <input
            type="text"
            placeholder="React, Node.js, MongoDB, etc"
            value={formData.skills.join(', ')}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()) })}
            className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition"
          >
            Save Profile
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded transition"
          >
            Cancel
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800 p-8 mb-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">{profile.name}</h3>
          <p className="text-gray-400">{profile.email} | {profile.phone}</p>
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
          <p className="text-white font-semibold">{profile.college}</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
          <p className="text-gray-400 text-sm">Branch</p>
          <p className="text-white font-semibold">{profile.branch}</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
          <p className="text-gray-400 text-sm">CGPA</p>
          <p className="text-white font-semibold">{profile.cgpa.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
          <p className="text-gray-400 text-sm">Year</p>
          <p className="text-white font-semibold">Year {profile.year}</p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-white font-semibold mb-3">Skills</h4>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill, idx) => (
            <span key={idx} className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-sm">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {profile.resumes.length > 0 && (
        <div>
          <h4 className="text-white font-semibold mb-3">Resumes</h4>
          <div className="space-y-2">
            {profile.resumes.map((resume, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-800/50 p-3 rounded border border-gray-700">
                <div>
                  <p className="text-white">{resume.name}</p>
                  <p className="text-gray-400 text-sm">{resume.uploadDate}</p>
                </div>
                {resume.isActive && <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Active</span>}
              </div>
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
  applications: OffCampusApplication[];
  setApplications: (apps: OffCampusApplication[]) => void;
}> = ({ applications, setApplications }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<OffCampusApplication>>({
    currency: 'INR',
    source: 'linkedin'
  });

  const handleAddApplication = () => {
    if (formData.company && formData.jobTitle) {
      const newApp: OffCampusApplication = {
        id: Date.now().toString(),
        company: formData.company || '',
        jobTitle: formData.jobTitle || '',
        jobLink: formData.jobLink || '',
        salary: formData.salary,
        currency: formData.currency || 'INR',
        appliedDate: formData.appliedDate || new Date().toISOString().split('T')[0],
        statusUpdatedDate: new Date().toISOString().split('T')[0],
        status: 'applied',
        notes: formData.notes || '',
        followUpDates: [],
        source: formData.source || 'linkedin'
      };
      setApplications([...applications, newApp]);
      setFormData({ currency: 'INR', source: 'linkedin' });
      setShowForm(false);
    }
  };

  const handleDeleteApplication = (id: string) => {
    setApplications(applications.filter(app => app.id !== id));
  };

  const statusColors = {
    applied: 'bg-blue-600/20 text-blue-300 border-blue-600',
    screening: 'bg-yellow-600/20 text-yellow-300 border-yellow-600',
    interview: 'bg-purple-600/20 text-purple-300 border-purple-600',
    offer: 'bg-green-600/20 text-green-300 border-green-600',
    rejected: 'bg-red-600/20 text-red-300 border-red-600',
    accepted: 'bg-green-600/40 text-green-200 border-green-600'
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
        <Card className="bg-gray-900/50 border-gray-800 p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Company Name"
              value={formData.company || ''}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Job Title"
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
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition"
            >
              Add Application
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded transition"
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
                  <Card key={app.id} className="bg-gray-800 border-gray-700 p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{app.company}</p>
                        <p className="text-gray-400 text-xs">{app.jobTitle}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteApplication(app.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {app.salary && (
                      <p className="text-blue-400 text-xs mb-2">₹{app.salary.toLocaleString()}</p>
                    )}
                    <p className="text-gray-500 text-xs">{app.appliedDate}</p>
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
  applications: OnCampusApplication[];
  companyDrives: CompanyDrive[];
  setApplications: (apps: OnCampusApplication[]) => void;
  setCompanyDrives: (drives: CompanyDrive[]) => void;
  userCGPA: number;
}> = ({ applications, companyDrives, setApplications, setCompanyDrives, userCGPA }) => {
  const [showDriveForm, setShowDriveForm] = useState(false);
  const [driveFormData, setDriveFormData] = useState<Partial<CompanyDrive>>({});

  const handleAddDrive = () => {
    if (driveFormData.companyName) {
      const newDrive: CompanyDrive = {
        id: Date.now().toString(),
        companyName: driveFormData.companyName || '',
        roles: driveFormData.roles || [],
        cutoffCGPA: driveFormData.cutoffCGPA || 0,
        batchDate: driveFormData.batchDate || '',
        resultsDate: driveFormData.resultsDate || '',
        averagePackage: driveFormData.averagePackage || 0,
        numberOfSelected: driveFormData.numberOfSelected || 0,
        totalApplied: driveFormData.totalApplied || 0
      };
      setCompanyDrives([...companyDrives, newDrive]);
      setDriveFormData({});
      setShowDriveForm(false);
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
        <Card className="bg-gray-900/50 border-gray-800 p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Company Name"
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
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition"
            >
              Add Drive
            </button>
            <button
              onClick={() => setShowDriveForm(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded transition"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {companyDrives.map((drive) => (
          <Card key={drive.id} className="bg-gray-900/50 border-gray-800 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-bold text-white">{drive.companyName}</h4>
                <p className="text-gray-400 text-sm">{drive.roles.join(', ')}</p>
              </div>
              {userCGPA >= drive.cutoffCGPA ? (
                <span className="bg-green-600/30 text-green-300 px-3 py-1 rounded-full text-xs font-semibold">✓ Eligible</span>
              ) : (
                <span className="bg-red-600/30 text-red-300 px-3 py-1 rounded-full text-xs font-semibold">✗ Not Eligible</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-800/50 p-3 rounded">
                <p className="text-gray-400 text-xs">Cutoff CGPA</p>
                <p className="text-white font-semibold">{drive.cutoffCGPA.toFixed(2)}</p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded">
                <p className="text-gray-400 text-xs">Avg Package</p>
                <p className="text-white font-semibold">{drive.averagePackage} LPA</p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded">
                <p className="text-gray-400 text-xs">Selected</p>
                <p className="text-white font-semibold">{drive.numberOfSelected}</p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded">
                <p className="text-gray-400 text-xs">Batch Date</p>
                <p className="text-white font-semibold text-sm">{drive.batchDate}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm transition">
                Apply
              </button>
              <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm transition">
                View Details
              </button>
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
  // Calculate statistics
  const stats: Analytics = {
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

  // Prepare data for charts
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
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm mb-1">Total Applications</p>
              <p className="text-3xl font-bold text-white">{stats.totalApplications}</p>
              <p className="text-blue-300 text-xs mt-1">{stats.totalOffCampus} Off-Campus</p>
            </div>
            <Briefcase size={32} className="text-blue-400 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm mb-1">Response Rate</p>
              <p className="text-3xl font-bold text-white">{stats.responseRate.toFixed(1)}%</p>
              <p className="text-purple-300 text-xs mt-1">{stats.responsesReceived} responses</p>
            </div>
            <TrendingUp size={32} className="text-purple-400 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm mb-1">Interviews</p>
              <p className="text-3xl font-bold text-white">{stats.interviewsScheduled}</p>
              <p className="text-green-300 text-xs mt-1">Conversion: {stats.conversionRate.toFixed(1)}%</p>
            </div>
            <CheckCircle size={32} className="text-green-400 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-700 p-6">
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
        <Card className="bg-gray-900/50 border-gray-800 p-6">
          <h4 className="text-white font-semibold mb-4">Application Status Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
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
        <Card className="bg-gray-900/50 border-gray-800 p-6">
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
        <Card className="bg-gray-900/50 border-gray-800 p-6">
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
        <Card className="bg-gray-900/50 border-gray-800 p-6">
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
                  style={{width: `${(stats.totalOffCampus / stats.totalApplications * 100) || 0}%`}}
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
                  style={{width: `${(stats.totalOnCampus / stats.totalApplications * 100) || 0}%`}}
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

export default function Placement() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+91-9876543210',
    college: 'Indian Institute of Technology',
    branch: 'Computer Science',
    year: 3,
    cgpa: 8.5,
    skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Python'],
    resumes: [
      {
        id: '1',
        name: 'Resume v1.pdf',
        url: '#',
        uploadDate: '2024-01-15',
        isActive: true
      }
    ],
    linkedIn: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    preferredRoles: ['Full Stack Developer', 'Software Engineer'],
    preferredLocations: ['Bangalore', 'Hyderabad', 'Delhi']
  });

  const [offCampusApps, setOffCampusApps] = useState<OffCampusApplication[]>([
    {
      id: '1',
      company: 'Google',
      jobTitle: 'Software Engineer',
      jobLink: 'https://careers.google.com',
      salary: 2500000,
      currency: 'INR',
      appliedDate: '2024-01-10',
      statusUpdatedDate: '2024-01-10',
      status: 'interview',
      notes: 'Initial round passed, waiting for second round',
      followUpDates: ['2024-02-15'],
      source: 'linkedin'
    },
    {
      id: '2',
      company: 'Amazon',
      jobTitle: 'SDE-1',
      jobLink: 'https://amazon.jobs',
      salary: 2000000,
      currency: 'INR',
      appliedDate: '2024-01-08',
      statusUpdatedDate: '2024-01-09',
      status: 'screening',
      notes: 'Under HR screening',
      followUpDates: [],
      source: 'indeed'
    },
    {
      id: '3',
      company: 'Microsoft',
      jobTitle: 'Software Engineer 2',
      jobLink: 'https://microsoft.com/careers',
      salary: 2200000,
      currency: 'INR',
      appliedDate: '2024-01-05',
      statusUpdatedDate: '2024-01-05',
      status: 'applied',
      notes: 'Just applied, waiting for response',
      followUpDates: ['2024-02-05'],
      source: 'linkedin'
    }
  ]);

  const [onCampusApps, setOnCampusApps] = useState<OnCampusApplication[]>([
    {
      id: '1',
      companyName: 'Accenture',
      role: 'Associate',
      appliedDate: '2024-01-12',
      status: 'offer',
      interviewRounds: 2,
      offerPackage: 10,
      offerLocation: 'Bangalore'
    }
  ]);

  const [companyDrives, setCompanyDrives] = useState<CompanyDrive[]>([
    {
      id: '1',
      companyName: 'Infosys',
      roles: ['System Engineer', 'Technical Associate'],
      cutoffCGPA: 7.5,
      batchDate: '2024-02-01',
      resultsDate: '2024-02-10',
      averagePackage: 8.5,
      numberOfSelected: 50,
      totalApplied: 500
    },
    {
      id: '2',
      companyName: 'TCS',
      roles: ['Software Engineer', 'Developer'],
      cutoffCGPA: 8.0,
      batchDate: '2024-02-15',
      resultsDate: '2024-02-25',
      averagePackage: 9.0,
      numberOfSelected: 75,
      totalApplied: 800
    }
  ]);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Placement Tracker
          </h1>
          <p className="text-gray-400">Manage your campus and off-campus placements in one place</p>
        </div>

        {/* Profile Section */}
        <ProfileManager profile={profile} setProfile={setProfile} />

        {/* Off-Campus Tracker */}
        <OffCampusTracker 
          applications={offCampusApps} 
          setApplications={setOffCampusApps}
        />

        {/* On-Campus Tracker */}
        <OnCampusTracker 
          applications={onCampusApps}
          companyDrives={companyDrives}
          setApplications={setOnCampusApps}
          setCompanyDrives={setCompanyDrives}
          userCGPA={profile.cgpa}
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