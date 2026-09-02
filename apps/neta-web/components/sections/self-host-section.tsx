import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/app-icon";
import { Button, Typography } from "poyraz-ui/atoms";
import { InstallCommand } from "@/components/install-command";
import { type Locale, getDocsHref, landingCopy } from "@/lib/i18n";

const GITHUB_URL = "https://github.com/poyrazavsever/neta";

export function SelfHostSection({ locale }: { locale: Locale }) {
  const copy = landingCopy[locale].selfHost;

  return (
    <section id="self-host" className="self-host-final">
      <div className="self-host-final__image" aria-hidden="true">
        <Image
          src="/assets/neta-journey/neta-journey-final.png"
          alt=""
          fill
          unoptimized
          sizes="(max-width: 900px) 100vw, 58vw"
        />
      </div>
      <div className="self-host-final__shade" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-2xl" data-neta-motion>
          <Typography
            variant="h2"
            component="h2"
            className="max-w-[11ch] text-4xl leading-[1.02] text-[#15181b] sm:text-5xl lg:text-6xl"
          >
            {copy.title}
          </Typography>
          <Typography
            variant="lead"
            className="mt-5 max-w-[52ch] text-base leading-7 text-[#626a73] sm:text-lg"
          >
            {copy.description}
          </Typography>
        </div>

        <div className="self-host-final__flow" data-neta-motion>
          {copy.stages.map((stage, index) => (
            <div key={stage} className="self-host-final__step">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{stage}</strong>
              {index < copy.stages.length - 1 ? (
                <Icon icon="mdi:arrow-right" className="h-4 w-4" />
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-10 max-w-4xl" data-neta-motion>
          <InstallCommand locale={locale} tone="light" />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6" data-neta-motion>
          <Button asChild>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon icon="mdi:github" className="h-5 w-5" />
              {copy.github}
              <Icon icon="mdi:arrow-top-right" className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="secondary">
            <Link href={getDocsHref(locale)}>
              {copy.docs}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
