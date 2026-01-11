"use client";

import { useEffect, useState } from "react";
import PostCard from "./PostCard";
import RightPanel from "./RightPanel";

export default function Feed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;
    if (!API) return console.error("NEXT_PUBLIC_API_URL is not set");

    fetch(`${API}/posts`, {
      credentials: "include"
    })
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data.posts) ? data.posts : [];
        setPosts(arr.map(p => ({ ...p, id: String(p.id || p._id) })));
      })
      .catch(console.error);
  }, []);

  const handleDeleted = id => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="feed-wrapper">
      <div className="feed-center">
        {posts.map(post => (
          <PostCard key={post.id} post={post} onDeleted={handleDeleted} />
        ))}
      </div>

      <RightPanel />
    </div>
  );
}
