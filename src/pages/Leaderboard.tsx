/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trophy, Flame, Star, TrendingUp, TrendingDown,
  Minus, RefreshCw, ChevronRight, Zap, Crown, Medal,
  Users, Target, Clock, Info, X, CheckCircle2, BookOpen,
  Filter, Search,
} from 'lucide-react';
import { questions } from '@/data/questions';


const API_BASE_URL = import.meta.env.VITE_API_URL;

export const SCORE_POLICY = {
  easy: 1,
  medium: 3,
  hard: 7,
  streakBonus: 2,   // per day of active streak, capped at 30 days
  starBonus: 1,     // per starred/bookmarked question
} as const;

export const QUESTION_BANK = questions.reduce((acc, q) => {
  const topic = q.topic;

  if (!acc[topic]) {
    acc[topic] = {
      easy: 0,
      medium: 0,
      hard: 0,
      total: 0,
    };
  }

  acc[topic].total++;

  if (q.diff === 'easy') acc[topic].easy++;
  else if (q.diff === 'medium') acc[topic].medium++;
  else if (q.diff === 'hard') acc[topic].hard++;

  return acc;
}, {} as Record<string, {
  easy: number;
  medium: number;
  hard: number;
  total: number;
}>);


export const TOTAL_QUESTIONS = questions.length;

