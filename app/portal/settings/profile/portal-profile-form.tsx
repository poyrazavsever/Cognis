"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Save, User } from "lucide-react";
import { Button, Card, CardContent, Input, Label } from "poyraz-ui/atoms";
import { toast } from "poyraz-ui/molecules";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { updatePortalProfileAction } from "./actions";

export function PortalProfileForm({
  initial,
}: {
  initial: {
    avatarUrl: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await updatePortalProfileAction(formData);
      if (result.errorKey) {
        toast.error(t(result.errorKey));
        return;
      }
      toast.success(t("settings.profile.messages.saved"));
      if (result.avatarChanged) {
        window.location.reload();
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-8 p-6 sm:p-8">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-foreground">
            {t("settings.portal.profile.title")}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t("settings.portal.profile.description")}
          </p>
        </div>

        <form action={submit} className="max-w-2xl space-y-7">
          <section className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {initial.avatarUrl ? (
              <Image
                src={initial.avatarUrl}
                alt={t("settings.profile.avatarAlt")}
                width={80}
                height={80}
                unoptimized
                className="h-20 w-20 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50">
                <User className="h-9 w-9 text-muted-foreground" aria-hidden="true" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Label htmlFor="avatar">{t("settings.profile.fields.avatar")}</Label>
              <Input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.profile.help.avatar")}
              </p>
            </div>
          </section>

          <section className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("settings.profile.fields.firstName")}</Label>
              <Input
                id="firstName"
                name="firstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("settings.profile.fields.lastName")}</Label>
              <Input
                id="lastName"
                name="lastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                maxLength={120}
                required
              />
            </div>
          </section>

          <div className="space-y-2">
            <Label htmlFor="portal-profile-email">{t("settings.profile.fields.email")}</Label>
            <Input id="portal-profile-email" value={initial.email} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              {t("settings.profile.help.email")}
            </p>
          </div>

          <div className="flex justify-end border-t border-border pt-6">
            <Button type="submit" variant="default" effect="shine" loading={pending} className="gap-2">
              <Save className="h-4 w-4" aria-hidden="true" />
              {t("settings.profile.actions.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
