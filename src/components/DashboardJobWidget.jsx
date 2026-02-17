import React, { useState, useEffect } from "react";
import { JobCard } from "./JobCard";
import { fetchTodaysJobs } from "./jobsApi";

export function DashboardJobWidget() {
  const [data, setData] = useState({ count: 0, jobs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaysJobs()
      .then(setData)
      .catch(() => setData({ count: 0, jobs: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="widget widget--loading">Loading job alerts...</div>;
  }

  return (
    <div className="widget">
      <div className="widget__header">
        <h3>🎯 Job Alerts Today</h3>
        <span className={`widget__badge ${data.count > 0 ? "widget__badge--active" : ""}`}>
          {data.count} new
        </span>
      </div>

      {data.jobs.length === 0 ? (
        <p className="widget__empty">No new jobs found in the last 24 hours.</p>
      ) : (
        <div className="widget__list">
          {data.jobs.slice(0, 5).map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
          {data.count > 5 && (
            <a href="/jobs" className="widget__see-more">
              View all {data.count} jobs →
            </a>
          )}
        </div>
      )}
    </div>
  );
}