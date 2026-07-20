"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ImageIcon,
  Monitor,
  Moon,
  Palette,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
} from "poyraz-ui/atoms";
import { toast } from "poyraz-ui/molecules";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { applyColorMode } from "@/components/theme/color-mode-sync";
import { isColorMode, type ColorMode } from "@/lib/color-mode";
import {
  removeAppearanceAssetAction,
  saveAppearanceSettingsAction,
  saveColorModeAction,
} from "./actions";

type BrandingAsset = "darkLogo" | "favicon" | "lightLogo";
type AssetState = Record<BrandingAsset, string>;

type AppearanceSettingsFormProps = {
  initial: {
    colorMode: ColorMode;
    primaryColor: string;
    urls: AssetState;
    custom: Record<BrandingAsset, boolean>;
  };
};

const themeOptions = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const;

export function AppearanceSettingsForm({ initial }: AppearanceSettingsFormProps) {
  const t = useTranslations();
  const [colorMode, setColorMode] = useState(initial.colorMode);
  const [savingTheme, startThemeTransition] = useTransition();
  const [savingBrand, startBrandTransition] = useTransition();
  const [primaryColor, setPrimaryColor] = useState(initial.primaryColor);
  const [pendingUrls, setPendingUrls] = useState<AssetState>({
    lightLogo: "",
    darkLogo: "",
    favicon: "",
  });
  const objectUrls = useRef<Partial<AssetState>>({});

  useEffect(() => {
    const urls = objectUrls.current;
    return () => Object.values(urls).forEach((url) => url && URL.revokeObjectURL(url));
  }, []);

  function changeColorMode(value: string) {
    if (!isColorMode(value) || value === colorMode || savingTheme) return;
    const previous = colorMode;
    setColorMode(value);
    applyColorMode(value);
    startThemeTransition(async () => {
      const result = await saveColorModeAction(value);
      if (result.errorKey) {
        setColorMode(previous);
        applyColorMode(previous);
        toast.error(t(result.errorKey));
        return;
      }
      toast.success(t("settings.appearance.messages.themeSaved"));
    });
  }

  function selectAsset(asset: BrandingAsset, file?: File) {
    const previous = objectUrls.current[asset];
    if (previous) URL.revokeObjectURL(previous);
    const url = file ? URL.createObjectURL(file) : "";
    objectUrls.current[asset] = url || undefined;
    setPendingUrls((current) => ({ ...current, [asset]: url }));
  }

  function saveBranding(formData: FormData) {
    startBrandTransition(async () => {
      const result = await saveAppearanceSettingsAction(formData);
      if (result.errorKey) {
        toast.error(t(result.errorKey));
        return;
      }
      toast.success(t("settings.appearance.messages.brandSaved"));
      window.location.reload();
    });
  }

  function removeAsset(asset: BrandingAsset) {
    startBrandTransition(async () => {
      const result = await removeAppearanceAssetAction(asset);
      if (result.errorKey) {
        toast.error(t(result.errorKey));
        return;
      }
      toast.success(t("settings.appearance.messages.assetRemoved"));
      window.location.reload();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-foreground">
              {t("settings.appearance.theme.title")}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t("settings.appearance.theme.description")}
            </p>
          </div>
          <RadioGroup
            value={colorMode}
            onValueChange={changeColorMode}
            disabled={savingTheme}
            aria-label={t("settings.appearance.theme.ariaLabel")}
            className="grid gap-3 sm:grid-cols-3"
          >
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const selected = colorMode === option.value;
              return (
                <Label
                  key={option.value}
                  htmlFor={`color-mode-${option.value}`}
                  className={`flex min-h-36 cursor-pointer flex-col justify-between gap-5 rounded-md border p-4 ${
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <RadioGroupItem
                      id={`color-mode-${option.value}`}
                      value={option.value}
                      aria-label={t(`settings.appearance.theme.${option.value}.label`)}
                    />
                  </div>
                  <span className="space-y-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {t(`settings.appearance.theme.${option.value}.label`)}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {t(`settings.appearance.theme.${option.value}.description`)}
                    </span>
                  </span>
                </Label>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-8 p-6 sm:p-8">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-foreground">
              {t("settings.appearance.brand.title")}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t("settings.appearance.brand.description")}
            </p>
          </div>

          <form action={saveBranding} className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Palette className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {t("settings.appearance.color.title")}
              </div>
              <div className="flex max-w-sm items-center gap-3">
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(event) => setPrimaryColor(event.target.value.toUpperCase())}
                  aria-label={t("settings.appearance.color.picker")}
                  className="h-11 w-16 shrink-0 cursor-pointer p-1"
                />
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  value={primaryColor}
                  onChange={(event) => setPrimaryColor(event.target.value.toUpperCase())}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  maxLength={7}
                  required
                  className="font-mono uppercase"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("settings.appearance.color.help")}
              </p>
            </section>

            <section className="grid gap-5 border-t border-border pt-7 lg:grid-cols-2">
              <AssetField
                asset="lightLogo"
                title={t("settings.appearance.assets.lightLogo")}
                accept="image/png,image/jpeg,image/webp,image/gif"
                currentUrl={initial.urls.lightLogo}
                pendingUrl={pendingUrls.lightLogo}
                custom={initial.custom.lightLogo}
                tone="light"
                disabled={savingBrand}
                onSelect={selectAsset}
                onRemove={removeAsset}
                removeLabel={t("settings.appearance.actions.remove")}
                previewAlt={t("settings.appearance.assets.previewAlt", {
                  asset: t("settings.appearance.assets.lightLogo"),
                })}
              />
              <AssetField
                asset="darkLogo"
                title={t("settings.appearance.assets.darkLogo")}
                accept="image/png,image/jpeg,image/webp,image/gif"
                currentUrl={initial.urls.darkLogo}
                pendingUrl={pendingUrls.darkLogo}
                custom={initial.custom.darkLogo}
                tone="dark"
                disabled={savingBrand}
                onSelect={selectAsset}
                onRemove={removeAsset}
                removeLabel={t("settings.appearance.actions.remove")}
                previewAlt={t("settings.appearance.assets.previewAlt", {
                  asset: t("settings.appearance.assets.darkLogo"),
                })}
              />
            </section>

            <section className="border-t border-border pt-7">
              <AssetField
                asset="favicon"
                title={t("settings.appearance.assets.favicon")}
                description={t("settings.appearance.assets.faviconHelp")}
                accept="image/png"
                currentUrl={initial.urls.favicon}
                pendingUrl={pendingUrls.favicon}
                custom={initial.custom.favicon}
                tone="neutral"
                disabled={savingBrand}
                onSelect={selectAsset}
                onRemove={removeAsset}
                removeLabel={t("settings.appearance.actions.remove")}
                previewAlt={t("settings.appearance.assets.previewAlt", {
                  asset: t("settings.appearance.assets.favicon"),
                })}
              />
            </section>

            <div className="flex justify-end border-t border-border pt-6">
              <Button
                type="submit"
                variant="default"
                effect="shine"
                loading={savingBrand}
                className="gap-2"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                {t("settings.appearance.actions.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AssetField({
  asset,
  title,
  description,
  accept,
  currentUrl,
  pendingUrl,
  custom,
  tone,
  disabled,
  onSelect,
  onRemove,
  removeLabel,
  previewAlt,
}: {
  asset: BrandingAsset;
  title: string;
  description?: string;
  accept: string;
  currentUrl: string;
  pendingUrl: string;
  custom: boolean;
  tone: "dark" | "light" | "neutral";
  disabled: boolean;
  onSelect: (asset: BrandingAsset, file?: File) => void;
  onRemove: (asset: BrandingAsset) => void;
  removeLabel: string;
  previewAlt: string;
}) {
  const previewUrl = pendingUrl || (custom ? currentUrl : "");
  const toneClass = tone === "dark"
    ? "bg-neutral-950"
    : tone === "light"
      ? "bg-white"
      : "bg-muted/40";

  return (
    <div className="grid gap-4 rounded-md border border-border p-4">
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor={asset}>{title}</Label>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <Input
          id={asset}
          name={asset}
          type="file"
          accept={accept}
          onChange={(event) => onSelect(asset, event.target.files?.[0])}
          className="cursor-pointer"
        />
        {custom ? (
          <Button
            type="button"
            variant="secondary"
            effect="shine"
            size="sm"
            disabled={disabled}
            onClick={() => onRemove(asset)}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {removeLabel}
          </Button>
        ) : null}
      </div>
      <div className={`flex min-h-28 items-center justify-center overflow-hidden rounded-md border border-border p-4 ${toneClass}`}>
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={previewAlt}
            width={220}
            height={80}
            unoptimized
            className="max-h-20 w-auto max-w-full object-contain"
          />
        ) : (
          <ImageIcon
            className={`h-7 w-7 ${tone === "dark" ? "text-neutral-400" : "text-muted-foreground"}`}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