export const TOPIC_ORDER = [
  "Bits & Manipulation", "Basic Sorting", "Arrays", "Strings", "Binary Search",
  "Linked List", "Recursion & Backtracking", "Stacks & Queues", "Sliding Window",
  "Prefix Sum & Hash", "Heaps", "Greedy", "BinaryTree", "BST",
  "Graphs", "Dynamic Programming", "Tries",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Per-topic solved breakdown stored per user.
 * Each key is a topic name; value is { easy, medium, hard } solved.
 */
interface TopicProgress {
  [topic: string]: {
    easy: number;
    medium: number;
    hard: number;
  };
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  email: string;
  picture?: string;
  rank: number;
  prevRank?: number;
  totalScore: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  streak: number;
  starredCount: number;
  lastActive: string;
  badge?: 'gold' | 'silver' | 'bronze' | 'rising' | 'streak';
  college?: string;
  topicProgress?: TopicProgress;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = `
  @keyframes rankUp   { from { transform: translateY(6px); opacity: 0; } to { transform: none; opacity: 1; } }
  @keyframes rankDown { from { transform: translateY(-6px); opacity: 0; } to { transform: none; opacity: 1; } }
  @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); } 50% { box-shadow: 0 0 0 6px rgba(59,130,246,0.15); } }
  @keyframes slide-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  @keyframes live-dot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }
  @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }

  .lb-root { min-height: 100vh; background: #080b12; color: white; padding: 88px 16px 80px; font-family: inherit; }
  @media(min-width:640px) { .lb-root { padding: 88px 32px 80px; } }
  @media(min-width:1024px) { .lb-root { padding: 88px 48px 80px; } }

  .lb-card { background: #12151f; border: 1px solid #1a1f2e; border-radius: 16px; padding: 20px; }

  .rank-up   { animation: rankUp   0.5s ease forwards; color: #4ade80; }
  .rank-down { animation: rankDown 0.5s ease forwards; color: #f87171; }
  .rank-same { color: #4b5563; }

  .top1 { background: linear-gradient(135deg, rgba(251,191,36,0.10) 0%, rgba(251,191,36,0.03) 100%); border-color: rgba(251,191,36,0.22) !important; }
  .top2 { background: linear-gradient(135deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.03) 100%); border-color: rgba(148,163,184,0.22) !important; }
  .top3 { background: linear-gradient(135deg, rgba(180,83,9,0.10) 0%, rgba(180,83,9,0.03) 100%); border-color: rgba(205,127,50,0.22) !important; }
  .my-row { border-color: rgba(59,130,246,0.35) !important; animation: pulse-glow 3s infinite; }

  .lb-row { transition: all 0.2s ease; animation: slide-in 0.3s ease both; }
  .lb-row:hover { background: rgba(255,255,255,0.025) !important; transform: translateX(2px); }

  .live-dot { animation: live-dot 1.5s ease-in-out infinite; }
  .score-bar-fill { transition: width 1s cubic-bezier(0.34,1.2,0.64,1); }

  .tab-btn { background: transparent; border: 1px solid transparent; color: #6b7280; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
  .tab-btn.active { background: rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.28); color: #60a5fa; }
  .tab-btn:hover:not(.active) { color: #d1d5db; }

  .topic-chip { background: transparent; border: 1px solid #1a1f2e; color: #6b7280; font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .topic-chip.active { border-color: rgba(59,130,246,0.35); color: #93c5fd; background: rgba(59,130,246,0.08); }
  .topic-chip:hover:not(.active) { color: #d1d5db; border-color: #374151; }

  .badge-gold   { background: rgba(251,191,36,0.12); color: #fbbf24; border: 1px solid rgba(251,191,36,0.28); }
  .badge-silver { background: rgba(148,163,184,0.12); color: #94a3b8; border: 1px solid rgba(148,163,184,0.28); }
  .badge-bronze { background: rgba(180,83,9,0.12);   color: #cd7f32; border: 1px solid rgba(180,83,9,0.28); }
  .badge-rising { background: rgba(74,222,128,0.12); color: #4ade80; border: 1px solid rgba(74,222,128,0.28); }
  .badge-streak { background: rgba(251,146,60,0.12); color: #fb923c; border: 1px solid rgba(251,146,60,0.28); }

  .search-box { background: #0f1117; border: 1px solid #1a1f2e; color: white; border-radius: 10px; padding: 8px 12px 8px 36px; font-size: 13px; outline: none; transition: border-color 0.15s; }
  .search-box:focus { border-color: rgba(59,130,246,0.4); }
  .search-box::placeholder { color: #4b5563; }

  .topic-progress-bar { height: 3px; background: #1a1f2e; border-radius: 2px; overflow: hidden; margin-top: 2px; }
  .topic-progress-fill { height: 100%; border-radius: 2px; transition: width 0.6s ease; }

  .expand-row { background: #0b0e17; border-top: 1px solid #1a1f2e; }

  .skeleton { background: linear-gradient(90deg, #12151f 25%, #1a1f2e 50%, #12151f 75%);
    background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
`;

// ─── Score Calculator ─────────────────────────────────────────────────────────

export function calcScore(e: Pick<LeaderboardEntry, 'easySolved' | 'mediumSolved' | 'hardSolved' | 'streak' | 'starredCount'>): number {
  return (
    e.easySolved   * SCORE_POLICY.easy +
    e.mediumSolved * SCORE_POLICY.medium +
    e.hardSolved   * SCORE_POLICY.hard +
    Math.min(e.streak, 30) * SCORE_POLICY.streakBonus +
    e.starredCount * SCORE_POLICY.starBonus
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown size={15} className="text-yellow-400" />;
  if (rank === 2) return <Medal size={15} className="text-slate-400" />;
  if (rank === 3) return <Medal size={15} className="text-amber-700" />;
  return <span className="text-gray-600 text-xs font-mono">#{rank}</span>;
};

const RankChange = ({ curr, prev }: { curr: number; prev?: number }) => {
  if (!prev || prev === curr) return <Minus size={11} className="rank-same" />;
  if (curr < prev) return (
    <span className="rank-up flex items-center gap-0.5 text-[10px] font-bold">
      <TrendingUp size={10} />+{prev - curr}
    </span>
  );
  return (
    <span className="rank-down flex items-center gap-0.5 text-[10px] font-bold">
      <TrendingDown size={10} />{curr - prev}
    </span>
  );
};

/** Renders Google profile picture if available, otherwise initials avatar */
const Avatar = ({
  name,
  picture,
  size = 'md',
}: {
  name: string;
  picture?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const colors = [
    'from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500',
    'from-green-500 to-teal-500', 'from-orange-500 to-red-500',
    'from-yellow-500 to-orange-500', 'from-indigo-500 to-blue-500',
  ];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';

  if (picture) {
    return (
      <img
        src={picture}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${sz} rounded-full object-cover flex-shrink-0`}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {name[0]?.toUpperCase()}
    </div>
  );
};

const BadgePill = ({ badge }: { badge: string }) => {
  const labels: Record<string, string> = {
    gold: '🥇 Gold', silver: '🥈 Silver', bronze: '🥉 Bronze',
    rising: '🚀 Rising', streak: '🔥 Streak King',
  };
  return (
    <span className={`badge-${badge} text-[10px] font-semibold px-2 py-0.5 rounded-full`}>
      {labels[badge]}
    </span>
  );
};

// ─── POLICY MODAL ─────────────────────────────────────────────────────────────

const PolicyModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
    <div className="lb-card relative z-10 max-w-md w-full" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Target size={14} className="text-blue-400" />
          </div>
          <h3 className="text-white font-semibold">Scoring Policy</h3>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-white transition">
          <X size={16} />
        </button>
      </div>

      <p className="text-gray-500 text-xs mb-4">
        Scores are computed from your Coding Tracker data and refresh every 60 seconds.
      </p>

      <div className="space-y-2 mb-5">
        {[
          { label: 'Easy Question',   pts: `+${SCORE_POLICY.easy}`,                       color: 'text-green-400',  icon: '🟢' },
          { label: 'Medium Question', pts: `+${SCORE_POLICY.medium}`,                     color: 'text-yellow-400', icon: '🟡' },
          { label: 'Hard Question',   pts: `+${SCORE_POLICY.hard}`,                       color: 'text-red-400',    icon: '🔴' },
          { label: 'Daily Streak (×days, max 30)', pts: `+${SCORE_POLICY.streakBonus}/day`, color: 'text-orange-400', icon: '🔥' },
          { label: 'Starred Question', pts: `+${SCORE_POLICY.starBonus}`,                 color: 'text-yellow-400', icon: '⭐' },
        ].map(({ label, pts, color, icon }) => (
          <div key={label} className="flex items-center justify-between bg-[#0f1117] border border-gray-800 rounded-xl px-4 py-2.5">
            <span className="text-gray-300 text-xs">{icon} {label}</span>
            <span className={`${color} text-xs font-bold`}>{pts} pts</span>
          </div>
        ))}
      </div>

      <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-4 mb-4">
        <p className="text-gray-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
          <BookOpen size={11} /> Question Bank ({TOTAL_QUESTIONS} total)
        </p>
        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
          {TOPIC_ORDER.map(t => {
            const q = QUESTION_BANK[t];
            return (
              <div key={t} className="flex justify-between text-[10px] text-gray-500 py-0.5">
                <span className="truncate mr-2">{t}</span>
                <span className="text-gray-600 flex-shrink-0">
                  <span className="text-green-500">{q.easy}</span>/
                  <span className="text-yellow-500">{q.medium}</span>/
                  <span className="text-red-500">{q.hard}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-4">
        <p className="text-gray-500 text-xs font-semibold mb-2">Badge Criteria</p>
        <div className="space-y-1.5 text-xs text-gray-400">
          <p>🥇 <strong className="text-white">Gold</strong> — Rank #1 overall</p>
          <p>🥈 <strong className="text-white">Silver</strong> — Rank #2 overall</p>
          <p>🥉 <strong className="text-white">Bronze</strong> — Rank #3 overall</p>
          <p>🚀 <strong className="text-white">Rising Star</strong> — Biggest rank improvement this week</p>
          <p>🔥 <strong className="text-white">Streak King</strong> — Longest active streak on the board</p>
        </div>
      </div>
    </div>
  </div>
);

// ─── PODIUM ───────────────────────────────────────────────────────────────────

const Podium = ({ top3, myUserId }: { top3: LeaderboardEntry[]; myUserId: string }) => {
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = ['h-20', 'h-28', 'h-16'];
  const podiumRanks = [2, 1, 3];
  const rankColors = ['text-slate-400', 'text-yellow-400', 'text-amber-700'];
  const rankBg = [
    'bg-slate-400/10 border-slate-400/20',
    'bg-yellow-400/10 border-yellow-400/20',
    'bg-amber-700/10 border-amber-700/20',
  ];

  return (
    <div className="lb-card mb-5">
      <div className="flex items-end justify-center gap-4 pt-4 pb-2">
        {order.map((entry, i) => {
          if (!entry) return <div key={i} className="w-28" />;
          const isMe = entry.userId === myUserId;
          return (
            <div key={entry.userId} className="flex flex-col items-center gap-2 w-28">
              <div className={`relative ${isMe ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#12151f]' : ''} rounded-full`}>
                <Avatar name={entry.name} picture={entry.picture} size="lg" />
                {entry.badge && (
                  <div className="absolute -top-1 -right-1 text-sm">
                    {entry.badge === 'gold' ? '👑' : entry.badge === 'rising' ? '🚀' : '🔥'}
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-white text-xs font-semibold truncate max-w-[100px]">
                  {entry.name.split(' ')[0]}
                </p>
                <p className={`text-[11px] font-bold ${rankColors[i]}`}>{entry.totalScore} pts</p>
                <p className="text-gray-600 text-[10px]">
                  {entry.totalSolved}/{TOTAL_QUESTIONS} solved
                </p>
              </div>
              <div className={`w-full ${heights[i]} ${rankBg[i]} border rounded-t-xl flex items-center justify-center`}>
                <span className={`text-2xl font-black ${rankColors[i]}`}>#{podiumRanks[i]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── TOPIC PROGRESS EXPAND ROW ────────────────────────────────────────────────

const TopicProgressRow = ({ entry }: { entry: LeaderboardEntry }) => {
  if (!entry.topicProgress) return null;
  return (
    <div className="expand-row px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {TOPIC_ORDER.map(topic => {
        const progress = entry.topicProgress![topic] || { easy: 0, medium: 0, hard: 0 };
        const bank = QUESTION_BANK[topic];
        const solved = progress.easy + progress.medium + progress.hard;
        const pct = bank ? Math.round((solved / bank.total) * 100) : 0;
        return (
          <div key={topic}>
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-gray-500 text-[10px] truncate mr-1">{topic}</span>
              <span className="text-gray-600 text-[10px] flex-shrink-0">{solved}/{bank?.total ?? 0}</span>
            </div>
            <div className="topic-progress-bar">
              <div
                className="topic-progress-fill"
                style={{
                  width: `${pct}%`,
                  background: pct >= 80 ? '#4ade80' : pct >= 50 ? '#facc15' : '#60a5fa',
                }}
              />
            </div>
            <div className="flex gap-1.5 mt-0.5">
              <span className="text-green-500 text-[9px]">{progress.easy}E</span>
              <span className="text-yellow-500 text-[9px]">{progress.medium}M</span>
              <span className="text-red-500 text-[9px]">{progress.hard}H</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── MAIN LEADERBOARD ─────────────────────────────────────────────────────────

function Leaderboard({ user }: { user: User }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showPolicy, setShowPolicy] = useState(false);
  const [filter, setFilter] = useState<'all' | 'college' | 'weekly'>('all');
  const [diffFilter, setDiffFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevEntriesRef = useRef<LeaderboardEntry[]>([]);

  // ── Data fetch ──────────────────────────────────────────────────────────────

  const fetchLeaderboard = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const params = new URLSearchParams({ filter });
      if (diffFilter !== 'all') params.append('diff', diffFilter);
      if (topicFilter !== 'all') params.append('topic', topicFilter);

      const res = await fetch(`${API_BASE_URL}/api/leaderboard?${params}`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data: LeaderboardEntry[] = await res.json();
        const prev = prevEntriesRef.current;
        const merged = data.map(e => ({
          ...e,
          prevRank: prev.find(p => p.userId === e.userId)?.rank,
        }));
        prevEntriesRef.current = merged;
        setEntries(merged);
        setLastUpdated(new Date());
        setCountdown(60);
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, diffFilter, topicFilter]);

  useEffect(() => {
    fetchLeaderboard(false);
    intervalRef.current  = setInterval(() => fetchLeaderboard(false), 60_000);
    countdownRef.current = setInterval(() => setCountdown(c => c <= 1 ? 60 : c - 1), 1000);
    return () => {
      if (intervalRef.current)  clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchLeaderboard]);

  // ── Derived data ────────────────────────────────────────────────────────────

  const filteredEntries = entries.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const myEntry  = entries.find(e => e.userId === user.id);
  const maxScore = entries[0]?.totalScore ?? 1;
  const top3     = entries.slice(0, 3);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="lb-root">
      <style>{styles}</style>
      {showPolicy && <PolicyModal onClose={() => setShowPolicy(false)} />}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-gray-600 text-xs mb-4">
        <span>AutoJob Flow</span>
        <ChevronRight size={11} />
        <span className="text-gray-400">Leaderboard</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold mb-1 flex items-center gap-2">
            <Trophy size={22} className="text-yellow-400" />
            DSA Leaderboard
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-gray-500 text-sm">
              Real-time rankings · {TOTAL_QUESTIONS} questions across {TOPIC_ORDER.length} topics
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot" />
              <span className="text-green-400 text-[11px] font-medium">LIVE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPolicy(true)}
            className="flex items-center gap-1.5 bg-[#12151f] border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white text-xs font-medium px-3 py-2 rounded-lg transition"
          >
            <Info size={12} /> Scoring
          </button>
          <button
            onClick={() => fetchLeaderboard(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Coders',    value: entries.length,                            icon: Users,     color: 'text-blue-400'   },
          { label: 'Your Rank',       value: myEntry ? `#${myEntry.rank}` : '—',         icon: Trophy,    color: 'text-yellow-400' },
          { label: 'Your Score',      value: myEntry?.totalScore ?? 0,                  icon: Zap,       color: 'text-purple-400' },
          { label: 'Next Refresh',    value: `${countdown}s`,                           icon: Clock,     color: 'text-green-400'  },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="lb-card flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl bg-gray-800 border border-gray-800 flex items-center justify-center ${color} flex-shrink-0`}>
              <Icon size={14} />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">{value}</p>
              <p className="text-gray-600 text-[11px]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* My solved summary */}
      {myEntry && (
        <div className="lb-card mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={myEntry.name} picture={myEntry.picture} size="md" />
            <div>
              <p className="text-white font-semibold text-sm">{myEntry.name}</p>
              <p className="text-gray-500 text-[11px]">{myEntry.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-center">
              <p className="text-green-400 font-bold text-base">{myEntry.easySolved}</p>
              <p className="text-gray-600 text-[10px]">Easy</p>
              <p className="text-gray-700 text-[9px]">/{QUESTION_BANK["Arrays"].easy + 41} total</p>
            </div>
            <div className="text-center">
              <p className="text-yellow-400 font-bold text-base">{myEntry.mediumSolved}</p>
              <p className="text-gray-600 text-[10px]">Medium</p>
            </div>
            <div className="text-center">
              <p className="text-red-400 font-bold text-base">{myEntry.hardSolved}</p>
              <p className="text-gray-600 text-[10px]">Hard</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base">{myEntry.totalSolved}/{TOTAL_QUESTIONS}</p>
              <p className="text-gray-600 text-[10px]">Total Solved</p>
            </div>
            {myEntry.streak > 0 && (
              <div className="text-center">
                <p className="text-orange-400 font-bold text-base flex items-center gap-1">
                  <Flame size={13} />{myEntry.streak}d
                </p>
                <p className="text-gray-600 text-[10px]">Streak</p>
              </div>
            )}
            {myEntry.starredCount > 0 && (
              <div className="text-center">
                <p className="text-yellow-400 font-bold text-base flex items-center gap-1">
                  <Star size={13} />{myEntry.starredCount}
                </p>
                <p className="text-gray-600 text-[10px]">Starred</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="flex gap-1 bg-[#0f1117] border border-gray-800 rounded-xl p-1">
          {(['all', 'college', 'weekly'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`tab-btn ${filter === f ? 'active' : ''}`}>
              {f === 'all' ? '🌐 All Time' : f === 'college' ? '🏫 College' : '📅 This Week'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#0f1117] border border-gray-800 rounded-xl p-1">
          {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
            <button key={d} onClick={() => setDiffFilter(d)}
              className={`tab-btn ${diffFilter === d ? 'active' : ''}`}>
              {d === 'all' ? 'All Diff' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Topic filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          className={`topic-chip flex-shrink-0 ${topicFilter === 'all' ? 'active' : ''}`}
          onClick={() => setTopicFilter('all')}
        >
          All Topics
        </button>
        {TOPIC_ORDER.map(t => (
          <button
            key={t}
            className={`topic-chip flex-shrink-0 ${topicFilter === t ? 'active' : ''}`}
            onClick={() => setTopicFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 w-full sm:w-72">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          type="text"
          placeholder="Search coders…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-box w-full"
        />
      </div>

      {/* Podium */}
      {!loading && top3.length >= 3 && <Podium top3={top3} myUserId={user.id} />}

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-gray-700 text-[11px] mb-3 text-right">
          Updated {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {/* Table */}
      <div className="lb-card p-0 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-800/60 text-gray-600 text-[10px] font-semibold uppercase tracking-wider">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-4">Coder</div>
          <div className="col-span-2 text-right hidden sm:block">Score</div>
          <div className="col-span-2 text-right hidden md:block">Solved</div>
          <div className="col-span-2 text-right hidden lg:block">Streak</div>
          <div className="col-span-1 text-right">Δ</div>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" style={{ opacity: 1 - i * 0.12 }} />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <Trophy size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {search ? 'No coders match your search.' : 'No data yet. Start solving questions!'}
            </p>
          </div>
        ) : (
          <div>
            {filteredEntries.map((entry, idx) => {
              const isMe       = entry.userId === user.id;
              const isExpanded = expandedRow === entry.userId;
              const isTop      = entry.rank <= 3;
              const topClass   = entry.rank === 1 ? 'top1' : entry.rank === 2 ? 'top2' : entry.rank === 3 ? 'top3' : '';
              const scoreWidth = `${Math.round((entry.totalScore / maxScore) * 100)}%`;
              const barColor   = entry.rank === 1 ? '#facc15'
                               : entry.rank === 2 ? '#94a3b8'
                               : entry.rank === 3 ? '#b45309'
                               : isMe ? '#3b82f6' : '#374151';

              return (
                <React.Fragment key={entry.userId}>
                  <div
                    className={`lb-row grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-gray-800/40 items-center cursor-pointer ${topClass} ${isMe ? 'my-row' : ''}`}
                    style={{ animationDelay: `${idx * 25}ms` }}
                    onClick={() => setExpandedRow(isExpanded ? null : entry.userId)}
                    title="Click to see topic breakdown"
                  >
                    {/* Rank */}
                    <div className="col-span-1 flex justify-center">
                      {rankIcon(entry.rank)}
                    </div>

                    {/* Coder */}
                    <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <Avatar name={entry.name} picture={entry.picture} size="sm" />
                        {isMe && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-[#12151f]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-sm font-semibold truncate max-w-[110px] ${isMe ? 'text-blue-300' : 'text-white'}`}>
                            {entry.name.split(' ')[0]}
                            {isMe && <span className="text-blue-500 text-[10px] ml-1">(you)</span>}
                          </span>
                          {entry.badge && <BadgePill badge={entry.badge} />}
                        </div>
                        {entry.college && (
                          <p className="text-gray-600 text-[10px] truncate">{entry.college}</p>
                        )}
                      </div>
                    </div>

                    {/* Score + bar */}
                    <div className="col-span-2 hidden sm:block text-right">
                      <p className={`text-sm font-bold ${isTop ? 'text-white' : 'text-gray-300'}`}>
                        {entry.totalScore}
                      </p>
                      <div className="h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full score-bar-fill"
                          style={{ width: scoreWidth, background: barColor }}
                        />
                      </div>
                    </div>

                    {/* Solved breakdown */}
                    <div className="col-span-2 hidden md:block text-right">
                      <p className="text-[11px] font-semibold text-gray-300">
                        {entry.totalSolved}
                        <span className="text-gray-600 font-normal">/{TOTAL_QUESTIONS}</span>
                      </p>
                      <p className="text-[10px] text-gray-600">
                        <span className="text-green-500">{entry.easySolved}E</span>{' '}
                        <span className="text-yellow-500">{entry.mediumSolved}M</span>{' '}
                        <span className="text-red-500">{entry.hardSolved}H</span>
                      </p>
                    </div>

                    {/* Streak */}
                    <div className="col-span-2 hidden lg:flex items-center justify-end gap-1">
                      <Flame size={11} className={entry.streak > 0 ? 'text-orange-400' : 'text-gray-700'} />
                      <span className={`text-xs font-semibold ${entry.streak > 0 ? 'text-orange-400' : 'text-gray-700'}`}>
                        {entry.streak}d
                      </span>
                    </div>

                    {/* Rank change */}
                    <div className="col-span-1 flex justify-end">
                      <RankChange curr={entry.rank} prev={entry.prevRank} />
                    </div>
                  </div>

                  {/* Topic progress expand */}
                  {isExpanded && <TopicProgressRow entry={entry} />}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Formula footer */}
      <div className="mt-5 bg-[#0f1117] border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
        <Target size={13} className="text-blue-400 flex-shrink-0" />
        <p className="text-gray-600 text-[11px]">
          <span className="text-gray-400">Score = </span>
          Easy×{SCORE_POLICY.easy} + Medium×{SCORE_POLICY.medium} + Hard×{SCORE_POLICY.hard} + Streak×{SCORE_POLICY.streakBonus} + Stars×{SCORE_POLICY.starBonus}
          &nbsp;·&nbsp;
          <button onClick={() => setShowPolicy(true)} className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition">
            Full scoring policy →
          </button>
        </p>
      </div>

      {/* Question bank summary */}
      <div className="mt-3 bg-[#0f1117] border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
        <BookOpen size={13} className="text-purple-400 flex-shrink-0" />
        <p className="text-gray-600 text-[11px]">
          <span className="text-gray-400">{TOTAL_QUESTIONS} questions</span> across {TOPIC_ORDER.length} topics
          &nbsp;·&nbsp;Click any row to see per-topic progress
        </p>
      </div>
    </div>
  );
}

export default Leaderboard;