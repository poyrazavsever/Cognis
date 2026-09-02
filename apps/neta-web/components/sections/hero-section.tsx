"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Typography } from "poyraz-ui/atoms";
import { DemoAccessButton } from "@/components/demo-access-button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { type Locale, siteCopy } from "@/lib/i18n";

const GITHUB_URL = "https://github.com/poyrazavsever/neta";

export function HeroSection({ locale }: { locale: Locale }) {
  const copy = siteCopy[locale].hero;
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const media = mediaRef.current;

    if (!section || !media) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let frame = 0;

    const updateParallax = () => {
      frame = 0;

      if (reducedMotion.matches) {
        media.style.transform = "";
        return;
      }

      const progress = Math.min(
        Math.max(window.scrollY, 0),
        section.offsetHeight,
      );
      media.style.transform = `translate3d(0, ${progress * 0.08}px, 0)`;
    };

    const handleScroll = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(updateParallax);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    reducedMotion.addEventListener("change", updateParallax);
    updateParallax();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      reducedMotion.removeEventListener("change", updateParallax);

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[92svh] overflow-hidden bg-neutral-200 bg-cover bg-center"
      style={{ backgroundImage: "url('/defaultHero.png')" }}
    >
      <div ref={mediaRef} className="absolute inset-0 z-0 will-change-transform">
        <Image
          src="/defaultHero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className={`object-cover object-center transition-opacity duration-700 ${
            videoReady ? "opacity-0" : "opacity-100"
          }`}
          aria-hidden="true"
        />

        <video
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/defaultHero.png"
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
          aria-hidden="true"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-black/25" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-r from-black/15 via-black/25 to-black/75" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-44 bg-linear-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-linear-to-t from-black/45 to-transparent" />

      <div className="container relative z-20 mx-auto flex w-full max-w-7xl items-center justify-end px-4 py-24 sm:px-6 lg:py-28">
        <div className="w-full text-right sm:max-w-xl lg:max-w-[32rem]">
          <ScrollReveal delay={100} y={20}>
            <Typography
              variant="h1"
              component="h1"
              className="text-4xl leading-[1.08] tracking-normal text-white sm:text-5xl lg:text-[3.25rem]"
            >
              {copy.titlePrefix}{" "}
              <span className="font-display text-primary">
                {copy.titleAccent}
              </span>{" "}
              {copy.titleSuffix}
            </Typography>
          </ScrollReveal>

          <ScrollReveal className="mt-5" delay={180} y={18}>
            <Typography
              variant="lead"
              className="ml-auto max-w-[32rem] text-base leading-7 text-white/80 sm:text-lg"
            >
              {copy.description}
            </Typography>
          </ScrollReveal>

          <ScrollReveal
            className="mt-8 flex flex-col items-stretch justify-end gap-3 min-[420px]:flex-row min-[420px]:items-center"
            delay={260}
            y={16}
          >
            <DemoAccessButton locale={locale} className="min-w-44" />
            <AnimatedButton
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              icon="mdi:github"
              iconPosition="left"
              variant="outline"
              className="min-w-48 border-white/35 bg-white/10 text-white shadow-none backdrop-blur-sm hover:border-white/60 hover:bg-white/20"
            >
              {copy.github}
            </AnimatedButton>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
