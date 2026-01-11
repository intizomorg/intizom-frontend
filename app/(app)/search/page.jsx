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

  // Load history
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      setHistory(saved);
    } catch {
      setHistory([]);
    }
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
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/search?q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
            credentials: "include"   // 🔐 cookie bilan yuboriladi
          }
        );

        if (!res.ok) {
          setUsers([]);
          return;
        }

        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") console.error("Search error:", e);
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

  const addToHistory = (user) => {
    const filtered = history.filter(u => u.id !== user.id);
    const newHistory = [user, ...filtered].slice(0, HISTORY_LIMIT);
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const removeFromHistory = (id) => {
    const filtered = history.filter(u => u.id !== id);
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
        {query && (
          <>
            {loading && <p>Loading...</p>}

            {!loading && users.length === 0 && (
              <p className="no-result">Foydalanuvchi topilmadi</p>
            )}

            {users.map(user => (
              <UserResult
                key={user.id}
                user={user}
                onSelect={() => addToHistory(user)}
              />
            ))}
          </>
        )}

        {!query && history.length > 0 && (
          <>
            <div style={{ padding: 10, fontWeight: 600 }}>
              Qidiruv tarixi
            </div>

            {history.map(user => (
              <div
                key={user.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <UserResult user={user} />
                <button
                  onClick={() => removeFromHistory(user.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    marginRight: 10
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
