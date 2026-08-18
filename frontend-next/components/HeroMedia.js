"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const HERO_VIDEO = "/media/hero.mp4";
const HERO_POSTER = "/media/hero-poster.jpg";

export default function HeroMedia() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a browser API on mount
    setReduceMotion(mq.matches);
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (reduceMotion) {
    return (
      <Image
        src={HERO_POSTER}
        alt="Wood-pressed oilseed pulp at the ghani"
        fill
        className="object-cover"
        sizes="(min-width: 768px) 40vw, 100vw"
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
