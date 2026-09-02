import { redirect } from "next/navigation";
import { getHomeHref, DEFAULT_LOCALE } from "@/lib/i18n";

export default function RootPage() {
  redirect(getHomeHref(DEFAULT_LOCALE));
}
