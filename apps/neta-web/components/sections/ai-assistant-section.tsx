import Image from "next/image";
import { Icon } from "@/components/app-icon";
import { Card, CardContent, Typography } from "poyraz-ui/atoms";
import { type Locale, landingCopy, siteCopy } from "@/lib/i18n";

export function AiAssistantSection({ locale }: { locale: Locale }) {
  const copy = landingCopy[locale].ai;
  const imageAlt = siteCopy[locale].ai.screenshotAlt;

  return (
    <section id="ai-assistant" className="bg-white px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <Card variant="bordered" className="ai-proof" data-neta-motion>
          <CardContent className="p-0">
            <div className="ai-proof__bar">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo/iconLogo.png"
                  alt=""
                  width={500}
                  height={500}
                  className="h-5 w-5"
                  aria-hidden="true"
                />
                <span>Neta AI</span>
              </div>
              <span className="font-mono text-[11px] text-[#626a73]">
                database-aware
              </span>
            </div>
            <Image
              src="/appSs/ai.png"
              alt={imageAlt}
              width={2958}
              height={1846}
              sizes="(max-width: 1024px) 100vw, 54vw"
              className="h-auto w-full object-cover object-top"
            />
          </CardContent>
        </Card>

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
            className="mt-5 max-w-[46ch] text-base leading-7 text-[#626a73]"
          >
            {copy.description}
          </Typography>

          <div className="mt-10 divide-y divide-[#d8dde3] border-y border-[#d8dde3]">
            {copy.capabilities.map((capability) => (
              <article
                key={capability.title}
                className="grid grid-cols-[2.75rem_1fr] gap-4 py-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f3f5f7] text-primary">
                  <Icon icon={capability.icon} className="h-5 w-5" />
                </span>
                <div>
                  <Typography
                    variant="h3"
                    component="h3"
                    className="text-base text-[#15181b]"
                  >
                    {capability.title}
                  </Typography>
                  <p className="mt-1 text-sm leading-6 text-[#626a73]">
                    {capability.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
