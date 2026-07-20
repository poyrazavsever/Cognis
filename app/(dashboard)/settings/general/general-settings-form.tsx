"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Save, TextCursorInput } from "lucide-react";
import { Button, Card, CardContent, Input, Label } from "poyraz-ui/atoms";
import { toast } from "poyraz-ui/molecules";
import { useTranslations } from "@/components/i18n/i18n-provider";
import {
  LocalizedFields,
  type LocalizedFieldLocale,
  type LocalizedFieldValues,
} from "@/components/i18n/localized-fields";
import { contentTranslationRegistry } from "@/lib/i18n/content";
import { saveGeneralSettingsAction } from "./actions";

type GeneralSettingsFormProps = {
  defaultLocale: string;
  locales: LocalizedFieldLocale[];
  initial: {
    metaTitle: string;
    shortName: string;
    workspaceName: string;
    translations: LocalizedFieldValues;
  };
};

export function GeneralSettingsForm({
  defaultLocale,
  locales,
  initial,
}: GeneralSettingsFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [workspaceName, setWorkspaceName] = useState(initial.workspaceName);
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle);
  const [shortName, setShortName] = useState(initial.shortName);
  const localizedFields = useMemo(
    () => contentTranslationRegistry.branding.map((field) => ({
      ...field,
      label: field.name === "portalWelcome"
        ? t("settings.general.fields.portalWelcome")
        : t("settings.general.fields.portalFooter"),
      placeholder: field.name === "portalWelcome"
        ? t("settings.general.placeholders.portalWelcome")
        : t("settings.general.placeholders.portalFooter"),
    })),
    [t],
  );

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveGeneralSettingsAction(formData);
      if (result.errorKey) {
        toast.error(t(result.errorKey));
        return;
      }
      toast.success(t("settings.general.messages.saved"));
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-8 p-6 sm:p-8">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-foreground">
            {t("settings.general.title")}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t("settings.general.description")}
          </p>
        </div>

        <form action={submit} className="space-y-8">
          <section className="space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {t("settings.general.sections.identity")}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workspaceName">{t("settings.general.fields.workspaceName")}</Label>
                <Input
                  id="workspaceName"
                  name="workspaceName"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  minLength={1}
                  maxLength={120}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t("settings.general.help.workspaceName")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaTitle">{t("settings.general.fields.metaTitle")}</Label>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  value={metaTitle}
                  onChange={(event) => setMetaTitle(event.target.value)}
                  minLength={1}
                  maxLength={80}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t("settings.general.help.metaTitle")}
                </p>
              </div>
            </div>
            <div className="max-w-md space-y-2">
              <Label htmlFor="shortName">{t("settings.general.fields.shortName")}</Label>
              <Input
                id="shortName"
                name="shortName"
                value={shortName}
                onChange={(event) => setShortName(event.target.value)}
                minLength={1}
                maxLength={24}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.general.help.shortName")}
              </p>
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-7">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <TextCursorInput className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {t("settings.general.sections.portalContent")}
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t("settings.general.help.portalContent")}
            </p>
            <LocalizedFields
              idPrefix="branding-content"
              defaultLocale={defaultLocale}
              locales={locales}
              fields={localizedFields}
              values={initial.translations}
              labels={{
                defaultBadge: t("settings.localized.defaultBadge"),
                missingRequired: t("settings.localized.missingRequired"),
              }}
            />
          </section>

          <div className="flex justify-end border-t border-border pt-6">
            <Button
              type="submit"
              variant="default"
              effect="shine"
              loading={pending}
              className="gap-2"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {t("settings.general.actions.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
