import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsPager } from "@/components/docs/docs-pager";
import { MarkdownRenderer } from "@/components/docs/markdown-renderer";
import { getAllDocs, getDocBySlug } from "@/lib/docs";
import { LOCALES, type Locale, isLocale, siteCopy } from "@/lib/i18n";

type DocsPageProps = {
  params: Promise<{
    locale: string;
    slug?: string[];
  }>;
};

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    getAllDocs(locale).map((doc) => ({
      locale,
      slug: doc.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: DocsPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug = [] } = await params;

  if (!isLocale(rawLocale)) {
    return {};
  }

  const locale: Locale = rawLocale;
  const doc = getDocBySlug(locale, slug);

  if (!doc) {
    return {
      title: siteCopy[locale].docs.metadataTitle,
    };
  }

  return {
    title: `${doc.meta.title} | Neta ${siteCopy[locale].docs.title}`,
    description: doc.meta.description,
  };
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { locale: rawLocale, slug = [] } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const doc = getDocBySlug(locale, slug);

  if (!doc) {
    notFound();
  }

  const docs = getAllDocs(locale);
  const currentIndex = docs.findIndex((item) => item.href === doc.href);
  const previous = currentIndex > 0 ? docs[currentIndex - 1] : undefined;
  const next =
    currentIndex >= 0 && currentIndex < docs.length - 1
      ? docs[currentIndex + 1]
      : undefined;

  return (
    <div className="min-w-0 pb-8">
      <MarkdownRenderer content={doc.content} />
      <DocsPager previous={previous} next={next} locale={locale} />
    </div>
  );
}
