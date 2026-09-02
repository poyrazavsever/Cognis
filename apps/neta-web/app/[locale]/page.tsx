import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AiAssistantSection } from "@/components/sections/ai-assistant-section";
import { ClientPortalSection } from "@/components/sections/client-portal-section";
import { ModulesSection } from "@/components/sections/modules-section";
import { ProductProofSection } from "@/components/sections/product-proof-section";
import { SelfHostSection } from "@/components/sections/self-host-section";
import { NetaJourney } from "@/components/scroll-scrub/neta-journey";
import { SmoothScrollProvider } from "@/components/smooth-scroll-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LOCALES, type Locale, isLocale, siteCopy } from "@/lib/i18n";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    return {};
  }

  const copy = siteCopy[rawLocale].metadata;

  return {
    ...copy,
    alternates: {
      canonical: `/${rawLocale}`,
      languages: {
        tr: "/tr",
        en: "/en",
      },
    },
    openGraph: {
      type: "website",
      locale: rawLocale === "tr" ? "tr_TR" : "en_US",
      url: `/${rawLocale}`,
      siteName: "Neta",
      title: copy.title,
      description: copy.description,
      images: [
        {
          url: "/assets/neta-social.png",
          width: 1200,
          height: 630,
          alt: "Neta",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: ["/assets/neta-social.png"],
    },
  };
}

export default async function Home({ params }: LocalePageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;

  return (
    <>
      <SmoothScrollProvider />
      <SiteHeader locale={locale} />
      <main className="flex min-h-screen flex-col">
        <NetaJourney locale={locale} />
        <ProductProofSection locale={locale} />
        <ModulesSection locale={locale} />
        <ClientPortalSection locale={locale} />
        <AiAssistantSection locale={locale} />
        <SelfHostSection locale={locale} />

        <SiteFooter locale={locale} />
      </main>
    </>
  );
}
