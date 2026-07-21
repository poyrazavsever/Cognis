"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Check, Languages, Plus, Settings2 } from "lucide-react";
import { Badge, Button, Card, CardContent } from "poyraz-ui/atoms";
import { toast } from "poyraz-ui/molecules";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { DestructiveConfirmation } from "@/components/system/destructive-confirmation";
import type { LocaleStatus } from "@/server/db/schema";
import { setInstanceDefaultLocaleAction } from "./actions";

type LanguageListItem = {
  builtIn: boolean;
  code: string;
  completion: number;
  fallbackName: string | null;
  name: string;
  nativeName: string;
  status: LocaleStatus;
  usage: number;
};

const filters = ["all", "draft", "active", "archived"] as const;
type Filter = (typeof filters)[number];

export function LanguagesList({
  initialDefaultLocale,
  languages,
}: {
  initialDefaultLocale: string;
  languages: LanguageListItem[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [defaultLocale, setDefaultLocale] = useState(initialDefaultLocale);
  const [pendingLocale, setPendingLocale] = useState<LanguageListItem | null>(null);
  const [pending, startTransition] = useTransition();
  const filtered = useMemo(
    () => filter === "all"
      ? languages
      : languages.filter((language) => language.status === filter),
    [filter, languages],
  );

  function confirmDefault() {
    if (!pendingLocale) return;
    startTransition(async () => {
      const result = await setInstanceDefaultLocaleAction(pendingLocale.code);
      if (result.errorKey) {
        toast.error(t(result.errorKey));
        return;
      }
      setDefaultLocale(result.defaultLocale ?? pendingLocale.code);
      setPendingLocale(null);
      toast.success(t("settings.languages.messages.defaultSaved"));
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-7 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-foreground">
              {t("settings.languages.title")}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t("settings.languages.description")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" effect="shine" className="gap-2">
              <Link href="/settings/languages/import-export">
                {t("settings.languages.actions.importExport")}
              </Link>
            </Button>
            <Button asChild variant="default" effect="shine" className="gap-2">
              <Link href="/settings/languages/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("settings.languages.actions.add")}
              </Link>
            </Button>
          </div>
        </div>

        <div
          className="flex gap-2 overflow-x-auto border-y border-border py-4"
          aria-label={t("settings.languages.filters.ariaLabel")}
        >
          {filters.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              effect="shine"
              variant={filter === item ? "default" : "secondary"}
              onClick={() => setFilter(item)}
            >
              {t(`settings.languages.filters.${item}`)}
            </Button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
            <Languages className="mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <h3 className="font-medium text-foreground">
              {t("settings.languages.empty.title")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("settings.languages.empty.description")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="hidden grid-cols-[minmax(170px,1.4fr)_100px_minmax(120px,1fr)_110px_90px_minmax(200px,auto)] gap-4 px-4 text-xs font-medium text-muted-foreground lg:grid">
              <span>{t("settings.languages.columns.language")}</span>
              <span>{t("settings.languages.columns.status")}</span>
              <span>{t("settings.languages.columns.fallback")}</span>
              <span>{t("settings.languages.columns.completion")}</span>
              <span>{t("settings.languages.columns.usage")}</span>
              <span className="text-right">{t("settings.languages.columns.actions")}</span>
            </div>
            {filtered.map((language) => {
              const isDefault = language.code === defaultLocale;
              return (
                <div
                  key={language.code}
                  className="grid gap-4 rounded-xl border border-border bg-card p-4 lg:grid-cols-[minmax(170px,1.4fr)_100px_minmax(120px,1fr)_110px_90px_minmax(200px,auto)] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">
                        {language.nativeName}
                      </span>
                      <Badge variant="secondary">{language.code}</Badge>
                      {language.builtIn && (
                        <Badge variant="outline">{t("settings.languages.badges.builtIn")}</Badge>
                      )}
                      {isDefault && (
                        <Badge variant="default">{t("settings.languages.badges.default")}</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{language.name}</p>
                  </div>
                  <div>
                    <Badge variant={language.status === "archived" ? "outline" : "secondary"}>
                      {t(`settings.languages.status.${language.status}`)}
                    </Badge>
                  </div>
                  <span className="text-sm text-foreground">
                    {language.fallbackName ?? t("settings.languages.values.none")}
                  </span>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-foreground">
                      {language.completion}%
                    </span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${language.completion}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-foreground">
                    {t("settings.languages.values.usage", { count: language.usage })}
                  </span>
                  <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                    {language.status === "active" && !isDefault && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        effect="shine"
                        className="gap-1.5"
                        onClick={() => setPendingLocale(language)}
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("settings.languages.actions.makeDefault")}
                      </Button>
                    )}
                    <Button asChild size="sm" variant="secondary" effect="shine" className="gap-1.5">
                      <Link href={`/settings/languages/${encodeURIComponent(language.code)}`}>
                        <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("settings.languages.actions.manage")}
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DestructiveConfirmation
          open={Boolean(pendingLocale)}
          onOpenChange={(open) => {
            if (!open) setPendingLocale(null);
          }}
          loading={pending}
          title={t("settings.languages.defaultDialog.title")}
          description={t("settings.languages.defaultDialog.description", {
            language: pendingLocale?.nativeName ?? "",
          })}
          cancelLabel={t("settings.languages.defaultDialog.cancel")}
          confirmLabel={t("settings.languages.defaultDialog.confirm")}
          onConfirm={confirmDefault}
        />
      </CardContent>
    </Card>
  );
}
