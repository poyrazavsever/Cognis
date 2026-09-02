"use client";

import { useState, useTransition } from "react";
import { Bot, Check, KeyRound, Save } from "lucide-react";
import { Badge, Button, Card, CardContent, Input, Label, RadioGroup, RadioGroupItem } from "poyraz-ui/atoms";
import { Alert, AlertDescription, AlertTitle, toast } from "poyraz-ui/molecules";
import { useTranslations } from "@/components/i18n/i18n-provider";
import type { AiProvider } from "@/server/db/schema/settings";
import { saveAiSettingsAction } from "./actions";

const providers: AiProvider[] = ["gemini", "openai", "groq", "ollama"];

export function AiSettingsForm({
  initial,
}: {
  initial: {
    provider: AiProvider;
    model: string | null;
    hasApiKey: boolean;
  };
}) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [provider, setProvider] = useState<AiProvider>(initial.provider);
  const [savedProvider, setSavedProvider] = useState<AiProvider>(initial.provider);
  const [model, setModel] = useState(initial.model ?? "");
  const [hasApiKey, setHasApiKey] = useState(initial.hasApiKey);
  const providerHasApiKey = hasApiKey && provider === savedProvider;

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveAiSettingsAction(formData);
      if (result.errorKey) {
        toast.error(t(result.errorKey));
        return;
      }
      setHasApiKey(Boolean(result.hasApiKey));
      setSavedProvider(provider);
      toast.success(t("settings.ai.messages.saved"));
    });
  }

  return (
    <Card>
      <CardContent className="space-y-8 p-6 sm:p-8">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-foreground">
            {t("settings.ai.title")}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t("settings.ai.description")}
          </p>
        </div>

        <form action={submit} className="space-y-8">
          <section className="space-y-4">
            <div>
              <h3 className="font-medium text-foreground">
                {t("settings.ai.provider.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.ai.provider.description")}
              </p>
            </div>
            <RadioGroup
              name="provider"
              value={provider}
              onValueChange={(value) => {
                setProvider(value as AiProvider);
                setModel("");
              }}
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              aria-label={t("settings.ai.provider.ariaLabel")}
            >
              {providers.map((option) => (
                <Label
                  key={option}
                  htmlFor={`provider-${option}`}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                >
                  <RadioGroupItem
                    id={`provider-${option}`}
                    value={option}
                    className="mt-0.5"
                  />
                  <span className="space-y-1">
                    <span className="block font-medium text-foreground">
                      {t(`settings.ai.providers.${option}.name`)}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {t(`settings.ai.providers.${option}.description`)}
                    </span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </section>

          <section className="grid gap-6 border-t border-border pt-8 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="model">{t("settings.ai.fields.model")}</Label>
              <Input
                id="model"
                name="model"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                maxLength={200}
                placeholder={t(`settings.ai.providers.${provider}.defaultModel`)}
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.ai.help.model")}
              </p>
            </div>

            {provider === "ollama" ? (
              <Alert>
                <Bot className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>{t("settings.ai.ollama.title")}</AlertTitle>
                <AlertDescription>
                  {t("settings.ai.ollama.description")}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="apiKey">{t("settings.ai.fields.apiKey")}</Label>
                  {providerHasApiKey && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" aria-hidden="true" />
                      {t("settings.ai.apiKey.configured")}
                    </Badge>
                  )}
                </div>
                <Input
                  id="apiKey"
                  name="apiKey"
                  type="password"
                  autoComplete="new-password"
                  maxLength={4_096}
                  placeholder={providerHasApiKey
                    ? t("settings.ai.apiKey.masked")
                    : t("settings.ai.apiKey.placeholder")}
                />
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                  {providerHasApiKey
                    ? t("settings.ai.help.apiKeyExisting")
                    : t("settings.ai.help.apiKeyNew")}
                </p>
              </div>
            )}
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
              {t("settings.ai.actions.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
