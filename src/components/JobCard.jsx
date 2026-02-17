import React from "react";

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date);
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export function JobCard({ job }) {
  return (
    <div className="job-card">
      <div className="job-card__header">
        <div>
          <h3 className="job-card__title">{job.title}</h3>
          <p className="job-card__meta">
            <span className="job-card__company">{job.company}</span>
            {job.location !== "Not specified" && (
              <>
                {" "}
                ·{" "}
                <span className="job-card__location">{job.location}</span>
              </>
            )}
          </p>
        </div>
        <span className="job-card__time">{timeAgo(job.createdAt)}</span>
      </div>

      <div className="job-card__footer">
        <a
          href={job.url || job.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="job-card__link"
        >
          View Job →
        </a>
      </div>
    </div>
  );
}