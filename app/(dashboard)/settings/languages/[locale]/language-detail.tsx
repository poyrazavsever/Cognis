"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Languages, Save, ShieldCheck } from "lucide-react";
import { Badge, Button, Card, CardContent, Input, Label, RadioGroup, RadioGroupItem } from "poyraz-ui/atoms";
import { Alert, AlertDescription, AlertTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from "poyraz-ui/molecules";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { DestructiveConfirmation } from "@/components/system/destructive-confirmation";
import type { LocaleStatus, TextDirection } from "@/server/db/schema";
import type { LocaleReadiness, LocaleUsage, NamespaceCompletion } from "@/server/i18n/service";
import {
  activateLanguageAction,
  archiveLanguageAction,
  setDetailDefaultLocaleAction,
  updateLanguageMetadataAction,
} from "./actions";

type LocaleDetail = {
  builtIn: boolean;
  code: string;
  fallbackLocale: string | null;
  name: string;
  nativeName: string;
  status: LocaleStatus;
  textDirection: TextDirection;
};

type LifecycleAction = "activate" | "archive" | "default";

export function LanguageDetail({
  completion,
  defaultLocale,
  fallbackOptions,
  locale,
  namespaceCompletion,
  readiness,
  usage,
}: {
  completion: number;
  defaultLocale: string;
  fallbackOptions: Array<{ code: string; nativeName: string }>;
  locale: LocaleDetail;
  namespaceCompletion: NamespaceCompletion[];
  readiness: LocaleReadiness;
  usage: LocaleUsage;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [fallbackLocale, setFallbackLocale] = useState(locale.fallbackLocale ?? "");
  const [dialog, setDialog] = useState<LifecycleAction | null>(null);
  const [pending, startTransition] = useTransition();
  const isDefault = defaultLocale === locale.code;
  const criticalComplete = readiness.missingCriticalKeys.length === 0;

  function updateMetadata(formData: FormData) {
    formData.set("fallbackLocale", fallbackLocale);
    startTransition(async () => {
      const result = await updateLanguageMetadataAction(locale.code, formData);
      if (result.errorKey) {
        toast.error(t(result.errorKey));
        return;
      }
      toast.success(t("settings.languageDetail.messages.metadataSaved"));
      router.refresh();
    });
  }

  function confirmLifecycle() {
    if (!dialog) return;
    startTransition(async () => {
      const result = dialog === "activate"
        ? await activateLanguageAction(locale.code)
        : dialog === "default"
          ? await setDetailDefaultLocaleAction(locale.code)
          : await archiveLanguageAction(locale.code);
      if (result.errorKey) {
        toast.error(t(result.errorKey, {
          count: "missingCriticalCount" in result
            ? Number(
              result.missingCriticalCount
              ?? readiness.missingCriticalKeys.length,
            )
            : readiness.archiveReferences,
        }));
        return;
      }
      toast.success(t(`settings.languageDetail.messages.${dialog}`));
      setDialog(null);
      router.refresh();
    });
  }

  const dialogName = dialog ?? "activate";

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-7 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Button asChild size="icon-sm" variant="secondary" effect="shine">
                <Link href="/settings/languages" aria-label={t("settings.languageDetail.actions.back")}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-foreground">{locale.nativeName}</h2>
                  <Badge variant="secondary">{locale.code}</Badge>
                  <Badge variant="outline">
                    {t(`settings.languages.status.${locale.status}`)}
                  </Badge>
                  {locale.builtIn && (
                    <Badge variant="secondary">{t("settings.languages.badges.builtIn")}</Badge>
                  )}
                  {isDefault && (
                    <Badge variant="default">{t("settings.languages.badges.default")}</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{locale.name}</p>
              </div>
            </div>
            <Button asChild variant="secondary" effect="shine" className="gap-2">
              <Link href={`/settings/languages/${locale.code}/translations`}>
                <Languages className="h-4 w-4" aria-hidden="true" />
                {t("settings.languageDetail.actions.translations")}
              </Link>
            </Button>
          </div>

          {locale.builtIn ? (
            <Alert>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{t("settings.languageDetail.builtIn.title")}</AlertTitle>
              <AlertDescription>
                {t("settings.languageDetail.builtIn.description")}
              </AlertDescription>
            </Alert>
          ) : (
            <form action={updateMetadata} className="max-w-3xl space-y-6 border-t border-border pt-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="detail-name">{t("settings.languageDetail.fields.name")}</Label>
                  <Input id="detail-name" name="name" defaultValue={locale.name} maxLength={80} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detail-native-name">
                    {t("settings.languageDetail.fields.nativeName")}
                  </Label>
                  <Input
                    id="detail-native-name"
                    name="nativeName"
                    defaultValue={locale.nativeName}
                    maxLength={80}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("settings.languageDetail.fields.fallback")}</Label>
                  <Select value={fallbackLocale} onValueChange={setFallbackLocale}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fallbackOptions.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
                          {option.nativeName} ({option.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-foreground">
                    {t("settings.languageDetail.fields.direction")}
                  </legend>
                  <RadioGroup
                    name="textDirection"
                    defaultValue={locale.textDirection}
                    className="grid grid-cols-2 gap-2"
                  >
                    {(["ltr", "rtl"] as const).map((direction) => (
                      <Label
                        key={direction}
                        htmlFor={`detail-direction-${direction}`}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3"
                      >
                        <RadioGroupItem
                          id={`detail-direction-${direction}`}
                          value={direction}
                        />
                        {t(`settings.languageNew.direction.${direction}`)}
                      </Label>
                    ))}
                  </RadioGroup>
                </fieldset>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="default"
                  effect="shine"
                  loading={pending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {t("settings.languageDetail.actions.save")}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <h3 className="font-semibold text-foreground">
                {t("settings.languageDetail.readiness.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.languageDetail.readiness.description")}
              </p>
            </div>
            <ReadinessRow
              complete={criticalComplete}
              label={t("settings.languageDetail.readiness.critical", {
                count: readiness.missingCriticalKeys.length,
              })}
            />
            <ReadinessRow
              complete={locale.status === "active"}
              label={t("settings.languageDetail.readiness.active")}
            />
            <ReadinessRow
              complete={readiness.archiveReferences === 0}
              label={t("settings.languageDetail.readiness.references", {
                count: readiness.archiveReferences,
              })}
            />
            {!criticalComplete && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>{t("settings.languageDetail.readiness.blockedTitle")}</AlertTitle>
                <AlertDescription>
                  {t("settings.languageDetail.readiness.blockedDescription", {
                    count: readiness.missingCriticalKeys.length,
                  })}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap gap-2 border-t border-border pt-5">
              {locale.status !== "active" && (
                <Button
                  type="button"
                  variant="default"
                  effect="shine"
                  disabled={!readiness.canActivate}
                  onClick={() => setDialog("activate")}
                >
                  {t("settings.languageDetail.actions.activate")}
                </Button>
              )}
              {!isDefault && (
                <Button
                  type="button"
                  variant="secondary"
                  effect="shine"
                  disabled={!readiness.canSetDefault}
                  onClick={() => setDialog("default")}
                >
                  {t("settings.languageDetail.actions.makeDefault")}
                </Button>
              )}
              {!locale.builtIn && locale.status !== "archived" && (
                <Button
                  type="button"
                  variant="secondary"
                  effect="shine"
                  disabled={!readiness.canArchive}
                  onClick={() => setDialog("archive")}
                >
                  {t("settings.languageDetail.actions.archive")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <h3 className="font-semibold text-foreground">
                {t("settings.languageDetail.usage.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.languageDetail.usage.description")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(usage).map(([key, count]) => (
                <div key={key} className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    {t(`settings.languageDetail.usage.${key}`)}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card id="translation-completion" className="scroll-mt-8">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">
                {t("settings.languageDetail.completion.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.languageDetail.completion.description")}
              </p>
            </div>
            <span className="text-2xl font-semibold text-foreground">{completion}%</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {namespaceCompletion.map((item) => (
              <div key={item.namespace} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {t(`settings.languageDetail.namespaces.${item.namespace}`)}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.percent}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("settings.languageDetail.completion.value", {
                    translated: item.translated,
                    total: item.total,
                  })}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DestructiveConfirmation
        open={Boolean(dialog)}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        loading={pending}
        title={t(`settings.languageDetail.dialog.${dialogName}.title`)}
        description={t(`settings.languageDetail.dialog.${dialogName}.description`, {
          language: locale.nativeName,
        })}
        cancelLabel={t("settings.languageDetail.dialog.cancel")}
        confirmLabel={t(`settings.languageDetail.dialog.${dialogName}.confirm`)}
        onConfirm={confirmLifecycle}
      />
    </div>
  );
}

function ReadinessRow({
  complete,
  label,
}: {
  complete: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {complete ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
      )}
      <span className="text-foreground">{label}</span>
    </div>
  );
}
