"use client";

import React, { useEffect, useRef, useState } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import "lenis/dist/lenis.css";

/**
 * Custom hook to easily access Lenis methods anywhere in the application.
 * Usage:
 *   const lenis = useSmoothScroll();
 *   lenis?.scrollTo(0, { duration: 1.2 });
 */
export function useSmoothScroll(callback, deps, priority) {
  return useLenis(callback, deps, priority);
}

/**
 * Unified SmoothScrollProvider for PrepSmart AI
 * - Powered by Lenis v1.3 with luxury exponential ease-out
 * - Ticker-synchronized with GSAP for buttery 60/120fps frame rates
 * - Smart Route Awareness: Automatically resets scroll on route transitions,
 *   and pauses smooth damping on active interview sessions (/start) for zero latency
 * - Accessibility: Detects `prefers-reduced-motion` and falls back to native instant scrolling
 * - Mobile: Uses native 120Hz touch momentum (smoothTouch: false) while applying inertia to desktop wheels
 */
export default function SmoothScrollProvider({ children }) {
  const lenisRef = useRef(null);
  const pathname = usePathname();
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check accessibility preference: prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Synchronize Lenis RAF with GSAP ticker for seamless rendering
  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;

    function handleTicker(time) {
      lenis.raf(time * 1000);
    }

    gsap.ticker.add(handleTicker);
    // Eliminate GSAP lag smoothing jumps with Lenis
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(handleTicker);
    };
  }, []);

  // Route-aware handling:
  // 1. Reset scroll to top on page navigation
  // 2. Pause Lenis on active interview test screen (/start) to prevent wheel inertia interference
  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;

    // Reset scroll position on route change
    lenis.scrollTo(0, { immediate: true });

    // If candidate is actively taking an interview test (/start), pause wheel damping
    const isActiveInterview = pathname && pathname.includes("/interview/") && pathname.endsWith("/start");
    if (isActiveInterview) {
      lenis.stop();
    } else {
      lenis.start();
    }
  }, [pathname]);

  // If user requested reduced motion, bypass Lenis entirely
  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      ref={lenisRef}
      root
      autoRaf={false} // Driven synchronously by gsap.ticker above
      options={{
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
        infinite: false,
      }}
    >
      {children}
    </ReactLenis>
  );
}
