"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react";

type HeroDestination = CSSProperties & {
  "--hero-dest-x": string;
  "--hero-dest-y": string;
  "--hero-dest-scale": number;
};

export function LoginHeroSequence({ onComplete }: { onComplete: () => void }) {
  const [destination, setDestination] = useState<HeroDestination>({
    "--hero-dest-x": "0px",
    "--hero-dest-y": "-25vh",
    "--hero-dest-scale": 1,
  });

  useLayoutEffect(() => {
    const measureDestination = () => {
      const target = document.querySelector<HTMLElement>("[data-project-gate-logo]");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      setDestination({
        "--hero-dest-x": `${rect.left + rect.width / 2 - window.innerWidth / 2}px`,
        "--hero-dest-y": `${rect.top + rect.height / 2 - window.innerHeight / 2}px`,
        "--hero-dest-scale": rect.width / 56,
      });
    };
    measureDestination();
    const frame = window.requestAnimationFrame(measureDestination);
    window.addEventListener("resize", measureDestination);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureDestination);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
      return;
    }
    const timer = window.setTimeout(onComplete, 4100);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return <div className="login-hero-sequence" style={destination} aria-hidden="true">
    <img className="login-hero-logo brand-mark logo-image" src="/alber.png" alt="" />
    <span className="login-hero-title">
      {Array.from("Alber Audit").map((letter, index) => <span className={letter === " " ? "space" : ""} key={`${letter}-${index}`}><i style={{ animationDelay: `${0.72 + index * 0.045}s` }}>{letter === " " ? "\u00a0" : letter}</i></span>)}
    </span>
  </div>;
}
