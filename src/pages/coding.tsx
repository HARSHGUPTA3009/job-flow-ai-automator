import React, { useEffect, useState } from "react";

const API_BASE_URL = "https://jobflow-backend-ai.onrender.com";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface CodingEntry {
  _id?: string;
  questionName: string;
  platform: string;
  difficulty: string;
  solvedDate: string;
}

function Coding({ user }: { user?: User }) {
  const userId = user?.id ?? null;

  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<CodingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/api/coding/entries/${userId}`,
          { credentials: "include" }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch");
        }

        const data = await res.json();
        setEntries(data);
      } catch (err: unknown) {
        console.error(err);
        setError("Error loading coding data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (!userId) {
    return (
      <div style={{ padding: 40, color: "white" }}>
        Loading user...
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 40, color: "white" }}>
        Loading coding entries...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, color: "red" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: 40, color: "white" }}>
      <h1>Coding Page (Minimal Test)</h1>
      <p>User ID: {userId}</p>
      <p>Total Entries: {entries.length}</p>

      <ul>
        {entries.map((entry) => (
          <li key={entry._id}>
            {entry.questionName} — {entry.platform} — {entry.difficulty}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Coding;