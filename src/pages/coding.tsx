import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Star, Flame, Code2, ChevronRight,
  TrendingUp, BookOpen, Users, Loader2, X, Save,
  Filter, ExternalLink, CheckCircle2, Circle,
  BarChart2, Calendar, Zap, Target, Award, Edit2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

interface User { id: string; email: string; name?: string; }

type Platform = 'leetcode' | 'codeforces' | 'codechef' | 'hackerrank' | 'other';
type Difficulty = 'easy' | 'medium' | 'hard';

interface CodingEntry {
  _id?: string;
  platform: Platform;
  questionName: string;
  questionLink?: string;
  difficulty: Difficulty;
  topic: string;
  solvedDate: string;
  timeTaken?: number; // minutes
  notes?: string;
  isStarred: boolean;
  rating?: number; // codeforces rating
}

interface PlatformProfile {
  platform: Platform;
  username: string;
  totalSolved?: number;
  rating?: number;
  lastUpdated?: string;
}

interface DailyStreak {
  date: string;
  count: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS: { id: Platform; label: string; color: string; bg: string; border: string }[] = [
  { id: 'leetcode',   label: 'LeetCode',   color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
  { id: 'codeforces', label: 'Codeforces', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25' },
  { id: 'codechef',   label: 'CodeChef',   color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/25' },
  { id: 'hackerrank', label: 'HackerRank', color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/25' },
  { id: 'other',      label: 'Other',      color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/25' },
];

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  easy:   'bg-green-500/15 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  hard:   'bg-red-500/15 text-red-400 border-red-500/30',
};

const TOPICS = [
  'Arrays', 'Strings', 'Linked List', 'Trees', 'Graphs', 'DP', 'Recursion',
  'Backtracking', 'Greedy', 'Binary Search', 'Sorting', 'Hashing', 'Stack/Queue',
  'Heap', 'Tries', 'Math', 'Bit Manipulation', 'Two Pointers', 'Sliding Window', 'Other'
];

// ─── Shared styles ────────────────────────────────────────────────────────────

const ccStyles = `
  .cc-page-root {
    min-height: 100vh;
    background: #080b12;
    color: white;
    padding: 88px 16px 80px;
    font-family: inherit;
  }
  @media (min-width: 640px) { .cc-page-root { padding: 88px 32px 80px; } }
  .cc-card { background: #12151f; border: 1px solid #1a1f2e; border-radius: 16px; padding: 20px; }
  .cc-stat-card { background: #12151f; border: 1px solid #1a1f2e; border-radius: 12px; padding: 16px; }
  .cc-input {
    width: 100%; background: #0f1117; color: white; font-size: 13px;
    padding: 10px 12px; border-radius: 10px; border: 1px solid #1a1f2e;
    outline: none; transition: border-color 0.2s;
    font-family: inherit;
  }
  .cc-input:focus { border-color: rgba(59,130,246,0.5); }
  .cc-input::placeholder { color: #374151; }
  .cc-select { cursor: pointer; }
  .platform-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600; padding: 3px 8px;
    border-radius: 20px; border: 1px solid;
  }
  .diff-badge {
    display: inline-flex; font-size: 10px; font-weight: 700;
    padding: 2px 7px; border-radius: 20px; border: 1px solid;
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .streak-cell {
    width: 11px; height: 11px; border-radius: 2px; flex-shrink: 0;
  }
  .star-btn { transition: all 0.15s; }
  .star-btn:hover { transform: scale(1.2); }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPlatform = (id: Platform) => PLATFORMS.find(p => p.id === id) ?? PLATFORMS[4];

const inputCls = 'cc-input';
const selectCls = 'cc-input cc-select';

const SectionHeader = ({ icon: Icon, title, subtitle, action }: { icon: React.ElementType; title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div className="flex items-start justify-between mb-5">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-blue-400" />
      </div>
      <div>
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        {subtitle && <p className="text-gray-600 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const AddBtn = ({ onClick, label, color = 'blue' }: { onClick: () => void; label: string; color?: string }) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 ${color === 'blue' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-violet-600 hover:bg-violet-500'} text-white text-xs font-semibold px-3 py-2 rounded-lg transition`}>
    <Plus size={12} /> {label}
  </button>
);

const CancelBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold px-3 py-2 rounded-lg transition">
    <X size={12} /> Cancel
  </button>
);

// ─── PLATFORM PROFILES ────────────────────────────────────────────────────────

const PlatformProfiles: React.FC<{ userId: string; profiles: PlatformProfile[]; onUpdate: () => void }> = ({ userId, profiles, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fd, setFd] = useState<Partial<PlatformProfile>>({ platform: 'leetcode' });

  const handleSave = async () => {
    if (!fd.username) { alert('Username required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/coding/profile`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ userId, ...fd })
      });
      if (res.ok) { setFd({ platform: 'leetcode' }); setShowForm(false); onUpdate(); }
      else { const d = await res.json(); alert(d.error || 'Failed'); }
    } catch { alert('Network error'); } finally { setLoading(false); }
  };

  const handleDelete = async (platform: Platform) => {
    if (!confirm('Remove this platform?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/coding/profile/${userId}/${platform}`, { method: 'DELETE', credentials: 'include' });
      onUpdate();
    } catch { alert('Error'); }
  };

  return (
    <div className="cc-card mb-5">
      <SectionHeader
        icon={Code2} title="Platform Profiles"
        subtitle="Connect your coding profiles"
        action={<AddBtn onClick={() => setShowForm(v => !v)} label="Add Platform" />}
      />

      {showForm && (
        <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-4 mb-5">
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <select value={fd.platform} onChange={e => setFd({ ...fd, platform: e.target.value as Platform })} className={selectCls}>
              {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <input type="text" placeholder="Your username on this platform" value={fd.username || ''} onChange={e => setFd({ ...fd, username: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Total Solved (optional)" value={fd.totalSolved || ''} onChange={e => setFd({ ...fd, totalSolved: parseInt(e.target.value) })} className={inputCls} />
            <input type="number" placeholder="Rating (optional)" value={fd.rating || ''} onChange={e => setFd({ ...fd, rating: parseInt(e.target.value) })} className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={loading} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </button>
            <CancelBtn onClick={() => setShowForm(false)} />
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PLATFORMS.filter(p => p.id !== 'other').map(plat => {
          const profile = profiles.find(p => p.platform === plat.id);
          return (
            <div key={plat.id} className={`bg-[#0f1117] border rounded-xl p-4 ${plat.border} relative`}>
              <div className="flex items-start justify-between mb-2">
                <span className={`platform-badge ${plat.bg} ${plat.color} ${plat.border}`}>{plat.label}</span>
                {profile && <button onClick={() => handleDelete(plat.id)} className="text-gray-700 hover:text-red-400"><Trash2 size={11} /></button>}
              </div>
              {profile ? (
                <>
                  <p className="text-white font-bold text-sm mb-1">@{profile.username}</p>
                  <div className="flex gap-3 text-xs text-gray-500">
                    {profile.totalSolved != null && <span><span className="text-white font-semibold">{profile.totalSolved}</span> solved</span>}
                    {profile.rating != null && <span><span className="text-white font-semibold">{profile.rating}</span> rating</span>}
                  </div>
                </>
              ) : (
                <p className="text-gray-600 text-xs mt-1">Not connected</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── LOG ENTRY FORM ───────────────────────────────────────────────────────────

const LogForm: React.FC<{ userId: string; onSave: () => void; onCancel: () => void }> = ({ userId, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [fd, setFd] = useState<Partial<CodingEntry>>({
    platform: 'leetcode', difficulty: 'medium', isStarred: false,
    solvedDate: new Date().toISOString().split('T')[0], topic: 'Arrays'
  });

  const handleSave = async () => {
    if (!fd.questionName) { alert('Question name required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/coding/entries`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ userId, ...fd })
      });
      if (res.ok) { onSave(); }
      else { const d = await res.json(); alert(d.error || 'Failed to save'); }
    } catch { alert('Network error'); } finally { setLoading(false); }
  };

  return (
    <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-4 mb-4">
      <p className="text-white text-xs font-semibold mb-3">Log a Question</p>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <input type="text" placeholder="Question name *" value={fd.questionName || ''} onChange={e => setFd({ ...fd, questionName: e.target.value })} className={inputCls} />
        <input type="url" placeholder="Question link (optional)" value={fd.questionLink || ''} onChange={e => setFd({ ...fd, questionLink: e.target.value })} className={inputCls} />
        <select value={fd.platform} onChange={e => setFd({ ...fd, platform: e.target.value as Platform })} className={selectCls}>
          {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select value={fd.difficulty} onChange={e => setFd({ ...fd, difficulty: e.target.value as Difficulty })} className={selectCls}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select value={fd.topic} onChange={e => setFd({ ...fd, topic: e.target.value })} className={selectCls}>
          {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="date" value={fd.solvedDate} onChange={e => setFd({ ...fd, solvedDate: e.target.value })} className={inputCls} />
        <input type="number" placeholder="Time taken (minutes)" value={fd.timeTaken || ''} onChange={e => setFd({ ...fd, timeTaken: parseInt(e.target.value) })} className={inputCls} />
        <label className="flex items-center gap-2 cursor-pointer bg-[#0f1117] border border-gray-800 rounded-xl px-3 py-2.5">
          <button type="button" onClick={() => setFd({ ...fd, isStarred: !fd.isStarred })} className="star-btn">
            <Star size={15} className={fd.isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
          </button>
          <span className="text-xs text-gray-400">Star for revision</span>
        </label>
      </div>
      <textarea placeholder="Notes (approach, mistakes, insights…)" value={fd.notes || ''} onChange={e => setFd({ ...fd, notes: e.target.value })} className={`${inputCls} h-20 resize-none mb-3`} />
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={loading} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Log Question
        </button>
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
};

// ─── QUESTION LIST ────────────────────────────────────────────────────────────

const QuestionList: React.FC<{
  userId: string;
  entries: CodingEntry[];
  onUpdate: () => void;
  starredOnly?: boolean;
}> = ({ userId, entries, onUpdate, starredOnly = false }) => {
  const [showForm, setShowForm] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'all'>('all');
  const [filterDiff, setFilterDiff] = useState<Difficulty | 'all'>('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [search, setSearch] = useState('');

  const handleDelete = async (id: string) => {
    if (!confirm('Delete entry?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/coding/entries/${id}`, { method: 'DELETE', credentials: 'include' });
      onUpdate();
    } catch { alert('Error'); }
  };

  const handleToggleStar = async (entry: CodingEntry) => {
    try {
      await fetch(`${API_BASE_URL}/api/coding/entries/${entry._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ isStarred: !entry.isStarred })
      });
      onUpdate();
    } catch { alert('Error'); }
  };

  const filtered = entries
    .filter(e => !starredOnly || e.isStarred)
    .filter(e => filterPlatform === 'all' || e.platform === filterPlatform)
    .filter(e => filterDiff === 'all' || e.difficulty === filterDiff)
    .filter(e => filterTopic === 'all' || e.topic === filterTopic)
    .filter(e => !search || e.questionName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="cc-card mb-5">
      <SectionHeader
        icon={starredOnly ? Star : BookOpen}
        title={starredOnly ? 'Starred Questions' : 'Question Log'}
        subtitle={`${filtered.length} questions`}
        action={!starredOnly ? <AddBtn onClick={() => setShowForm(v => !v)} label="Log Question" /> : undefined}
      />

      {showForm && !starredOnly && (
        <LogForm userId={userId} onSave={() => { setShowForm(false); onUpdate(); }} onCancel={() => setShowForm(false)} />
      )}

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <input type="text" placeholder="🔍  Search…" value={search} onChange={e => setSearch(e.target.value)} className={`${inputCls} text-xs`} />
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value as Platform | 'all')} className={`${selectCls} text-xs`}>
          <option value="all">All Platforms</option>
          {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select value={filterDiff} onChange={e => setFilterDiff(e.target.value as Difficulty | 'all')} className={`${selectCls} text-xs`}>
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} className={`${selectCls} text-xs`}>
          <option value="all">All Topics</option>
          {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">
          {starredOnly ? 'No starred questions yet. Star questions for revision!' : 'No questions logged yet.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.slice().reverse().map(entry => {
            const plat = getPlatform(entry.platform);
            return (
              <div key={entry._id} className="flex items-start gap-3 bg-[#0f1117] border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition">
                {/* Star */}
                <button className="star-btn mt-0.5 flex-shrink-0" onClick={() => handleToggleStar(entry)}>
                  <Star size={14} className={entry.isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'} />
                </button>
                {/* Main */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white text-sm font-medium truncate max-w-xs">{entry.questionName}</span>
                    {entry.questionLink && (
                      <a href={entry.questionLink} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-400">
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`platform-badge ${plat.bg} ${plat.color} ${plat.border}`}>{plat.label}</span>
                    <span className={`diff-badge ${DIFFICULTY_STYLE[entry.difficulty]}`}>{entry.difficulty}</span>
                    <span className="text-[10px] text-gray-600 bg-gray-800/60 border border-gray-800 px-2 py-0.5 rounded-full">{entry.topic}</span>
                    {entry.timeTaken && <span className="text-[10px] text-gray-600">⏱ {entry.timeTaken}m</span>}
                  </div>
                  {entry.notes && <p className="text-gray-600 text-[11px] mt-1.5 line-clamp-1">{entry.notes}</p>}
                </div>
                {/* Date + delete */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-gray-700 text-[10px]">{entry.solvedDate}</span>
                  <button onClick={() => handleDelete(entry._id!)} className="text-gray-700 hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── STREAK HEATMAP ───────────────────────────────────────────────────────────

const StreakHeatmap: React.FC<{ entries: CodingEntry[]; streak: number }> = ({ entries, streak }) => {
  // Build last 15 weeks (105 days)
  const days = 105;
  const cells: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    cells.push({ date: ds, count: entries.filter(e => e.solvedDate === ds).length });
  }

  const getColor = (count: number) => {
    if (count === 0) return '#1a1f2e';
    if (count === 1) return '#1d4ed8';
    if (count === 2) return '#2563eb';
    if (count <= 4) return '#3b82f6';
    return '#60a5fa';
  };

  // Group into weeks
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const totalSolved = entries.length;
  const thisWeek = cells.slice(-7).reduce((s, c) => s + c.count, 0);
  const thisMonth = cells.slice(-30).reduce((s, c) => s + c.count, 0);

  return (
    <div className="cc-card mb-5">
      <SectionHeader icon={Flame} title="Coding Streak" subtitle="Your daily activity heatmap" />

      {/* Streak stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Current Streak', value: `${streak} days`, icon: Flame, color: 'text-orange-400' },
          { label: 'This Week', value: thisWeek, icon: Zap, color: 'text-blue-400' },
          { label: 'This Month', value: thisMonth, icon: Calendar, color: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#0f1117] border border-gray-800 rounded-xl p-3 text-center">
            <Icon size={14} className={`${color} mx-auto mb-1`} />
            <p className="text-white font-bold text-lg leading-none">{value}</p>
            <p className="text-gray-600 text-[10px] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell, di) => (
                <div
                  key={di}
                  className="streak-cell"
                  style={{ background: getColor(cell.count) }}
                  title={`${cell.date}: ${cell.count} solved`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-gray-700 text-[10px]">Less</span>
        {[0,1,2,3,4].map(n => <div key={n} className="streak-cell" style={{ background: getColor(n) }} />)}
        <span className="text-gray-700 text-[10px]">More</span>
        <span className="text-gray-600 text-[10px] ml-auto">{totalSolved} questions total</span>
      </div>
    </div>
  );
};

// ─── TOPIC BREAKDOWN ──────────────────────────────────────────────────────────

const TopicBreakdown: React.FC<{ entries: CodingEntry[] }> = ({ entries }) => {
  const counts: Record<string, { total: number; easy: number; medium: number; hard: number }> = {};
  for (const e of entries) {
    if (!counts[e.topic]) counts[e.topic] = { total: 0, easy: 0, medium: 0, hard: 0 };
    counts[e.topic].total++;
    counts[e.topic][e.difficulty]++;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1].total - a[1].total).slice(0, 10);
  const max = sorted[0]?.[1].total ?? 1;

  return (
    <div className="cc-card mb-5">
      <SectionHeader icon={Target} title="Topic Breakdown" subtitle="Questions solved per topic" />
      {sorted.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-6">No data yet</p>
      ) : (
        <div className="space-y-3">
          {sorted.map(([topic, counts]) => (
            <div key={topic}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-300 text-xs font-medium">{topic}</span>
                <div className="flex gap-2 text-[10px]">
                  <span className="text-green-400">{counts.easy}E</span>
                  <span className="text-yellow-400">{counts.medium}M</span>
                  <span className="text-red-400">{counts.hard}H</span>
                  <span className="text-white font-semibold">{counts.total}</span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all"
                  style={{ width: `${(counts.total / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── PLATFORM BREAKDOWN ───────────────────────────────────────────────────────

const PlatformStats: React.FC<{ entries: CodingEntry[] }> = ({ entries }) => {
  return (
    <div className="cc-card mb-5">
      <SectionHeader icon={BarChart2} title="Platform Stats" subtitle="Activity across platforms" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PLATFORMS.filter(p => p.id !== 'other').map(plat => {
          const count = entries.filter(e => e.platform === plat.id).length;
          const easy = entries.filter(e => e.platform === plat.id && e.difficulty === 'easy').length;
          const med  = entries.filter(e => e.platform === plat.id && e.difficulty === 'medium').length;
          const hard = entries.filter(e => e.platform === plat.id && e.difficulty === 'hard').length;
          return (
            <div key={plat.id} className={`bg-[#0f1117] border rounded-xl p-4 ${plat.border}`}>
              <span className={`platform-badge ${plat.bg} ${plat.color} ${plat.border} mb-3 inline-flex`}>{plat.label}</span>
              <p className={`text-2xl font-bold ${plat.color} leading-none mb-1`}>{count}</p>
              <p className="text-gray-600 text-[10px] mb-2">questions</p>
              {count > 0 && (
                <div className="flex gap-2 text-[10px]">
                  <span className="text-green-400">{easy}E</span>
                  <span className="text-yellow-400">{med}M</span>
                  <span className="text-red-400">{hard}H</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

function Coding({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'log' | 'starred' | 'stats' | 'profiles'>('log');
  const [entries, setEntries] = useState<CodingEntry[]>([]);
  const [profiles, setProfiles] = useState<PlatformProfile[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [eRes, pRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/coding/entries/${user.id}`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/coding/profiles/${user.id}`, { credentials: 'include' }),
      ]);
      if (eRes.ok) {
        const data: CodingEntry[] = await eRes.json();
        setEntries(data);
        // Compute streak
        const dates = new Set(data.map(e => e.solvedDate));
        let s = 0;
        const cur = new Date();
        while (dates.has(cur.toISOString().split('T')[0])) {
          s++;
          cur.setDate(cur.getDate() - 1);
        }
        setStreak(s);
      }
      if (pRes.ok) setProfiles(await pRes.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [user.id]);

  const totalSolved = entries.length;
  const starredCount = entries.filter(e => e.isStarred).length;

  const tabs = [
    { id: 'log',      label: 'Question Log', icon: BookOpen },
    { id: 'starred',  label: `Starred (${starredCount})`, icon: Star },
    { id: 'stats',    label: 'Statistics', icon: BarChart2 },
    { id: 'profiles', label: 'Profiles', icon: Code2 },
  ] as const;

  if (loading) return (
    <div className="cc-page-root flex items-center justify-center">
      <style>{ccStyles}</style>
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-500 mx-auto mb-3" size={36} />
        <p className="text-gray-400 text-sm">Loading coding data…</p>
      </div>
    </div>
  );

  return (
    <div className="cc-page-root">
      <style>{ccStyles}</style>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-gray-600 text-xs mb-4">
        <span>CareerClock</span><ChevronRight size={11} /><span className="text-gray-400">Coding Tracker</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold mb-1">Coding Tracker</h1>
        <p className="text-gray-500 text-sm">Track your DSA progress across LeetCode, Codeforces, CodeChef & HackerRank</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Solved',  value: totalSolved,    icon: CheckCircle2, color: 'text-blue-400' },
          { label: 'Streak',        value: `${streak}d`,   icon: Flame,        color: 'text-orange-400' },
          { label: 'Starred',       value: starredCount,   icon: Star,         color: 'text-yellow-400' },
          { label: 'Topics',        value: new Set(entries.map(e => e.topic)).size, icon: Target, color: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="cc-stat-card flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={14} />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">{value}</p>
              <p className="text-gray-600 text-[11px]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0f1117] border border-gray-800 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-1 justify-center ${activeTab === id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
          >
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'log' && (
        <>
          <StreakHeatmap entries={entries} streak={streak} />
          <QuestionList userId={user.id} entries={entries} onUpdate={loadAll} />
        </>
      )}
      {activeTab === 'starred' && (
        <QuestionList userId={user.id} entries={entries} onUpdate={loadAll} starredOnly />
      )}
      {activeTab === 'stats' && (
        <>
          <PlatformStats entries={entries} />
          <TopicBreakdown entries={entries} />
        </>
      )}
      {activeTab === 'profiles' && (
        <PlatformProfiles userId={user.id} profiles={profiles} onUpdate={loadAll} />
      )}
    </div>
  );
}

export default Coding;