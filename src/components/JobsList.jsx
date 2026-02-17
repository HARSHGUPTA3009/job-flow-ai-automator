import React, { useState, useEffect } from "react";
import { JobCard } from "./JobCard";
import { fetchJobs, fetchUserPreferences, updateUserPreferences } from "./jobsApi";

export default function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  // Debounce keyword
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  // Load user preferences
  useEffect(() => {
    fetchUserPreferences()
      .then((prefs) => setNotifyEnabled(prefs.emailNotifications))
      .catch(() => {});
  }, []);

  // Fetch jobs on keyword/page change
  useEffect(() => {
    setLoading(true);
    fetchJobs({ keyword: debouncedKeyword, page, limit: 20 })
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

  return (
    <section className="jobs-section">
      <div className="jobs-section__header">
        <h2>Latest Off-Campus Internships</h2>

        <label className="notify-toggle">
          <input
            type="checkbox"
            checked={notifyEnabled}
            onChange={toggleNotify}
            disabled={saving}
          />
          <span>{notifyEnabled ? "🔔 Notifying me" : "🔕 Notifications off"}</span>
        </label>
      </div>

      <div className="jobs-section__filter">
        <input
          type="text"
          placeholder="Filter by keyword (e.g. backend, summer)..."
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(1);
          }}
          className="jobs-filter-input"
        />
      </div>

      {loading && <p className="jobs-loading">Loading jobs...</p>}
      {error && <p className="jobs-error">⚠ {error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <p className="jobs-empty">
          No jobs found{keyword ? ` for "${keyword}"` : ""}.
        </p>
      )}

      <div className="jobs-grid">
        {jobs.map((job) => (
          <JobCard key={job._id} job={job} />
        ))}
      </div>

      {pagination.pages > 1 && (
        <div className="jobs-pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </button>
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}