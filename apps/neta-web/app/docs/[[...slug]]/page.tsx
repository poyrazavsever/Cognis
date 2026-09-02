import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, getDocsHref } from "@/lib/i18n";

type LegacyDocsPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

export default async function LegacyDocsPage({ params }: LegacyDocsPageProps) {
  const { slug = [] } = await params;

  redirect(getDocsHref(DEFAULT_LOCALE, slug));
}
