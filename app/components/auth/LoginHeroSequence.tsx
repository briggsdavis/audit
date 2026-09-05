"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect } from "react";

export function LoginHeroSequence({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
      return;
    }
    const timer = window.setTimeout(onComplete, 3900);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return <div className="login-hero-sequence" aria-hidden="true">
    <div className="login-hero-lockup">
      <img src="/alber.png" alt="" />
      <span className="login-hero-title">
        {Array.from("Alber Audit").map((letter, index) => <span className={letter === " " ? "space" : ""} key={`${letter}-${index}`}><i style={{ animationDelay: `${0.72 + index * 0.045}s` }}>{letter === " " ? "\u00a0" : letter}</i></span>)}
      </span>
    </div>
  </div>;
}
