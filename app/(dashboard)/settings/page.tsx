"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Blocks,
  Brain,
  ImageIcon,
  Key,
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
  removeBrandingAsset,
  saveAiSettings,
  saveColorMode,
  saveGeneralSettings,
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
} from "poyraz-ui/atoms";
import { toast } from "poyraz-ui/molecules";
import { applyColorMode } from "@/components/theme/color-mode-sync";
import { isColorMode, type ColorMode } from "@/lib/color-mode";

type AiProvider = "groq" | "ollama" | "openai" | "gemini";
type BrandingAsset = "lightLogo" | "darkLogo" | "favicon";

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
  const assetObjectUrlRefs = useRef<Partial<Record<BrandingAsset, string>>>({});

  const tabs = [
    { name: "Genel", icon: Palette },
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

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">
            Ayarlar
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Workspace markanızı, profilinizi, görünümü ve sistem tercihlerinizi yönetin.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8 pb-12 md:flex-row md:items-start">
        {/* Settings Sidebar */}
        <div className="tiny-scrollbar flex w-full shrink-0 gap-2 overflow-x-auto pb-2 md:sticky md:top-8 md:max-h-[calc(100vh-4rem)] md:w-64 md:self-start md:flex-col md:overflow-y-auto md:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex shrink-0 items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left ${
                  activeTab === tab.name 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
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

                  <div className="flex items-center gap-3 border-t border-border pt-6">
                    <Button type="submit" loading={isSavingBranding} className="gap-2">
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
                    <Button type="submit" className="gap-2">
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
                    <Button type="submit" className="gap-2">
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
                    <Button onClick={handleSaveAI} className="gap-2">
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
          <Button
            type="button"
            variant="ghost"
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
