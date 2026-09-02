"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { DemoAccessButton } from "@/components/demo-access-button";
import { InstallCommand } from "@/components/install-command";
import { type Locale, landingCopy } from "@/lib/i18n";
import "./neta-journey.css";

type JourneyChapter = {
  readonly id: string;
  readonly label: string;
  readonly kicker?: string;
  readonly title: string;
  readonly body: string;
  readonly align: "left" | "right";
};

type JourneyStyle = CSSProperties & {
  "--journey-progress": number;
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

export function NetaJourney({ locale }: { locale: Locale }) {
  const copy = landingCopy[locale].journey;
  const chapters = copy.chapters as readonly JourneyChapter[];
  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const media = mediaRef.current;

    if (!root || !media) {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia(
      "(hover: none) and (pointer: coarse), (max-width: 860px)",
    );
    let reducedMotion = motionQuery.matches;
    let destroyed = false;
    let dirty = true;
    let frame = 0;
    let rootTop = 0;
    let scrollRange = 1;
    let layoutWidth = window.innerWidth;
    let target = 0;
    let current = 0;
    let ready = false;
    let loading = false;
    let failed = false;
    let userReady = false;
    let loadedSource = "";
    let video: HTMLVideoElement | undefined;
    let objectUrl: string | undefined;
    let abort: AbortController | undefined;

    const sourceForViewport = () =>
      mobileQuery.matches
        ? "/assets/neta-journey/neta-journey-mobile.mp4"
        : "/assets/neta-journey/neta-journey-desktop.mp4";

    const clearVideo = () => {
      abort?.abort();
      video?.remove();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      abort = undefined;
      video = undefined;
      objectUrl = undefined;
      loadedSource = "";
      ready = false;
      loading = false;
      failed = false;
      delete root.dataset.videoPainted;
      delete root.dataset.videoFailed;
    };

    const primeVideo = async () => {
      if (!video || !mobileQuery.matches) {
        return;
      }

      try {
        await video.play();
        video.pause();
      } catch {
        // The exact first-frame poster remains visible until a later gesture.
      }
    };

    const loadVideo = async () => {
      const source = sourceForViewport();

      if (reducedMotion || destroyed || loading || ready || failed) {
        return;
      }

      loading = true;
      loadedSource = source;
      abort = new AbortController();
      const request = abort;

      try {
        const response = await fetch(source, { signal: request.signal });

        if (!response.ok) {
          throw new Error(`Journey film failed: ${response.status}`);
        }

        const blob = await response.blob();

        if (destroyed || request.signal.aborted || loadedSource !== source) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        video = document.createElement("video");
        video.className = "neta-journey__video";
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");
        video.src = objectUrl;

        video.addEventListener(
          "loadedmetadata",
          () => {
            ready = true;
            loading = false;
            dirty = true;
          },
          { once: true },
        );

        video.addEventListener(
          "loadeddata",
          () => {
            if (video && video.duration > 0) {
              video.currentTime = Math.min(0.04, video.duration * 0.002);
            }

            if (userReady) {
              void primeVideo();
            }
          },
          { once: true },
        );

        video.addEventListener("seeked", () => {
          root.dataset.videoPainted = "true";
        });

        video.addEventListener(
          "error",
          () => {
            root.dataset.videoFailed = "true";
            failed = true;
            loading = false;
            ready = false;
          },
          { once: true },
        );

        media.append(video);
      } catch (error) {
        if (
          request.signal.aborted ||
          (error instanceof Error && error.name === "AbortError")
        ) {
          return;
        }

        root.dataset.videoFailed = "true";
        failed = true;
        loading = false;
      }
    };

    const layout = () => {
      const pageY = window.scrollY || window.pageYOffset;
      rootTop = root.getBoundingClientRect().top + pageY;
      scrollRange = Math.max(root.offsetHeight - window.innerHeight, 1);
      layoutWidth = window.innerWidth;

      const expectedSource = sourceForViewport();
      if (loadedSource && loadedSource !== expectedSource) {
        clearVideo();
        void loadVideo();
      }

      dirty = true;
    };

    const readScroll = () => {
      const pageY = window.scrollY || window.pageYOffset;
      target = clamp((pageY - rootTop) / scrollRange);

      root.style.setProperty("--journey-progress", String(target));
    };

    const updateVideo = () => {
      if (!video || !ready || video.seeking) {
        return;
      }

      current += (target - current) * 0.2;

      if (Math.abs(target - current) < 0.0005) {
        current = target;
      }

      const targetTime = clamp(current, 0, 0.999) * (video.duration || 1);
      const epsilon = mobileQuery.matches ? 0.025 : 0.009;

      if (Math.abs(video.currentTime - targetTime) > epsilon) {
        try {
          video.currentTime = targetTime;
        } catch {
          // Keep the last decoded frame while the browser catches up.
        }
      }
    };

    const tick = () => {
      if (destroyed) {
        return;
      }

      if (dirty) {
        dirty = false;
        readScroll();
      }

      updateVideo();
      frame = window.requestAnimationFrame(tick);
    };

    const onScroll = () => {
      dirty = true;
    };

    const onResize = () => {
      if (mobileQuery.matches && window.innerWidth === layoutWidth) {
        return;
      }

      layout();
    };

    const onFirstGesture = () => {
      if (userReady) {
        return;
      }

      userReady = true;
      void primeVideo();
    };

    const onMotionPreference = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;

      if (reducedMotion) {
        clearVideo();
      } else {
        void loadVideo();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", layout);
    window.addEventListener("pointerdown", onFirstGesture, {
      once: true,
      passive: true,
    });
    window.addEventListener("touchstart", onFirstGesture, {
      once: true,
      passive: true,
    });
    motionQuery.addEventListener("change", onMotionPreference);

    layout();
    void loadVideo();
    frame = window.requestAnimationFrame(tick);

    return () => {
      destroyed = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", layout);
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
      motionQuery.removeEventListener("change", onMotionPreference);
      clearVideo();
      root.style.removeProperty("--journey-progress");
    };
  }, [chapters]);

  const journeyStyle: JourneyStyle = { "--journey-progress": 0 };

  return (
    <section
      id="journey"
      className="neta-journey"
      ref={rootRef}
      style={journeyStyle}
    >
      <div className="neta-journey__stage">
        <div className="neta-journey__media" ref={mediaRef} aria-hidden="true">
          <picture className="neta-journey__picture">
            <source
              media="(hover: none) and (pointer: coarse), (max-width: 860px)"
              srcSet="/assets/neta-journey/neta-journey-mobile-poster.png"
            />
            <img
              src="/assets/neta-journey/neta-journey-desktop-poster.png"
              alt=""
              className="neta-journey__poster"
              fetchPriority="high"
            />
          </picture>
        </div>

        <div className="neta-journey__scrim" aria-hidden="true" />

        <div className="neta-journey__progress" aria-hidden="true">
          <span />
        </div>

      </div>

      <div className="neta-journey__story">
        {chapters.map((chapter, index) => {
          const Heading = index === 0 ? "h1" : "h2";

          return (
            <article
              className="neta-journey__chapter"
              data-align={chapter.align}
              id={chapter.id}
              key={chapter.id}
            >
              <div className="neta-journey__chapter-pin">
                <div className="neta-journey__copy">
                  {chapter.kicker ? (
                    <p className="neta-journey__kicker">{chapter.kicker}</p>
                  ) : null}
                  <Heading className="neta-journey__title">
                    {chapter.title}
                  </Heading>
                  <p className="neta-journey__body">{chapter.body}</p>

                  {index === 0 ? (
                    <div className="neta-journey__actions">
                      <InstallCommand locale={locale} tone="light" compact />
                      <DemoAccessButton
                        locale={locale}
                        className="neta-journey__demo"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
