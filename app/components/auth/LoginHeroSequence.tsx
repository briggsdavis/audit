"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

type HeroPosition = CSSProperties & {
  "--hero-title-left": string;
  "--hero-title-top": string;
};

type HeroLayout = {
  centerLeft: number;
  centerTop: number;
  lockupLeft: number;
  targetLeft: number;
  targetTop: number;
  targetWidth: number;
  startSize: number;
  titleLeft: number;
  titleTop: number;
};

export function LoginHeroSequence({ onComplete }: { onComplete: () => void }) {
  const titleRef = useRef<HTMLSpanElement>(null);
  const [layout, setLayout] = useState<HeroLayout | null>(null);
  const [phase, setPhase] = useState<"center" | "lockup" | "destination">("center");
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const title = titleRef.current;
    const target = document.querySelector<HTMLElement>("[data-project-gate-logo]");
    if (!title || !target) return;

    const targetRect = target.getBoundingClientRect();
    const startSize = window.innerWidth <= 520 ? 60 : 76;
    const gap = window.innerWidth <= 520 ? 18 : 28;
    const titleWidth = title.getBoundingClientRect().width;
    const lockupLeft = (window.innerWidth - startSize - gap - titleWidth) / 2;
    setLayout({
      centerLeft: window.innerWidth / 2 - startSize / 2,
      centerTop: window.innerHeight / 2 - startSize / 2,
      lockupLeft,
      targetLeft: targetRect.left,
      targetTop: targetRect.top,
      targetWidth: targetRect.width,
      startSize,
      titleLeft: lockupLeft + startSize + gap,
      titleTop: window.innerHeight / 2,
    });
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
      return;
    }
    if (!layout) return;
    const revealFrame = window.requestAnimationFrame(() => setVisible(true));
    const lockupTimer = window.setTimeout(() => setPhase("lockup"), 950);
    const destinationTimer = window.setTimeout(() => setPhase("destination"), 2700);
    const completeTimer = window.setTimeout(onComplete, 4800);
    return () => {
      window.cancelAnimationFrame(revealFrame);
      window.clearTimeout(lockupTimer);
      window.clearTimeout(destinationTimer);
      window.clearTimeout(completeTimer);
    };
  }, [layout, onComplete]);

  const logoStyle: CSSProperties = layout ? {
    left: phase === "center" ? layout.centerLeft : phase === "lockup" ? layout.lockupLeft : layout.targetLeft,
    top: phase === "destination" ? layout.targetTop : layout.centerTop,
    width: phase === "destination" ? layout.targetWidth : layout.startSize,
    height: phase === "destination" ? layout.targetWidth : layout.startSize,
    opacity: visible ? 1 : 0,
  } : { left: "50%", top: "50%", opacity: 0 };

  const position = {
    "--hero-title-left": layout ? `${layout.titleLeft}px` : "50%",
    "--hero-title-top": layout ? `${layout.titleTop}px` : "50%",
  } as HeroPosition;
  return <div className="login-hero-sequence" style={position} aria-hidden="true">
    <img style={logoStyle} className={`login-hero-logo brand-mark logo-image ${phase}`} src="/alber.png" alt="" />
    <span ref={titleRef} className="login-hero-title">
      {Array.from("Alber Audit").map((letter, index) => <span className={letter === " " ? "space" : ""} key={`${letter}-${index}`}><i style={{ animationDelay: `${0.98 + index * 0.04}s` }}>{letter === " " ? "\u00a0" : letter}</i></span>)}
    </span>
  </div>;
}
