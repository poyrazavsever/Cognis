"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Typography } from "poyraz-ui/atoms";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Kanban,
  Wallet,
} from "lucide-react";

type AuthPageShellProps = {
  branding: {
    applicationName: string;
    lightLogoUrl: string | null;
    darkLogoUrl: string | null;
  };
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  imageSide?: "left" | "right";
  form: ReactNode;
  secondaryAction?: ReactNode;
  footer: ReactNode;
};

const highlights = [
  { label: "Müşteriler", icon: Kanban },
  { label: "Takvim", icon: CalendarDays },
  { label: "Finans", icon: Wallet },
  { label: "Raporlar", icon: BarChart3 },
];

export function AuthPageShell({
  branding,
  title,
  description,
  form,
  secondaryAction,
  footer,
}: AuthPageShellProps) {
  const reducedMotion = useReducedMotion();

  const fadeUp = {
    initial: reducedMotion ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reducedMotion ? 0 : 0.55,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_480px]">
        <motion.section
          initial={reducedMotion ? false : { opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.75,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between"
        >
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] bg-size-[32px_32px]" />
          <div className="relative z-10 flex items-center gap-4 p-10">
            <Image
              src={branding.darkLogoUrl ?? "/logo/lightLogoLong.png"}
              alt={branding.applicationName}
              width={240}
              height={64}
              className="h-16 w-auto object-contain"
              style={{ width: "auto" }}
              priority
            />
          </div>

          <div className="relative z-10 px-10">
            <motion.div {...fadeUp}>
              <Typography
                component="h1"
                variant="display"
                className="max-w-2xl text-5xl font-semibold leading-[1.02] text-primary-foreground"
              >
                Freelancer işlerini, müşterilerini ve finansını tek yerde yönet.
              </Typography>
              <Typography component="p" variant="lead" className="mt-6 max-w-xl text-lg leading-8 text-primary-foreground/78">
                {branding.applicationName}, günlük operasyonunu, projelerini, side projectlerini ve
                temel finans durumunu sade raporlarla takip etmen için
                tasarlanır.
              </Typography>
            </motion.div>

            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.55, delay: 0.16 }}
              className="mt-10 grid max-w-xl grid-cols-2 gap-3"
            >
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-sm border border-white/18 bg-white/10 px-4 py-3 text-sm font-medium backdrop-blur"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </div>
                );
              })}
            </motion.div>
          </div>

          <div className="w-full relative z-10 p-10 text-sm text-primary-foreground/78">
            <span>Açık kaynak ve self-host edilebilir.</span>{" "}
            <Link
              href="https://github.com/poyrazavsever/neta"
              className="font-semibold text-primary-foreground underline-offset-4 hover:underline"
              target="_blank"
            >
              GitHub <ArrowUpRight className="h-3.5 w-3.5 inline" />
            </Link>
            <span> üzerinden ulaşabilirsin. </span>
            <Link
              href="https://poyrazavsever.com"
              className="inline-flex items-center gap-1 font-semibold text-primary-foreground underline-offset-4 hover:underline"
              target="_blank"
            >
              Poyraz Avsever <ArrowUpRight className="h-3.5 w-3.5 inline" />
            </Link>
            <span> tarafından kodlandı.</span>
          </div>
        </motion.section>

        <section className="flex min-h-screen items-center justify-center px-6 py-8 lg:px-12">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.6, delay: 0.08 }}
            className="w-full max-w-sm"
          >
            <div className="mb-8 flex justify-center lg:hidden">
              <Image
                src={branding.lightLogoUrl ?? branding.darkLogoUrl ?? "/logo/blackLogoLong.png"}
                alt={`${branding.applicationName} logo`}
                width={180}
                height={56}
                className="h-14 w-auto object-contain dark:hidden"
                style={{ width: "auto" }}
                priority
              />
              <Image
                src={branding.darkLogoUrl ?? branding.lightLogoUrl ?? "/logo/lightLogoLong.png"}
                alt={`${branding.applicationName} logo`}
                width={180}
                height={56}
                className="hidden h-14 w-auto object-contain dark:block"
                style={{ width: "auto" }}
                priority
              />
            </div>

            <div className="space-y-2 text-center lg:text-left">
              <Typography component="h2" variant="h1" className="text-3xl font-semibold tracking-normal text-foreground">
                {title}
              </Typography>
              <Typography component="p" variant="muted" className="text-sm leading-6">{description}</Typography>
            </div>

            <div className="mt-8 space-y-6">
              {form}
              {secondaryAction}
              {footer}
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
