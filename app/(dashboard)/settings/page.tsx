"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Blocks,
  Brain,
  Download,
  Globe2,
  ImageIcon,
  Key,
  Languages,
  Monitor,
  Moon,
  Palette,
  Save,
  Shield,
  Sun,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import {
  loadSettings,
  commitI18nImportAction,
  createLocaleAction,
  exportI18nAction,
  previewI18nImportAction,
  removeBrandingAsset,
  resetUiTranslationAction,
  saveAiSettings,
  saveColorMode,
  saveGeneralSettings,
  saveLanguagePreference,
  saveUiTranslationAction,
  setDefaultLocaleAction,
  updateLocaleStatusAction,
  updatePassword,
  updateProfile,
} from "./actions";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Textarea,
} from "poyraz-ui/atoms";
import { toast } from "poyraz-ui/molecules";
import { applyColorMode } from "@/components/theme/color-mode-sync";
import { LocalizedFields, type LocalizedFieldValues } from "@/components/i18n/localized-fields";
import { isColorMode, type ColorMode } from "@/lib/color-mode";
import { contentTranslationRegistry } from "@/lib/i18n/content";

type AiProvider = "groq" | "ollama" | "openai" | "gemini";
type BrandingAsset = "lightLogo" | "darkLogo" | "favicon";
type LocaleStatus = "draft" | "active" | "archived" | "test";
type LocaleRecord = {
  code: string;
  name: string;
  nativeName: string;
  status: LocaleStatus;
  fallbackLocale: string | null;
  textDirection: "ltr" | "rtl";
  builtIn: boolean;
  sortOrder: number;
};
type TranslationRow = { locale: string; namespace: string; key: string; value: string };
type ContentTranslationRow = { entityType: string; entityId: string; field: string; locale: string; value: string };
type ReferenceKey = {
  key: string;
  namespace: string;
  translationKey: string;
  tr: string;
  en: string;
  parityOk: boolean;
};
type TranslationCompletion = {
  locale: string;
  translated: number;
  total: number;
  percent: number;
  missingKeys: string[];
};

