import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Plus, Edit2, Trash2, TrendingUp, Users, Briefcase,
  CheckCircle, Loader2, Download, Upload, Save, X,
  FileText, ExternalLink, Github, Linkedin, ChevronRight,
  BarChart2, Target, Award, BookOpen
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

interface User { id: string; email: string; name?: string; }

interface UserProfile {
  userId: string; name: string; email: string; phone: string;
  college: string; branch: string; year: number; cgpa: number;
  skills: string[]; resumes: Resume[]; linkedIn: string;
  github: string; preferredRoles: string[]; preferredLocations: string[];
}

interface Resume { name: string; fileId: string; uploadDate: string; isActive: boolean; }

interface OffCampusApplication {
  _id?: string; company: string; jobTitle: string; jobLink: string;
  salary?: number; currency: string; appliedDate: string;
  statusUpdatedDate: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'accepted';
  notes: string; followUpDates: string[];
  source: 'linkedin' | 'indeed' | 'naukri' | 'direct' | 'other';
}

interface OnCampusApplication {
  _id?: string; companyName: string; role: string; appliedDate: string;
  status: 'applied' | 'shortlisted' | 'interview_1' | 'interview_2' | 'interview_3' | 'rejected' | 'offer';
  interviewRounds: number; offerPackage?: number; offerLocation?: string;
}

interface CompanyDrive {
  _id?: string; companyName: string; roles: string[]; cutoffCGPA: number;
  batchDate: string; resultsDate: string; averagePackage: number;
  numberOfSelected: number; totalApplied: number;
}

// ─── Status badge helper ──────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  applied:     'bg-blue-500/15 text-blue-400 border-blue-500/30',
  screening:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  interview:   'bg-purple-500/15 text-purple-400 border-purple-500/30',
  offer:       'bg-green-500/15 text-green-400 border-green-500/30',
  accepted:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected:    'bg-red-500/15 text-red-400 border-red-500/30',
  shortlisted: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[status] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
    {status.replace(/_/g, ' ').toUpperCase()}
  </span>
);

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeader = ({
  icon: Icon, title, subtitle, action
}: { icon: React.ElementType; title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div className="flex items-start justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-blue-400" />
      </div>
      <div>
        <h3 className="text-white font-semibold text-base leading-tight">{title}</h3>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

// ─── Input / Select helpers ───────────────────────────────────────────────────

const inputCls = "w-full bg-[#0f1117] text-white text-sm p-2.5 rounded-lg border border-gray-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 outline-none transition placeholder-gray-600";
const selectCls = `${inputCls} cursor-pointer`;

const AddBtn = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
  >
    <Plus size={13} /> {label}
  </button>
);

const CancelBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold px-3 py-2 rounded-lg transition">
    <X size={13} /> Cancel
  </button>
);

// ─── RESUME MANAGER ───────────────────────────────────────────────────────────

