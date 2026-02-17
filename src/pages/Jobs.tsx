import { useState, useEffect } from "react";
import { Search, Bell, BellOff, MapPin, ExternalLink, Briefcase, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  sourceUrl: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface JobsProps {
  user: { id: string; email: string; name?: string };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const QUICK_FILTERS = ["intern", "backend", "frontend", "SDE", "summer", "fullstack", "remote"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

// ── API calls ─────────────────────────────────────────────────────────────────
async function fetchJobs({ keyword = "", page = 1, limit = 12 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (keyword) params.set("keyword", keyword);
  const res = await fetch(`${API_BASE}/api/jobs?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json() as Promise<{ jobs: Job[]; pagination: Pagination }>;
}

async function fetchUserPreferences() {
  const res = await fetch(`${API_BASE}/api/companies/preferences`, { credentials: "include" });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json() as Promise<{ jobKeywords: string[]; emailNotifications: boolean }>;
}

async function updateUserPreferences(data: { jobKeywords?: string[]; emailNotifications?: boolean }) {
  const res = await fetch(`${API_BASE}/api/companies/preferences`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update preferences");
  return res.json();
}

// ── JobCard ───────────────────────────────────────────────────────────────────
function JobCard({ job }: { job: Job }) {
  return (
    <Card className="bg-gray-900/60 border-gray-800 hover:border-gray-600 hover:bg-gray-900/90 transition-all duration-200 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-gray-700 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-300">
              {job.company.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm leading-snug truncate group-hover:text-blue-300 transition-colors">
              {job.title}
            </h3>
            <p className="text-gray-400 text-sm mt-0.5 font-medium">{job.company}</p>
            <div className="flex items-center gap-3 mt-2">
              {job.location && job.location !== "Not specified" && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin size={11} />
                  {job.location}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={11} />
                {timeAgo(job.createdAt)}
              </span>
            </div>
          </div>

          <a
            href={job.url || job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-gray-800 hover:bg-blue-600 border border-gray-700 hover:border-blue-500 transition-all duration-150"
            title="View job"
          >
            <ExternalLink size={14} className="text-gray-400" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function JobCardSkeleton() {
  return (
    <Card className="bg-gray-900/60 border-gray-800">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-gray-800 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-800 rounded w-1/2" />
            <div className="h-3 bg-gray-800 rounded w-1/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const Jobs = ({ user }: JobsProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [pagination, setPagination] = useState<Partial<Pagination>>({});
  const [page, setPage] = useState(1);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    fetchUserPreferences()
      .then((prefs) => setNotifyEnabled(prefs.emailNotifications))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchJobs({ keyword: debouncedKeyword, page, limit: 12 })
      .then(({ jobs, pagination }) => {
        setJobs(jobs);
        setPagination(pagination);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [debouncedKeyword, page]);

  const toggleNotify = async () => {
    setSaving(true);
    try {
      await updateUserPreferences({ emailNotifications: !notifyEnabled });
      setNotifyEnabled((v) => !v);
    } catch {
      alert("Please log in to change notification settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickFilter = (filter: string) => {
    if (activeFilter === filter) {
      setActiveFilter(null);
      setKeyword("");
    } else {
      setActiveFilter(filter);
      setKeyword(filter);
    }
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-500/30 flex items-center justify-center">
                <Briefcase size={18} className="text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Job Monitor</h1>
            </div>
            <p className="text-gray-400 text-sm ml-12">
              Scraped daily from top company career pages
            </p>
          </div>

          <button
            onClick={toggleNotify}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
              notifyEnabled
                ? "bg-blue-600/20 border-blue-500/50 text-blue-300 hover:bg-blue-600/30"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
            }`}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : notifyEnabled ? (
              <Bell size={15} />
            ) : (
              <BellOff size={15} />
            )}
            {notifyEnabled ? "Email alerts on" : "Email alerts off"}
          </button>
        </div>

        {/* Stats */}
        {pagination.total !== undefined && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-500">
              <span className="text-white font-semibold">{pagination.total}</span> jobs found
            </span>
            {debouncedKeyword && (
              <>
                <span className="text-gray-700">·</span>
                <span className="text-sm text-gray-500">
                  filtered by{" "}
                  <span className="text-blue-400 font-medium">"{debouncedKeyword}"</span>
                </span>
              </>
            )}
          </div>
        )}

        {/* Search + Quick filters */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input
              type="text"
              placeholder="Search by title, company, keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9 bg-gray-900/60 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 h-11"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => handleQuickFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                  activeFilter === f
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                }`}
              >
                {f}
              </button>
            ))}
            {(keyword || activeFilter) && (
              <button
                onClick={() => { setKeyword(""); setActiveFilter(null); }}
                className="px-3 py-1 rounded-full text-xs font-medium border border-red-800/60 text-red-400 hover:bg-red-900/20 transition-all"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm mb-6">
            ⚠ {error} — make sure the backend is running and companies are seeded.
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <JobCardSkeleton key={i} />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-800/60 border border-gray-700 flex items-center justify-center mb-4">
              <Briefcase size={28} className="text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">No jobs found</p>
            <p className="text-gray-600 text-sm mt-1">
              {debouncedKeyword
                ? `No results for "${debouncedKeyword}" — try a different keyword`
                : "Run the scraper to populate jobs, or seed the company list first"}
            </p>
            {debouncedKeyword && (
              <button
                onClick={() => { setKeyword(""); setActiveFilter(null); }}
                className="mt-4 text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.map((job) => <JobCard key={job._id} job={job} />)}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={16} className="mr-1" /> Prev
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pagination.pages, 5) }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-md text-sm font-medium transition-all ${
                      page === p
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              {pagination.pages > 5 && <span className="text-gray-600 px-1">···</span>}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= (pagination.pages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
              className="bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-30"
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Jobs;