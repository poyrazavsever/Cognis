import Image from "next/image";
import { Icon } from "@/components/app-icon";
import { Card, CardContent, Typography } from "poyraz-ui/atoms";
import { type Locale, landingCopy } from "@/lib/i18n";

const LAYOUTS = [
  "sm:col-span-2 lg:col-span-7 lg:row-span-2",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
  "sm:col-span-2 lg:col-span-12",
] as const;

export function ModulesSection({ locale }: { locale: Locale }) {
  const copy = landingCopy[locale].modules;

  return (
    <section id="modules" className="bg-white px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl" data-neta-motion>
          <Typography
            variant="h2"
            component="h2"
            className="max-w-[15ch] text-4xl leading-[1.02] text-[#15181b] sm:text-5xl"
          >
            {copy.title}
          </Typography>
          <Typography
            variant="lead"
            className="mt-5 max-w-[60ch] text-base leading-7 text-[#626a73] sm:text-lg"
          >
            {copy.description}
          </Typography>
        </div>

        <div className="mt-12 grid auto-rows-[12rem] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {copy.items.map((item, index) => {
            const hasImage = "image" in item && Boolean(item.image);
            const image = "image" in item ? item.image : undefined;

            return (
              <Card
                key={item.title}
                variant="bordered"
                className={`module-cell ${LAYOUTS[index]} ${
                  hasImage ? "module-cell--visual" : "module-cell--plain"
                }`}
                data-neta-motion
              >
                {image ? (
                  <div className="module-cell__image-wrap" aria-hidden="true">
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 58vw"
                      className="module-cell__image"
                    />
                  </div>
                ) : null}
                {index === 5 ? (
                  <Image
                    src="/logo/iconLogo.png"
                    alt=""
                    width={500}
                    height={500}
                    className="module-cell__mascot"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="module-cell__shade" aria-hidden="true" />
                <CardContent className="module-cell__content">
                  <span className="module-cell__icon">
                    <Icon icon={item.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <Typography
                      variant="h3"
                      component="h3"
                      className="text-xl text-current"
                    >
                      {item.title}
                    </Typography>
                    <p className="mt-2 max-w-[34ch] text-sm leading-6 opacity-70">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
