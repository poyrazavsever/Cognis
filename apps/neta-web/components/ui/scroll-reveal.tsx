"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  threshold?: number;
  x?: number;
  y?: number;
  scale?: number;
  parallaxX?: number;
  parallaxY?: number;
  once?: boolean;
  style?: CSSProperties;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  duration = 700,
  threshold = 0.18,
  x = 0,
  y = 28,
  scale = 0.985,
  parallaxX = 0,
  parallaxY = 0,
  once = true,
  style,
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [inView, setInView] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const element = elementRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setInView(visible);

        if (visible) {
          setRevealed(true);
        } else if (!once) {
          setRevealed(false);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [once, reducedMotion, threshold]);

  useEffect(() => {
    if (reducedMotion || (parallaxX === 0 && parallaxY === 0)) {
      return;
    }

    const element = elementRef.current;

    if (!element) {
      return;
    }

    let frame = 0;

    const updateProgress = () => {
      frame = 0;

      if (!inView) {
        setProgress((current) => (current === 0 ? current : 0));
        return;
      }

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const distance = (viewportCenter - sectionCenter) / viewportHeight;

      setProgress(clamp(distance * 1.6, -1, 1));
    };

    const requestUpdate = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(updateProgress);
      }
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [inView, parallaxX, parallaxY, reducedMotion]);

  const visible = reducedMotion || revealed;
  const translateX = visible ? progress * parallaxX : x;
  const translateY = visible ? progress * parallaxY : y;
  const scaleValue = visible ? 1 : scale;

  return (
    <div
      ref={elementRef}
      className={cn("transform-gpu will-change-transform", className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: reducedMotion
          ? "none"
          : `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleValue})`,
        transitionProperty: "opacity, transform, filter",
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
