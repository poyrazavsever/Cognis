"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/app-icon";
import { Card, CardContent, Typography } from "poyraz-ui/atoms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "poyraz-ui/molecules";
import { type Locale, landingCopy, siteCopy } from "@/lib/i18n";

export function ClientPortalSection({ locale }: { locale: Locale }) {
  const copy = landingCopy[locale].portal;
  const screens = siteCopy[locale].clientPortal.screens;
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section
      id="client-portal"
      className="overflow-hidden bg-[#f3f5f7] px-4 py-20 sm:px-6 sm:py-28"
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.36fr_0.64fr] lg:items-center">
        <div data-neta-motion>
          <Typography
            variant="h2"
            component="h2"
            className="max-w-[13ch] text-4xl leading-[1.02] text-[#15181b] sm:text-5xl"
          >
            {copy.title}
          </Typography>
          <Typography
            variant="lead"
            className="mt-5 max-w-[45ch] text-base leading-7 text-[#626a73]"
          >
            {copy.description}
          </Typography>
          <p className="mt-8 border-l-2 border-primary pl-4 text-sm leading-6 text-[#434a52]">
            {copy.note}
          </p>
        </div>

        <Tabs
          value={String(activeIndex)}
          onValueChange={(value) => setActiveIndex(Number(value))}
          className="portal-showcase"
          data-neta-motion
        >
          <div className="portal-showcase__rail" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          {screens.map((screen, index) => (
            <TabsContent
              key={screen.title}
              value={String(index)}
              className="mt-0 focus-visible:outline-none"
            >
              <Card variant="bordered" className="portal-showcase__screen">
                <CardContent className="p-0">
                  <div className="portal-showcase__screen-bar">
                    <span>{screen.title}</span>
                    <Icon icon="mdi:open-in-new" className="h-4 w-4" />
                  </div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-white">
                    <Image
                      src={screen.image}
                      alt={screen.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 64vw"
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          <TabsList
            className="portal-showcase__tabs"
            aria-label={copy.tabsLabel}
          >
            {screens.map((screen, index) => (
              <TabsTrigger
                key={screen.title}
                value={String(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {screen.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </section>
  );
}
