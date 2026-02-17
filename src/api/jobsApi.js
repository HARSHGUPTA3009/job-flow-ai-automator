const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function fetchJobs({ keyword = "", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (keyword) params.set("keyword", keyword);
  const res = await fetch(`${API_BASE}/api/jobs?${params}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export async function fetchTodaysJobs() {
  const res = await fetch(`${API_BASE}/api/jobs/today`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch today's jobs");
  return res.json();
}

export async function fetchUserPreferences() {
  const res = await fetch(`${API_BASE}/api/companies/preferences`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export async function updateUserPreferences({ jobKeywords, emailNotifications }) {
  const res = await fetch(`${API_BASE}/api/companies/preferences`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ jobKeywords, emailNotifications }),
  });
  if (!res.ok) throw new Error("Failed to update preferences");
  return res.json();
}