const ResumeManager: React.FC<{ userId: string; resumes: Resume[]; onUpdate: () => void }> = ({ userId, resumes, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) { alert('Upload only PDF or Word document.'); e.target.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB.'); e.target.value = ''; return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('userId', userId);
      const res = await fetch(`${API_BASE_URL}/api/placement/resume/upload`, { method: 'POST', credentials: 'include', body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Upload failed.'); return; }
      alert('Resume uploaded!'); onUpdate();
    } catch { alert('Network error.'); } finally { setUploading(false); e.target.value = ''; }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Delete this resume?')) return;
    setDeleting(fileId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/placement/resume/${fileId}`, { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
      if (res.ok) { alert('Deleted.'); onUpdate(); } else { const d = await res.json(); alert(d.error || 'Delete failed'); }
    } catch { alert('Error deleting.'); } finally { setDeleting(null); }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/placement/resume/download/${fileId}`, { credentials: 'include' });
      if (!res.ok) { alert('File not found'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch { alert('Download error'); }
  };

  return (
    <div className="cc-card mb-5">
      <SectionHeader icon={FileText} title="Resume Management" subtitle="Upload and manage your resumes" />

      {/* Upload zone */}
      <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl transition cursor-pointer mb-5 ${uploading ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-800 hover:border-gray-600 bg-[#0f1117]/60'}`}>
        <div className="flex flex-col items-center gap-1.5">
          {uploading
            ? <><Loader2 size={20} className="text-blue-400 animate-spin" /><span className="text-blue-400 text-xs">Uploading...</span></>
            : <><Upload size={20} className="text-gray-500" /><span className="text-gray-400 text-xs font-medium">Click to upload resume</span><span className="text-gray-600 text-[11px]">PDF, DOC, DOCX · Max 5 MB</span></>
          }
        </div>
        <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleUpload} disabled={uploading} />
      </label>

      {/* List */}
      {resumes && resumes.length > 0 ? (
        <div className="space-y-2">
          {resumes.map((r, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#0f1117] border border-gray-800 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <FileText size={14} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{r.name}</p>
                <p className="text-gray-500 text-[11px]">{new Date(r.uploadDate).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDownload(r.fileId, r.name)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition">
                  <Download size={12} /> Download
                </button>
                <button onClick={() => handleDelete(r.fileId)} disabled={deleting === r.fileId} className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition">
                  {deleting === r.fileId ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-sm text-center py-4">No resumes uploaded yet</p>
      )}
    </div>
  );
};

// ─── PROFILE MANAGER ──────────────────────────────────────────────────────────

const ProfileManager: React.FC<{ userId: string; profile: UserProfile | null; onProfileUpdate: () => void }> = ({ userId, profile, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState<Partial<UserProfile>>({ skills: [] });

  useEffect(() => { if (profile) setFormData(profile); }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/placement/profile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userId, ...formData }) });
      if (res.ok) { alert('Saved!'); setIsEditing(false); onProfileUpdate(); }
      else { const d = await res.json(); alert(d.error || 'Save failed'); }
    } catch { alert('Error'); } finally { setLoading(false); }
  };

  if (!profile && !isEditing) return (
    <div className="cc-card mb-5 flex flex-col items-center py-10 gap-3">
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
        <BookOpen size={20} className="text-blue-400" />
      </div>
      <p className="text-white font-semibold">Set up your placement profile</p>
      <p className="text-gray-500 text-sm">Add your academic info and skills</p>
      <AddBtn onClick={() => setIsEditing(true)} label="Create Profile" />
    </div>
  );

  if (isEditing) return (
    <div className="cc-card mb-5">
      <SectionHeader icon={BookOpen} title={profile ? 'Edit Profile' : 'Create Profile'} subtitle="Academic and personal information" />
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {[
          { ph: 'Full Name', key: 'name', type: 'text' },
          { ph: 'Email', key: 'email', type: 'email' },
          { ph: 'Phone', key: 'phone', type: 'tel' },
          { ph: 'College', key: 'college', type: 'text' },
          { ph: 'Branch', key: 'branch', type: 'text' },
          { ph: 'Year', key: 'year', type: 'number' },
          { ph: 'CGPA', key: 'cgpa', type: 'number' },
          { ph: 'LinkedIn URL', key: 'linkedIn', type: 'text' },
          { ph: 'GitHub URL', key: 'github', type: 'text' },
        ].map(({ ph, key, type }) => (
          <input key={key} type={type} placeholder={ph} value={(formData as any)[key] ?? ''} onChange={e => setFormData({ ...formData, [key]: type === 'number' ? (e.target.value === '' ? null : parseFloat(e.target.value)) : e.target.value })} className={inputCls} />
        ))}
      </div>
      {/* Skills */}
      <div className="mb-4">
        <p className="text-gray-400 text-xs font-medium mb-2">Skills</p>
        <div className="flex gap-2 mb-2">
          <input type="text" placeholder="Add skill…" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (skillInput.trim()) { setFormData({ ...formData, skills: [...(formData.skills || []), skillInput.trim()] }); setSkillInput(''); } } }} className={inputCls} />
          <button onClick={() => { if (skillInput.trim()) { setFormData({ ...formData, skills: [...(formData.skills || []), skillInput.trim()] }); setSkillInput(''); } }} className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-lg text-xs font-semibold transition flex-shrink-0">Add</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {formData.skills?.map((s, i) => (
            <span key={i} className="bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
              {s}<button onClick={() => setFormData({ ...formData, skills: formData.skills!.filter((_, j) => j !== i) })} className="hover:text-white">×</button>
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={loading} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Profile
        </button>
        <CancelBtn onClick={() => setIsEditing(false)} />
      </div>
    </div>
  );

  return (
    <div className="cc-card mb-5">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center text-white font-bold text-base">
            {profile?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-white font-semibold">{profile?.name}</p>
            <p className="text-gray-500 text-xs">{profile?.email} · {profile?.phone}</p>
          </div>
        </div>
        <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold px-3 py-2 rounded-lg transition">
          <Edit2 size={12} /> Edit
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'College', value: profile?.college },
          { label: 'Branch', value: profile?.branch },
          { label: 'CGPA', value: profile?.cgpa != null ? profile.cgpa.toFixed(2) : 'N/A' },
          { label: 'Year', value: profile?.year ? `${profile.year} Year` : 'N/A' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#0f1117] border border-gray-800 rounded-xl p-3">
            <p className="text-gray-500 text-[10px] mb-0.5">{label}</p>
            <p className="text-white text-sm font-semibold truncate">{value ?? '—'}</p>
          </div>
        ))}
      </div>

      {(profile?.linkedIn || profile?.github) && (
        <div className="flex gap-2 mb-5">
          {profile.linkedIn && (
            <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition">
              <Linkedin size={12} /> LinkedIn
            </a>
          )}
          {profile.github && (
            <a href={profile.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-700 transition">
              <Github size={12} /> GitHub
            </a>
          )}
        </div>
      )}

      {profile?.skills && profile.skills.length > 0 && (
        <div>
          <p className="text-gray-500 text-[10px] font-medium mb-2 uppercase tracking-wider">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((s, i) => (
              <span key={i} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] px-2.5 py-1 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── OFF-CAMPUS TRACKER ───────────────────────────────────────────────────────

const OffCampusTracker: React.FC<{ userId: string; applications: OffCampusApplication[]; onUpdate: () => void }> = ({ userId, applications, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fd, setFd] = useState<Partial<OffCampusApplication>>({ currency: 'INR', source: 'linkedin', status: 'applied' });

  const handleAdd = async () => {
    if (!fd.company || !fd.jobTitle) { alert('Company and Job Title required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/placement/off-campus`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userId, ...fd, appliedDate: fd.appliedDate || new Date().toISOString().split('T')[0] }) });
      if (res.ok) { setFd({ currency: 'INR', source: 'linkedin', status: 'applied' }); setShowForm(false); onUpdate(); }
      else { const d = await res.json(); alert(d.error || 'Failed'); }
    } catch { alert('Error'); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/placement/off-campus/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) onUpdate(); else { const d = await res.json(); alert(d.error || 'Failed'); }
    } catch { alert('Error'); }
  };

  const handleStatus = async (id: string, status: OffCampusApplication['status']) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/placement/off-campus/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status }) });
      if (res.ok) onUpdate();
    } catch { alert('Error'); }
  };

  const stages = ['applied', 'screening', 'interview', 'offer', 'rejected', 'accepted'] as const;

  return (
    <div className="cc-card mb-5">
      <SectionHeader
        icon={Briefcase}
        title="Off-Campus Applications"
        subtitle={`${applications.length} applications tracked`}
        action={<AddBtn onClick={() => setShowForm(v => !v)} label="Add Application" />}
      />

      {showForm && (
        <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-4 mb-5">
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input type="text" placeholder="Company Name *" value={fd.company || ''} onChange={e => setFd({ ...fd, company: e.target.value })} className={inputCls} />
            <input type="text" placeholder="Job Title *" value={fd.jobTitle || ''} onChange={e => setFd({ ...fd, jobTitle: e.target.value })} className={inputCls} />
            <input type="url" placeholder="Job Link" value={fd.jobLink || ''} onChange={e => setFd({ ...fd, jobLink: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Salary (optional)" value={fd.salary || ''} onChange={e => setFd({ ...fd, salary: parseFloat(e.target.value) })} className={inputCls} />
            <input type="date" value={fd.appliedDate || new Date().toISOString().split('T')[0]} onChange={e => setFd({ ...fd, appliedDate: e.target.value })} className={inputCls} />
            <select value={fd.source || 'linkedin'} onChange={e => setFd({ ...fd, source: e.target.value as any })} className={selectCls}>
              {['linkedin','indeed','naukri','direct','other'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <textarea placeholder="Notes…" value={fd.notes || ''} onChange={e => setFd({ ...fd, notes: e.target.value })} className={`${inputCls} h-20 resize-none mb-3`} />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={loading} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
            </button>
            <CancelBtn onClick={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {/* Kanban */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {stages.map(stage => (
          <div key={stage} className="bg-[#0f1117] border border-gray-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <StatusBadge status={stage} />
              <span className="text-gray-600 text-[11px] font-semibold">{applications.filter(a => a.status === stage).length}</span>
            </div>
            <div className="space-y-2 min-h-24">
              {applications.filter(a => a.status === stage).map(app => (
                <div key={app._id} className="bg-[#161b27] border border-gray-800/80 rounded-lg p-2.5">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 min-w-0 mr-1">
                      <p className="text-white text-[11px] font-semibold truncate">{app.company}</p>
                      <p className="text-gray-500 text-[10px] truncate">{app.jobTitle}</p>
                    </div>
                    <button onClick={() => handleDelete(app._id!)} className="text-gray-700 hover:text-red-400 flex-shrink-0">
                      <Trash2 size={11} />
                    </button>
                  </div>
                  {app.salary && <p className="text-blue-400 text-[10px] mb-1.5">₹{app.salary.toLocaleString()}</p>}
                  {app.jobLink && (
                    <a href={app.jobLink} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-400 flex items-center gap-0.5 text-[10px] mb-1.5">
                      <ExternalLink size={9} /> View
                    </a>
                  )}
                  <select value={app.status} onChange={e => handleStatus(app._id!, e.target.value as any)} className="w-full bg-[#0f1117] text-gray-400 text-[10px] py-1 px-1.5 rounded border border-gray-800 outline-none">
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── ON-CAMPUS TRACKER ────────────────────────────────────────────────────────

const OnCampusTracker: React.FC<{ userId: string; applications: OnCampusApplication[]; companyDrives: CompanyDrive[]; userCGPA: number; onUpdate: () => void }> = ({ userId, companyDrives, userCGPA, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fd, setFd] = useState<Partial<CompanyDrive>>({});

  const handleAdd = async () => {
    if (!fd.companyName) { alert('Company name required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/placement/company-drives`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userId, ...fd }) });
      if (res.ok) { setFd({}); setShowForm(false); onUpdate(); }
      else { const d = await res.json(); alert(d.error || 'Failed'); }
    } catch { alert('Error'); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/placement/company-drives/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) onUpdate(); else { const d = await res.json(); alert(d.error || 'Failed'); }
    } catch { alert('Error'); }
  };

  return (
    <div className="cc-card mb-5">
      <SectionHeader
        icon={Award}
        title="On-Campus Placements"
        subtitle={`${companyDrives.length} company drives`}
        action={<AddBtn onClick={() => setShowForm(v => !v)} label="Add Drive" />}
      />

      {showForm && (
        <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-4 mb-5">
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input type="text" placeholder="Company Name *" value={fd.companyName || ''} onChange={e => setFd({ ...fd, companyName: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Cutoff CGPA" value={fd.cutoffCGPA || ''} onChange={e => setFd({ ...fd, cutoffCGPA: parseFloat(e.target.value) })} className={inputCls} step="0.1" />
            <input type="date" placeholder="Batch Date" value={fd.batchDate || ''} onChange={e => setFd({ ...fd, batchDate: e.target.value })} className={inputCls} />
            <input type="date" placeholder="Results Date" value={fd.resultsDate || ''} onChange={e => setFd({ ...fd, resultsDate: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Avg Package (LPA)" value={fd.averagePackage || ''} onChange={e => setFd({ ...fd, averagePackage: parseFloat(e.target.value) })} className={inputCls} />
            <input type="number" placeholder="No. of Selected" value={fd.numberOfSelected || ''} onChange={e => setFd({ ...fd, numberOfSelected: parseInt(e.target.value) })} className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={loading} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add Drive
            </button>
            <CancelBtn onClick={() => setShowForm(false)} />
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {companyDrives.map(drive => (
          <div key={drive._id} className="bg-[#0f1117] border border-gray-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white font-semibold text-sm">{drive.companyName}</p>
                {drive.roles?.length > 0 && <p className="text-gray-500 text-[11px]">{drive.roles.join(', ')}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${userCGPA >= (drive.cutoffCGPA || 0) ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                  {userCGPA >= (drive.cutoffCGPA || 0) ? '✓ Eligible' : '✗ Ineligible'}
                </span>
                <button onClick={() => handleDelete(drive._id!)} className="text-gray-700 hover:text-red-400"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Cutoff CGPA', value: drive.cutoffCGPA?.toFixed(2) || 'N/A' },
                { label: 'Avg Package', value: drive.averagePackage ? `${drive.averagePackage} LPA` : 'N/A' },
                { label: 'Selected', value: drive.numberOfSelected || '0' },
                { label: 'Batch Date', value: drive.batchDate || 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#161b27] border border-gray-800/60 rounded-lg p-2.5">
                  <p className="text-gray-600 text-[10px]">{label}</p>
                  <p className="text-white text-xs font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {companyDrives.length === 0 && !showForm && (
          <div className="col-span-2 text-center py-8 text-gray-600 text-sm">No company drives added yet</div>
        )}
      </div>
    </div>
  );
};

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

const Analytics: React.FC<{ offCampusApps: OffCampusApplication[]; onCampusApps: OnCampusApplication[] }> = ({ offCampusApps, onCampusApps }) => {
  const total = offCampusApps.length + onCampusApps.length;
  const responses = offCampusApps.filter(a => ['screening','interview','offer','accepted'].includes(a.status)).length;
  const interviews = offCampusApps.filter(a => ['interview','offer','accepted'].includes(a.status)).length;
  const offers = offCampusApps.filter(a => ['offer','accepted'].includes(a.status)).length;
  const responseRate = offCampusApps.length > 0 ? (responses / offCampusApps.length * 100) : 0;

  const statusData = [
    { name: 'Applied', value: offCampusApps.filter(a => a.status === 'applied').length, fill: '#3b82f6' },
    { name: 'Screening', value: offCampusApps.filter(a => a.status === 'screening').length, fill: '#f59e0b' },
    { name: 'Interview', value: offCampusApps.filter(a => a.status === 'interview').length, fill: '#a855f7' },
    { name: 'Offer', value: offCampusApps.filter(a => a.status === 'offer').length, fill: '#10b981' },
    { name: 'Rejected', value: offCampusApps.filter(a => a.status === 'rejected').length, fill: '#ef4444' },
  ];

  const sourceData = [
    { name: 'LinkedIn', value: offCampusApps.filter(a => a.source === 'linkedin').length },
    { name: 'Indeed', value: offCampusApps.filter(a => a.source === 'indeed').length },
    { name: 'Naukri', value: offCampusApps.filter(a => a.source === 'naukri').length },
    { name: 'Direct', value: offCampusApps.filter(a => a.source === 'direct').length },
    { name: 'Other', value: offCampusApps.filter(a => a.source === 'other').length },
  ];

  const timelineData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    return { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), apps: offCampusApps.filter(a => a.appliedDate === ds).length };
  });

  const metrics = [
    { label: 'Total Applications', value: total, sub: `${offCampusApps.length} off-campus`, icon: Briefcase, color: 'blue' },
    { label: 'Response Rate', value: `${responseRate.toFixed(1)}%`, sub: `${responses} responses`, icon: TrendingUp, color: 'purple' },
    { label: 'Interviews', value: interviews, sub: `from ${responses} responses`, icon: CheckCircle, color: 'green' },
    { label: 'Offers', value: offers, sub: `${onCampusApps.filter(a => a.status === 'offer').length} on-campus`, icon: Users, color: 'yellow' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="cc-card mb-5">
      <SectionHeader icon={BarChart2} title="Analytics" subtitle="Application pipeline overview" />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {metrics.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-[#0f1117] border border-gray-800 rounded-xl p-4">
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center mb-3 ${colorMap[color]}`}>
              <Icon size={13} />
            </div>
            <p className="text-white text-2xl font-bold leading-none mb-1">{value}</p>
            <p className="text-gray-500 text-[11px] mb-0.5">{label}</p>
            <p className="text-gray-700 text-[10px]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs font-medium mb-4">Status Distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => value > 0 ? `${name}` : ''} labelLine={false} fontSize={10}>
                {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f1117', border: '1px solid #1f2937', borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs font-medium mb-4">Applications — Last 7 Days</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#374151" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis stroke="#374151" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0f1117', border: '1px solid #1f2937', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="apps" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-4 lg:col-span-2">
          <p className="text-gray-400 text-xs font-medium mb-4">Applications by Source</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={sourceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" stroke="#374151" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis stroke="#374151" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0f1117', border: '1px solid #1f2937', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

function Placement({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'offcampus' | 'oncampus' | 'analytics'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [offCampusApps, setOffCampusApps] = useState<OffCampusApplication[]>([]);
  const [onCampusApps, setOnCampusApps] = useState<OnCampusApplication[]>([]);
  const [companyDrives, setCompanyDrives] = useState<CompanyDrive[]>([]);

  useEffect(() => { loadAll(); }, [user.id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pRes, oRes, ocRes, dRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/placement/profile/${user.id}`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/placement/off-campus/${user.id}`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/placement/on-campus/${user.id}`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/placement/company-drives/${user.id}`, { credentials: 'include' }),
      ]);
      if (pRes.ok) setProfile(await pRes.json());
      if (oRes.ok) setOffCampusApps(await oRes.json());
      if (ocRes.ok) setOnCampusApps(await ocRes.json());
      if (dRes.ok) setCompanyDrives(await dRes.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const tabs = [
    { id: 'profile', label: 'Profile & Resume', icon: BookOpen },
    { id: 'offcampus', label: 'Off-Campus', icon: Briefcase },
    { id: 'oncampus', label: 'On-Campus', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ] as const;

  if (loading) return (
    <div className="cc-page-root flex items-center justify-center">
      <style>{ccStyles}</style>
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-500 mx-auto mb-3" size={36} />
        <p className="text-gray-400 text-sm">Loading placement data…</p>
      </div>
    </div>
  );

  return (
    <div className="cc-page-root">
      <style>{ccStyles}</style>

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-gray-600 text-xs mb-3">
          <span>CareerClock</span><ChevronRight size={12} /><span className="text-gray-400">Placement Tracker</span>
        </div>
        <h1 className="text-white text-2xl font-bold leading-tight mb-1">Placement Tracker</h1>
        <p className="text-gray-500 text-sm">Manage your profile, resumes, and job applications in one place</p>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Applications', value: offCampusApps.length + onCampusApps.length },
          { label: 'Interviews', value: offCampusApps.filter(a => ['interview','offer','accepted'].includes(a.status)).length },
          { label: 'Offers', value: offCampusApps.filter(a => ['offer','accepted'].includes(a.status)).length + onCampusApps.filter(a => a.status === 'offer').length },
          { label: 'Company Drives', value: companyDrives.length },
        ].map(({ label, value }) => (
          <div key={label} className="cc-stat-card">
            <p className="text-white text-xl font-bold">{value}</p>
            <p className="text-gray-500 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#0f1117] border border-gray-800 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-1 justify-center ${activeTab === id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
          >
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <>
          <ProfileManager userId={user.id} profile={profile} onProfileUpdate={loadAll} />
          <ResumeManager userId={user.id} resumes={profile?.resumes || []} onUpdate={loadAll} />
        </>
      )}
      {activeTab === 'offcampus' && <OffCampusTracker userId={user.id} applications={offCampusApps} onUpdate={loadAll} />}
      {activeTab === 'oncampus' && <OnCampusTracker userId={user.id} applications={onCampusApps} companyDrives={companyDrives} userCGPA={profile?.cgpa || 0} onUpdate={loadAll} />}
      {activeTab === 'analytics' && <Analytics offCampusApps={offCampusApps} onCampusApps={onCampusApps} />}
    </div>
  );
}

// ─── CareerClock shared styles (scoped) ───────────────────────────────────────

const ccStyles = `
  .cc-page-root {
    min-height: 100vh;
    background: #080b12;
    color: white;
    padding: 24px 16px 60px;
    font-family: inherit;
  }
  @media (min-width: 640px) {
    .cc-page-root { padding: 32px 32px 80px; }
  }
  .cc-card {
    background: #12151f;
    border: 1px solid #1a1f2e;
    border-radius: 16px;
    padding: 20px;
  }
  .cc-stat-card {
    background: #12151f;
    border: 1px solid #1a1f2e;
    border-radius: 12px;
    padding: 16px;
  }
`;

export default Placement;