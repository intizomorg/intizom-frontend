"use client";

import { useEffect, useState } from "react";
import UserResult from "@/components/search/UserResult";

const HISTORY_KEY = "search_history";
const HISTORY_LIMIT = 10;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load history on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    setHistory(saved);
  }, []);

  // Search users
  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    const controller = new AbortController();

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/users/search?q=${encodeURIComponent(query)}`,
  {
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);


        const data = await res.json();
        setUsers(data);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchUsers, 400);
    return () => {
      clearTimeout(delay);
      controller.abort();
    };
  }, [query]);

  // Save to history
  const addToHistory = (user) => {
    let newHistory = history.filter((u) => u.id !== user.id);
    newHistory.unshift(user);
    newHistory = newHistory.slice(0, HISTORY_LIMIT);

    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const removeFromHistory = (id) => {
    const filtered = history.filter((u) => u.id !== id);
    setHistory(filtered);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  };

  return (
    <div className="search-page">
      <input
        className="search-input"
        placeholder="Foydalanuvchilarni qidirish"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="search-results">
        {/* SEARCH RESULT */}
        {query && (
          <>
            {loading && <p>Loading...</p>}

            {users.map((user) => (
              <UserResult
                key={user.id}
                user={user}
                onSelect={() => addToHistory(user)}
              />
            ))}

            {!loading && users.length === 0 && (
              <p className="no-result">Foydalanuvchi topilmadi</p>
            )}
          </>
        )}

        {/* SEARCH HISTORY */}
        {!query && history.length > 0 && (
          <>
            <div style={{ padding: "10px", fontWeight: 600 }}>
              Qidiruv tarixi
            </div>

            {history.map((user) => (
              <div
                key={user.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <UserResult user={user} />
                <button
                  onClick={() => removeFromHistory(user.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    marginRight: 10,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
