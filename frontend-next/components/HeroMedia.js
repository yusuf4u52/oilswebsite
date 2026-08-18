"use client";

import { useEffect, useState } from "react";

const HERO_VIDEO = "/media/hero.mp4";
const HERO_POSTER = "/media/hero-poster.jpg";

export default function HeroMedia() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (reduceMotion) {
    return (
      <img
        src={HERO_POSTER}
        alt="Wood-pressed oilseed pulp at the ghani"
        className="w-full h-full object-cover"
        fetchPriority="high"
      />
    );
  }

  return (
    <video
      src={HERO_VIDEO}
      poster={HERO_POSTER}
      className="w-full h-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-label="Wood-pressed oilseed pulp being ground at the ghani"
    />
  );
}