const colorModeOptions = [
  {
    value: "light",
    label: "Açık",
    description: "Her zaman aydınlık renk paletini kullanır.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Koyu",
    description: "Her zaman koyu renk paletini kullanır.",
    icon: Moon,
  },
  {
    value: "system",
    label: "Sistem",
    description: "Cihazınızın görünüm tercihini otomatik takip eder.",
    icon: Monitor,
  },
] satisfies Array<{
  value: ColorMode;
  label: string;
  description: string;
  icon: typeof Sun;
}>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Genel");

  // Profile States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // Security States
  const formRef = useRef<HTMLFormElement>(null);

  // AI States
  const [aiProvider, setAiProvider] = useState<AiProvider>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>("system");
  const [isSavingColorMode, setIsSavingColorMode] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("Neta");
  const [metaTitle, setMetaTitle] = useState("Neta");
  const [shortName, setShortName] = useState("Neta");
  const [primaryColor, setPrimaryColor] = useState("#C81E1E");
  const [assetUrls, setAssetUrls] = useState<Record<BrandingAsset, string>>({
    lightLogo: "",
    darkLogo: "",
    favicon: "",
  });
  const [pendingAssetUrls, setPendingAssetUrls] = useState<Record<BrandingAsset, string>>({
    lightLogo: "",
    darkLogo: "",
    favicon: "",
  });
  const [customAssets, setCustomAssets] = useState<Record<BrandingAsset, boolean>>({
    lightLogo: false,
    darkLogo: false,
    favicon: false,
  });
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [language, setLanguage] = useState("tr");
  const [locales, setLocales] = useState<LocaleRecord[]>([]);
  const [defaultLocale, setDefaultLocale] = useState("tr");
  const [catalogVersion, setCatalogVersion] = useState(1);
  const [translations, setTranslations] = useState<TranslationRow[]>([]);
  const [brandingContentTranslations, setBrandingContentTranslations] = useState<LocalizedFieldValues>({});
  const [referenceKeys, setReferenceKeys] = useState<ReferenceKey[]>([]);
  const [completion, setCompletion] = useState<TranslationCompletion[]>([]);
  const [newLocale, setNewLocale] = useState({
    code: "fr",
    name: "French",
    nativeName: "Français",
    fallbackLocale: "en",
    textDirection: "ltr" as "ltr" | "rtl",
  });
  const [selectedLocale, setSelectedLocale] = useState("fr");
  const [selectedNamespace, setSelectedNamespace] = useState("navigation");
  const [translationSearch, setTranslationSearch] = useState("");
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [importJson, setImportJson] = useState("");
  const [importPreview, setImportPreview] = useState("");
  const assetObjectUrlRefs = useRef<Partial<Record<BrandingAsset, string>>>({});

  const tabs = [
    { name: "Genel", icon: Palette },
    { name: "Diller ve çeviriler", icon: Languages },
    { name: "Profile & Account", icon: User },
    { name: "AI Preferences", icon: Brain },
    { name: "Security", icon: Shield },
  ];

  useEffect(() => {
    let isActive = true;

    const fetchData = async () => {
      const settings = await loadSettings();
      if (!isActive) return;
      setFirstName(settings.firstName);
      setLastName(settings.lastName);
      setAvatarUrl(settings.avatarUrl);
      setAiProvider(settings.aiProvider);
      setHasApiKey(settings.hasApiKey);
      setColorMode(settings.colorMode);
      setWorkspaceName(settings.workspaceName);
      setMetaTitle(settings.metaTitle);
      setShortName(settings.shortName);
      setPrimaryColor(settings.primaryColor);
      setAssetUrls({
        lightLogo: settings.lightLogoUrl,
        darkLogo: settings.darkLogoUrl,
        favicon: settings.faviconUrl,
      });
      setCustomAssets({
        lightLogo: settings.hasCustomLightLogo,
        darkLogo: settings.hasCustomDarkLogo,
        favicon: settings.hasCustomFavicon,
      });
      setLanguage(settings.language);
      setLocales(settings.i18n.locales);
      setDefaultLocale(settings.i18n.defaultLocale);
      setCatalogVersion(settings.i18n.catalogVersion);
      setTranslations(settings.i18n.translations);
      setReferenceKeys(settings.i18n.referenceKeys);
      setCompletion(settings.i18n.completion);
      setBrandingContentTranslations(toLocalizedValues(settings.contentTranslations.branding));
      setSelectedLocale(settings.i18n.locales.find((locale) => !locale.builtIn)?.code ?? "en");
    };

    void fetchData();
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    const objectUrls = assetObjectUrlRefs.current;
    return () => {
      for (const objectUrl of Object.values(objectUrls)) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  const handleProfileAction = async (formData: FormData) => {
    const response = await updateProfile(formData);
    if (response?.error) {
      toast.error(`Hata: ${response.error}`);
    } else {
      toast.success("Profil güncellendi!");
      const avatar = formData.get("avatar");
      if (avatar instanceof File && avatar.size > 0) window.location.reload();
    }
  };

  const handlePasswordAction = async (formData: FormData) => {
    const response = await updatePassword(formData);
    if (response?.error) {
      toast.error(`Hata: ${response.error}`);
    } else {
      toast.success("Şifre güncellendi!");
      formRef.current?.reset();
    }
  };

  const handleSaveAI = async () => {
    const response = await saveAiSettings(aiProvider, apiKey);
    if (response.error) {
      toast.error(response.error);
      return;
    }
    setHasApiKey(Boolean(response.hasApiKey));
    setApiKey("");
    toast.success("Yapay Zeka ayarları kaydedildi!");
  };

  const handleColorModeChange = async (value: string) => {
    if (!isColorMode(value) || value === colorMode || isSavingColorMode) return;

    const previousColorMode = colorMode;
    setColorMode(value);
    applyColorMode(value);
    setIsSavingColorMode(true);

    try {
      const response = await saveColorMode(value);
      if (response.error) {
        setColorMode(previousColorMode);
        applyColorMode(previousColorMode);
        toast.error(response.error);
        return;
      }

      toast.success("Görünüm tercihi kaydedildi.");
    } finally {
      setIsSavingColorMode(false);
    }
  };

  const handleBrandingAssetChange = (
    asset: BrandingAsset,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const previousObjectUrl = assetObjectUrlRefs.current[asset];
    if (previousObjectUrl) URL.revokeObjectURL(previousObjectUrl);
    const file = event.target.files?.[0];
    const objectUrl = file ? URL.createObjectURL(file) : "";
    assetObjectUrlRefs.current[asset] = objectUrl || undefined;
    setPendingAssetUrls((current) => ({ ...current, [asset]: objectUrl }));
  };

  const handleGeneralSettingsAction = async (formData: FormData) => {
    setIsSavingBranding(true);
    try {
      const response = await saveGeneralSettings(formData);
      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Genel görünüm ve marka ayarları güncellendi.");
      window.location.reload();
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleRemoveBrandingAsset = async (asset: BrandingAsset) => {
    setIsSavingBranding(true);
    try {
      const response = await removeBrandingAsset(asset);
      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Marka görseli kaldırıldı.");
      window.location.reload();
    } finally {
      setIsSavingBranding(false);
    }
  };

  const refreshI18nSettings = async () => {
    const settings = await loadSettings();
    setLanguage(settings.language);
    setLocales(settings.i18n.locales);
    setDefaultLocale(settings.i18n.defaultLocale);
    setCatalogVersion(settings.i18n.catalogVersion);
    setTranslations(settings.i18n.translations);
    setReferenceKeys(settings.i18n.referenceKeys);
    setCompletion(settings.i18n.completion);
  };

  const handleLanguagePreferenceChange = async (value: string) => {
    setLanguage(value);
    const response = await saveLanguagePreference(value);
    if (response.error) {
      toast.error(response.error);
      return;
    }
    toast.success("Arayüz dili kaydedildi.");
    window.location.reload();
  };

  const handleCreateLocale = async () => {
    const response = await createLocaleAction(newLocale);
    if (response.error) {
      toast.error(response.error);
      return;
    }
    toast.success("Dil eklendi.");
    setSelectedLocale(response.locale?.code ?? newLocale.code);
    await refreshI18nSettings();
  };

  const handleUpdateLocaleStatus = async (code: string, status: LocaleStatus) => {
    const response = await updateLocaleStatusAction(code, status);
    if (response.error) {
      toast.error(response.error);
      return;
    }
    toast.success("Dil durumu güncellendi.");
    await refreshI18nSettings();
  };

  const handleSetDefaultLocale = async (code: string) => {
    const response = await setDefaultLocaleAction(code);
    if (response.error) {
      toast.error(response.error);
      return;
    }
    toast.success("Varsayılan dil güncellendi.");
    await refreshI18nSettings();
  };

  const handleSaveTranslation = async (reference: ReferenceKey) => {
    const value = editingValues[reference.key] ?? getTranslationValue(translations, selectedLocale, reference);
    const response = await saveUiTranslationAction({
      locale: selectedLocale,
      namespace: reference.namespace,
      key: reference.translationKey,
      value,
    });
    if (response.error) {
      toast.error(response.error);
      return;
    }
    toast.success("Çeviri kaydedildi.");
    await refreshI18nSettings();
  };

  const handleResetTranslation = async (reference: ReferenceKey) => {
    const response = await resetUiTranslationAction({
      locale: selectedLocale,
      namespace: reference.namespace,
      key: reference.translationKey,
    });
    if (response.error) {
      toast.error(response.error);
      return;
    }
    toast.success("Override sıfırlandı.");
    setEditingValues((current) => ({ ...current, [reference.key]: "" }));
    await refreshI18nSettings();
  };

  const handleExportI18n = async () => {
    const response = await exportI18nAction();
    if (response.error || !response.package) {
      toast.error(response.error ?? "Export oluşturulamadı.");
      return;
    }
    setImportJson(JSON.stringify(response.package, null, 2));
    toast.success("Çeviri paketi aşağıdaki alana yazıldı.");
  };

  const handlePreviewImport = async () => {
    const response = await previewI18nImportAction(importJson);
    if (response.error || !response.preview) {
      setImportPreview("");
      toast.error(response.error ?? "Import paketi okunamadı.");
      return;
    }
    setImportPreview(`${response.preview.localeCount} dil, ${response.preview.translationCount} çeviri, default: ${response.preview.defaultLocale}`);
  };

  const handleCommitImport = async () => {
    const response = await commitI18nImportAction(importJson);
    if (response.error) {
      toast.error(response.error);
      return;
    }
    toast.success("Çeviri paketi içe aktarıldı.");
    setImportPreview("");
    await refreshI18nSettings();
  };

  const filteredReferenceKeys = referenceKeys.filter((reference) => {
    const namespaceMatches = selectedNamespace === "all" || reference.namespace === selectedNamespace;
    const query = translationSearch.trim().toLowerCase();
    const textMatches = !query || [reference.key, reference.tr, reference.en]
      .some((value) => value.toLowerCase().includes(query));
    return namespaceMatches && textMatches;
  });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">
            Ayarlar
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-8 pb-12 md:flex-row md:items-start">
        {/* Settings Sidebar */}
        <div className="tiny-scrollbar flex w-full shrink-0 gap-2 overflow-x-auto pb-2 md:sticky md:top-8 md:max-h-[calc(100vh-4rem)] md:w-64 md:self-start md:flex-col md:overflow-y-auto md:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button effect="shine"
                key={tab.name}
                type="button"
                variant={activeTab === tab.name ? "default" : "secondary"}
                onClick={() => setActiveTab(tab.name)}
                className="h-auto shrink-0 justify-start gap-3 px-4 py-3 text-left"
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </Button>
            )
          })}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1">
          {activeTab === "Genel" && (
            <Card className="animate-in fade-in duration-300">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-7 space-y-1.5">
                  <h2 className="text-xl font-bold text-foreground">Genel görünüm ve marka</h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Web ve mobil istemcilerde kullanılan workspace kimliğini, marka görsellerini ve tema tercihlerini yönetin.
                  </p>
                </div>

                <form action={handleGeneralSettingsAction} className="max-w-4xl space-y-8">
                  <section className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="workspaceName">Workspace adı</Label>
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
                          Firma, freelance marka veya çalışma alanı adınız.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="metaTitle">Tarayıcı başlığı</Label>
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
                          Sekme başlıklarında ve uygulama metadata bilgisinde kullanılır.
                        </p>
                      </div>
                    </div>

                    <div className="max-w-md space-y-2">
                      <Label htmlFor="shortName">Kısa uygulama adı</Label>
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
                        Mobil uygulama ve ana ekrana ekleme alanlarında kullanılan kısa ad.
                      </p>
                    </div>
                  </section>

                  <section className="border-t border-border pt-7">
                    <div className="grid gap-5 md:grid-cols-2">
                      <BrandingAssetField
                        asset="lightLogo"
                        inputId="lightLogo"
                        name="lightLogo"
                        title="Light logo"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        currentUrl={assetUrls.lightLogo}
                        pendingUrl={pendingAssetUrls.lightLogo}
                        hasCustomAsset={customAssets.lightLogo}
                        previewTone="light"
                        disabled={isSavingBranding}
                        onChange={handleBrandingAssetChange}
                        onRemove={handleRemoveBrandingAsset}
                      />
                      <BrandingAssetField
                        asset="darkLogo"
                        inputId="darkLogo"
                        name="darkLogo"
                        title="Dark logo"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        currentUrl={assetUrls.darkLogo}
                        pendingUrl={pendingAssetUrls.darkLogo}
                        hasCustomAsset={customAssets.darkLogo}
                        previewTone="dark"
                        disabled={isSavingBranding}
                        onChange={handleBrandingAssetChange}
                        onRemove={handleRemoveBrandingAsset}
                      />
                    </div>
                  </section>

                  <section className="space-y-4 border-t border-border pt-7">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-foreground">Tarayıcı ikonu</h3>
                      <p className="text-xs text-muted-foreground">
                        Favicon, web manifest ve mobil instance metadata alanlarında kullanılır.
                      </p>
                    </div>
                    <BrandingAssetField
                      asset="favicon"
                      inputId="favicon"
                      name="favicon"
                      title="Favicon"
                      description="Kare PNG önerilir; en fazla 5 MB."
                      accept="image/png"
                      currentUrl={assetUrls.favicon}
                      pendingUrl={pendingAssetUrls.favicon}
                      hasCustomAsset={customAssets.favicon}
                      previewTone="neutral"
                      compact
                      disabled={isSavingBranding}
                      onChange={handleBrandingAssetChange}
                      onRemove={handleRemoveBrandingAsset}
                    />
                  </section>

                  <section className="space-y-4 border-t border-border pt-7">
                    <div className="space-y-1">
                      <Label htmlFor="primaryColor">Ana renk</Label>
                      <p className="text-xs text-muted-foreground">
                        Bir renk seçin; vurgu, focus ve yumuşak yüzey tonları otomatik türetilir.
                      </p>
                    </div>

                    <div className="flex max-w-sm items-center gap-3">
                      <Input
                        type="color"
                        value={primaryColor}
                        onChange={(event) => setPrimaryColor(event.target.value.toUpperCase())}
                        aria-label="Ana renk seçici"
                        className="h-11 w-16 shrink-0 cursor-pointer p-1"
                      />
                      <Input
                        id="primaryColor"
                        name="primaryColor"
                        value={primaryColor}
                        onChange={(event) => setPrimaryColor(event.target.value.toUpperCase())}
                        pattern="^#[0-9A-Fa-f]{6}$"
                        maxLength={7}
                        placeholder="#C81E1E"
                        required
                        className="font-mono uppercase"
                      />
                      <span
                        className="h-10 w-10 shrink-0 rounded-md border border-border"
                        style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(primaryColor) ? primaryColor : "transparent" }}
                        aria-hidden="true"
                      />
                    </div>
                  </section>

                  <section className="space-y-4 border-t border-border pt-7">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-foreground">Portal metinleri</h3>
                      <p className="text-xs text-muted-foreground">
                        Müşteri portalında kullanılacak karşılama ve footer metinlerini aktif dillere göre girin.
                      </p>
                    </div>
                    <LocalizedFields
                      idPrefix="branding-content"
                      defaultLocale={defaultLocale}
                      locales={locales.filter((locale) => locale.status !== "archived")}
                      fields={contentTranslationRegistry.branding}
                      values={brandingContentTranslations}
                    />
                  </section>

                  <div className="flex items-center gap-3 border-t border-border pt-6">
                    <Button variant="default" effect="shine" type="submit" loading={isSavingBranding} className="gap-2">
                      <Upload className="h-4 w-4" aria-hidden="true" />
                      Genel ayarları kaydet
                    </Button>
                  </div>
                </form>

                <section className="mt-10 space-y-5 border-t border-border pt-8">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-foreground">Tema görünümü</h3>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                      Arayüzün açık, koyu veya cihazınızla uyumlu görünmesini seçin.
                    </p>
                  </div>

                  <RadioGroup
                    value={colorMode}
                    onValueChange={handleColorModeChange}
                    disabled={isSavingColorMode}
                    aria-label="Tema görünümü"
                    className="grid max-w-3xl gap-3 sm:grid-cols-3"
                  >
                    {colorModeOptions.map((option) => {
                      const Icon = option.icon;
                      const selected = colorMode === option.value;

                      return (
                        <Label
                          key={option.value}
                          htmlFor={`color-mode-${option.value}`}
                          className={`relative flex min-h-40 cursor-pointer flex-col justify-between gap-5 rounded-md border p-4 transition-[color,background-color,border-color,box-shadow] ${
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
                          } ${isSavingColorMode ? "cursor-wait opacity-70" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span
                              className={`flex h-10 w-10 items-center justify-center rounded-md border ${
                                selected
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : "border-border bg-muted text-muted-foreground"
                              }`}
                            >
                              <Icon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <RadioGroupItem
                              id={`color-mode-${option.value}`}
                              value={option.value}
                              aria-label={option.label}
                            />
                          </div>
                          <span className="space-y-1">
                            <span className="block text-sm font-semibold text-foreground">
                              {option.label}
                            </span>
                            <span className="block text-xs font-normal leading-relaxed text-muted-foreground">
                              {option.description}
                            </span>
                          </span>
                        </Label>
                      );
                    })}
                  </RadioGroup>

                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    {isSavingColorMode
                      ? "Görünüm tercihi kaydediliyor…"
                      : "Değişiklik tüm sayfalara anında uygulanır."}
                  </p>
                </section>
              </CardContent>
            </Card>
          )}

          {activeTab === "Diller ve çeviriler" && (
            <Card className="animate-in fade-in duration-300">
              <CardContent className="space-y-8 p-6 sm:p-8">
                <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-foreground">Diller ve çeviriler</h2>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                      Instance dillerini, kişisel arayüz dilini ve katalog override metinlerini yönetin.
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    Catalog v{catalogVersion}
                  </div>
                </div>

                <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">Aktif diller</h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {locales.map((locale) => {
                        const localeCompletion = completion.find((item) => item.locale === locale.code);
                        return (
                          <div key={locale.code} className="rounded-md border border-border bg-card p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">{locale.nativeName}</span>
                                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{locale.code}</span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {locale.name} · {locale.status} · fallback: {locale.fallbackLocale ?? "-"}
                                </p>
                              </div>
                              {locale.builtIn ? (
                                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">Built-in</span>
                              ) : null}
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${localeCompletion?.percent ?? 0}%` }}
                              />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{localeCompletion?.percent ?? 0}% tamamlandı</span>
                              <span>{localeCompletion?.translated ?? 0}/{localeCompletion?.total ?? 0}</span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button effect="shine" type="button" size="sm" variant="secondary" onClick={() => setSelectedLocale(locale.code)}>
                                Düzenle
                              </Button>
                              {locale.status !== "active" ? (
                                <Button effect="shine" type="button" size="sm" variant="secondary" onClick={() => handleUpdateLocaleStatus(locale.code, "active")}>
                                  Aktifleştir
                                </Button>
                              ) : null}
                              {locale.status === "active" ? (
                                <Button effect="shine" type="button" size="sm" variant="secondary" onClick={() => handleSetDefaultLocale(locale.code)} disabled={defaultLocale === locale.code}>
                                  {defaultLocale === locale.code ? "Varsayılan" : "Default yap"}
                                </Button>
                              ) : null}
                              {!locale.builtIn && locale.status !== "archived" ? (
                                <Button effect="shine" type="button" size="sm" variant="secondary" onClick={() => handleUpdateLocaleStatus(locale.code, "archived")}>
                                  Arşivle
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4 rounded-md border border-border bg-muted/20 p-4">
                    <h3 className="text-sm font-semibold text-foreground">Yeni dil ekle</h3>
                    <div className="grid gap-3">
                      <Input value={newLocale.code} onChange={(event) => setNewLocale((current) => ({ ...current, code: event.target.value }))} placeholder="fr" />
                      <Input value={newLocale.name} onChange={(event) => setNewLocale((current) => ({ ...current, name: event.target.value }))} placeholder="French" />
                      <Input value={newLocale.nativeName} onChange={(event) => setNewLocale((current) => ({ ...current, nativeName: event.target.value }))} placeholder="Français" />
                      <select
                        value={newLocale.fallbackLocale}
                        onChange={(event) => setNewLocale((current) => ({ ...current, fallbackLocale: event.target.value }))}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                      >
                        {locales.filter((locale) => locale.status !== "archived").map((locale) => (
                          <option key={locale.code} value={locale.code}>{locale.nativeName}</option>
                        ))}
                      </select>
                      <select
                        value={newLocale.textDirection}
                        onChange={(event) => setNewLocale((current) => ({ ...current, textDirection: event.target.value as "ltr" | "rtl" }))}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                      >
                        <option value="ltr">LTR</option>
                        <option value="rtl">RTL</option>
                      </select>
                      <Button effect="shine" type="button" variant="default" className="gap-2" onClick={handleCreateLocale}>
                        <Languages className="h-4 w-4" />
                        Dili ekle
                      </Button>
                    </div>
                  </div>
                </section>

                <section className="grid gap-5 border-t border-border pt-7 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Kişisel arayüz dili</Label>
                    <select
                      value={language}
                      onChange={(event) => handleLanguagePreferenceChange(event.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                    >
                      {locales.filter((locale) => locale.status === "active").map((locale) => (
                        <option key={locale.code} value={locale.code}>{locale.nativeName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Çeviri hedef dili</Label>
                    <select
                      value={selectedLocale}
                      onChange={(event) => setSelectedLocale(event.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                    >
                      {locales.filter((locale) => locale.status !== "archived").map((locale) => (
                        <option key={locale.code} value={locale.code}>{locale.nativeName}</option>
                      ))}
                    </select>
                  </div>
                </section>

                <section className="space-y-4 border-t border-border pt-7">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <div className="space-y-2 lg:w-56">
                      <Label>Namespace</Label>
                      <select
                        value={selectedNamespace}
                        onChange={(event) => setSelectedNamespace(event.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                      >
                        <option value="all">Tümü</option>
                        {[...new Set(referenceKeys.map((reference) => reference.namespace))].map((namespace) => (
                          <option key={namespace} value={namespace}>{namespace}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Eksik anahtar veya metin ara</Label>
                      <Input value={translationSearch} onChange={(event) => setTranslationSearch(event.target.value)} placeholder="navigation.projects" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredReferenceKeys.slice(0, 60).map((reference) => {
                      const currentValue = getTranslationValue(translations, selectedLocale, reference);
                      const draftValue = editingValues[reference.key] ?? currentValue;
                      const isMissing = !currentValue;
                      return (
                        <div key={reference.key} className="grid gap-3 rounded-md border border-border p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <code className="rounded-md bg-muted px-2 py-1 text-xs">{reference.key}</code>
                              {isMissing ? <span className="rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">Eksik</span> : null}
                            </div>
                            <p className="text-sm text-muted-foreground">TR: {reference.tr}</p>
                            <p className="text-sm text-muted-foreground">EN: {reference.en}</p>
                          </div>
                          <div className="space-y-2">
                            <Textarea
                              value={draftValue}
                              onChange={(event) => setEditingValues((current) => ({ ...current, [reference.key]: event.target.value }))}
                              rows={3}
                              placeholder={reference.en || reference.tr}
                            />
                            <div className="flex gap-2">
                              <Button effect="shine" type="button" size="sm" variant="default" onClick={() => handleSaveTranslation(reference)}>
                                Kaydet
                              </Button>
                              <Button effect="shine" type="button" size="sm" variant="secondary" onClick={() => handleResetTranslation(reference)}>
                                Override sıfırla
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-4 border-t border-border pt-7">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-semibold text-foreground">JSON import / export</h3>
                    <Button effect="shine" type="button" variant="secondary" className="gap-2" onClick={handleExportI18n}>
                      <Download className="h-4 w-4" />
                      Export oluştur
                    </Button>
                  </div>
                  <Textarea
                    value={importJson}
                    onChange={(event) => setImportJson(event.target.value)}
                    rows={8}
                    className="font-mono text-xs"
                    placeholder='{"format":"neta-i18n","version":1,...}'
                  />
                  {importPreview ? <p className="text-sm text-muted-foreground">{importPreview}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <Button effect="shine" type="button" variant="secondary" onClick={handlePreviewImport}>Preview</Button>
                    <Button effect="shine" type="button" variant="default" onClick={handleCommitImport}>Import et</Button>
                  </div>
                </section>
              </CardContent>
            </Card>
          )}

          {activeTab === "Profile & Account" && (
            <Card className="animate-in fade-in duration-300">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-6 text-foreground">Kullanıcı Profili</h2>
                <form action={handleProfileAction} className="space-y-6 max-w-xl">
                  <div className="flex items-center gap-4 mb-6">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Avatar"
                        width={64}
                        height={64}
                        unoptimized
                        className="h-16 w-16 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/50">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="avatar">Profil Fotoğrafı</Label>
                      <Input id="avatar" name="avatar" type="file" accept="image/*" className="cursor-pointer" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Ad</Label>
                      <Input id="firstName" name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Soyad</Label>
                      <Input id="lastName" name="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <Button variant="default" effect="shine" type="submit" className="gap-2">
                      <Save className="h-4 w-4" /> Profili Kaydet
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "Security" && (
            <Card className="animate-in fade-in duration-300">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-6 text-foreground">Şifre İşlemleri</h2>
                <form ref={formRef} action={handlePasswordAction} className="space-y-6 max-w-xl">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                    <Input id="currentPassword" name="currentPassword" type="password" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Yeni Şifre</Label>
                    <Input id="password" name="password" type="password" minLength={8} placeholder="En az 8 karakter" required />
                  </div>
                  <div className="flex items-center gap-4 pt-4">
                    <Button variant="default" effect="shine" type="submit" className="gap-2">
                      <Save className="h-4 w-4" /> Şifreyi Güncelle
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "AI Preferences" && (
            <Card className="animate-in fade-in duration-300">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-6 text-foreground">AI Asistan Konfigürasyonu</h2>
                
                <div className="space-y-8 max-w-2xl">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold border-b border-border pb-2">Model ve Sağlayıcı Seçimi</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label onClick={() => setAiProvider("gemini")} className={`flex flex-col p-4 rounded-xl cursor-pointer relative overflow-hidden transition-all ${aiProvider === "gemini" ? "border-2 border-primary bg-primary/5" : "border border-border bg-card hover:border-primary/50"}`}>
                        {aiProvider === "gemini" && <div className="absolute top-3 right-3"><div className="w-2.5 h-2.5 rounded-full bg-primary"></div></div>}
                        <span className="font-semibold text-foreground mb-1">Google Gemini</span>
                        <span className="text-xs text-muted-foreground leading-relaxed">Gelişmiş akıl yürütme. (Varsayılan)</span>
                      </label>
                      <label onClick={() => setAiProvider("openai")} className={`flex flex-col p-4 rounded-xl cursor-pointer relative overflow-hidden transition-all ${aiProvider === "openai" ? "border-2 border-primary bg-primary/5" : "border border-border bg-card hover:border-primary/50"}`}>
                        {aiProvider === "openai" && <div className="absolute top-3 right-3"><div className="w-2.5 h-2.5 rounded-full bg-primary"></div></div>}
                        <span className="font-semibold text-foreground mb-1">OpenAI (GPT)</span>
                        <span className="text-xs text-muted-foreground leading-relaxed">GPT-4o veya GPT-4.</span>
                      </label>
                      <label onClick={() => setAiProvider("groq")} className={`flex flex-col p-4 rounded-xl cursor-pointer relative overflow-hidden transition-all ${aiProvider === "groq" ? "border-2 border-primary bg-primary/5" : "border border-border bg-card hover:border-primary/50"}`}>
                        {aiProvider === "groq" && <div className="absolute top-3 right-3"><div className="w-2.5 h-2.5 rounded-full bg-primary"></div></div>}
                        <span className="font-semibold text-foreground mb-1">Groq (Llama 3)</span>
                        <span className="text-xs text-muted-foreground leading-relaxed">Yüksek hızlı bulut çıkarımı.</span>
                      </label>
                      <label onClick={() => setAiProvider("ollama")} className={`flex flex-col p-4 rounded-xl cursor-pointer relative overflow-hidden transition-all ${aiProvider === "ollama" ? "border-2 border-primary bg-primary/5" : "border border-border bg-card hover:border-primary/50"}`}>
                        {aiProvider === "ollama" && <div className="absolute top-3 right-3"><div className="w-2.5 h-2.5 rounded-full bg-primary"></div></div>}
                        <span className="font-semibold text-foreground mb-1">Ollama (Yerel)</span>
                        <span className="text-xs text-muted-foreground leading-relaxed">Gizlilik odaklı yerel modeller.</span>
                      </label>
                    </div>
                  </div>

                  {aiProvider !== "ollama" && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold border-b border-border pb-2">API Keys</h3>
                      <div className="bg-muted/30 border border-border rounded-xl p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm font-medium">{aiProvider.toUpperCase()} API Key</Label>
                        </div>
                        <Input 
                          type="password" 
                          value={apiKey} 
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={hasApiKey ? "Kayıtlı anahtarı korumak için boş bırakın" : "sk-..."}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-4">
                    <Button variant="default" effect="shine" onClick={handleSaveAI} className="gap-2">
                      <Save className="h-4 w-4" /> Ayarları Kaydet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {["Integrations", "Notifications", "Billing & Plans"].includes(activeTab) && (
            <Card className="animate-in fade-in duration-300">
              <CardContent className="flex flex-col items-center justify-center h-[400px] opacity-60">
                <Blocks className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-lg font-bold mb-2 text-foreground">{activeTab}</h2>
                <p className="text-sm text-center text-muted-foreground">Bu bölüm şu an geliştirme aşamasındadır.</p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

type BrandingAssetFieldProps = {
  asset: BrandingAsset;
  inputId: string;
  name: string;
  title: string;
  description?: string;
  accept: string;
  currentUrl: string;
  pendingUrl: string;
  hasCustomAsset: boolean;
  previewTone: "light" | "dark" | "neutral";
  compact?: boolean;
  disabled: boolean;
  onChange: (asset: BrandingAsset, event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (asset: BrandingAsset) => void;
};

function BrandingAssetField({
  asset,
  inputId,
  name,
  title,
  description,
  accept,
  currentUrl,
  pendingUrl,
  hasCustomAsset,
  previewTone,
  compact = false,
  disabled,
  onChange,
  onRemove,
}: BrandingAssetFieldProps) {
  const previewUrl = pendingUrl || (hasCustomAsset ? currentUrl : "");
  const previewClassName = {
    light: "bg-white",
    dark: "bg-neutral-950",
    neutral: "bg-muted/40",
  }[previewTone];

  return (
    <div className={`grid gap-4 rounded-md border border-border p-4 ${compact ? "max-w-2xl sm:grid-cols-[minmax(0,1fr)_160px]" : ""}`}>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor={inputId}>{title}</Label>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <Input
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          onChange={(event) => onChange(asset, event)}
          className="cursor-pointer"
        />
        {hasCustomAsset ? (
          <Button effect="shine"
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => onRemove(asset)}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Kaldır
          </Button>
        ) : null}
      </div>

      <div className={`flex min-h-28 items-center justify-center overflow-hidden rounded-md border border-border p-4 ${previewClassName}`}>
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={`${title} önizlemesi`}
            width={compact ? 72 : 220}
            height={compact ? 72 : 80}
            unoptimized
            className={compact ? "h-16 w-16 object-contain" : "max-h-20 w-auto max-w-full object-contain"}
          />
        ) : (
          <div className={previewTone === "dark" ? "text-neutral-400" : "text-muted-foreground"}>
            <ImageIcon className="h-7 w-7" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

function getTranslationValue(
  translations: TranslationRow[],
  locale: string,
  reference: ReferenceKey,
): string {
  return translations.find(
    (translation) =>
      translation.locale === locale &&
      translation.namespace === reference.namespace &&
      translation.key === reference.translationKey,
  )?.value ?? "";
}

function toLocalizedValues(rows: ContentTranslationRow[]) {
  return rows.reduce<Record<string, Record<string, string>>>((result, row) => {
    result[row.locale] = result[row.locale] ?? {};
    result[row.locale][row.field] = row.value;
    return result;
  }, {});
}
