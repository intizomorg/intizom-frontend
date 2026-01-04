"use client";

import { useRef } from "react";

/*
  VideoCard: responsive video wrapper.
  - Enforces a maximum height to avoid extremely tall videos on desktop.
  - Uses object-fit to keep nice cropping.
  - Keeps controls and allows click-to-play toggle if desired.
*/

export default function VideoCard({ post }) {
  const videoRef = useRef(null);

  const handleToggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  return (
    <div className="w-full bg-black">
      <div className="w-full max-h-[640px] overflow-hidden rounded-lg">
        <video
          ref={videoRef}
          src={post.video}
          controls
          onClick={handleToggle}
          className="w-full h-full object-cover"
          playsInline
          preload="metadata"
        />
      </div>
    </div>
  );
}
