"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/app-icon";
import { Card, CardContent, Typography } from "poyraz-ui/atoms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "poyraz-ui/molecules";
import { type Locale, landingCopy } from "@/lib/i18n";

export function ProductProofSection({ locale }: { locale: Locale }) {
  const copy = landingCopy[locale].proof;
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section
      id="product-proof"
      className="relative overflow-hidden bg-[#f3f5f7] px-4 py-20 sm:px-6 sm:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl" data-neta-motion>
          <Typography
            variant="h2"
            component="h2"
            className="max-w-[16ch] text-4xl leading-[1.02] text-[#15181b] sm:text-5xl lg:text-6xl"
          >
            {copy.title}
          </Typography>
          <Typography
            variant="lead"
            className="mt-5 max-w-[58ch] text-base leading-7 text-[#626a73] sm:text-lg"
          >
            {copy.description}
          </Typography>
        </div>

        <Tabs
          value={String(activeIndex)}
          onValueChange={(value) => setActiveIndex(Number(value))}
          className="mt-12"
          data-neta-motion
        >
          <TabsList className="proof-tabs" aria-label={copy.eyebrow}>
            {copy.screens.map((screen, index) => (
              <TabsTrigger
                key={screen.label}
                value={String(index)}
                className="proof-tabs__button"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {screen.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {copy.screens.map((screen, index) => (
            <TabsContent
              key={screen.label}
              value={String(index)}
              className="mt-0 focus-visible:outline-none"
            >
              <Card variant="bordered" className="product-proof-frame">
                <CardContent className="p-0">
                  <div className="product-proof-frame__bar">
                    <div className="flex items-center gap-2">
                      <Image
                        src="/logo/iconLogo.png"
                        alt=""
                        width={500}
                        height={500}
                        className="h-5 w-5 object-contain"
                        aria-hidden="true"
                      />
                      <span>Neta</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#626a73]">
                      {screen.label}
                    </span>
                  </div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-white">
                    <Image
                      src={screen.image}
                      alt={screen.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 1280px"
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          <a href="#modules" className="product-proof-route">
            <span>{copy.openLabel}</span>
            <Icon icon="mdi:arrow-right" className="h-5 w-5" />
          </a>
        </Tabs>
      </div>
    </section>
  );
}
