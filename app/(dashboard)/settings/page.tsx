"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Blocks,
  Brain,
  Building2,
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
  removeWorkspaceLogo,
  saveAiSettings,
  saveColorMode,
  saveWorkspaceBranding,
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
  const [activeTab, setActiveTab] = useState("Workspace");

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
  const [primaryColor, setPrimaryColor] = useState("#C81E1E");
  const [logoUrl, setLogoUrl] = useState("");
  const [pendingLogoUrl, setPendingLogoUrl] = useState("");
  const [hasCustomLogo, setHasCustomLogo] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const logoObjectUrlRef = useRef<string | null>(null);

  const tabs = [
    { name: "Workspace", icon: Building2 },
    { name: "Profile & Account", icon: User },
    { name: "Görünüm", icon: Palette },
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
      setPrimaryColor(settings.primaryColor);
      setLogoUrl(settings.logoUrl);
      setHasCustomLogo(settings.hasCustomLogo);
    };

    void fetchData();
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    return () => {
      if (logoObjectUrlRef.current) URL.revokeObjectURL(logoObjectUrlRef.current);
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

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (logoObjectUrlRef.current) URL.revokeObjectURL(logoObjectUrlRef.current);
    const file = event.target.files?.[0];
    const objectUrl = file ? URL.createObjectURL(file) : "";
    logoObjectUrlRef.current = objectUrl || null;
    setPendingLogoUrl(objectUrl);
  };

  const handleWorkspaceBrandingAction = async (formData: FormData) => {
    setIsSavingBranding(true);
    try {
      const response = await saveWorkspaceBranding(formData);
      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Workspace görünümü güncellendi.");
      window.location.reload();
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleRemoveWorkspaceLogo = async () => {
    setIsSavingBranding(true);
    try {
      const response = await removeWorkspaceLogo();
      if (response.error) {
        toast.error(response.error);
        return;
      }

      setLogoUrl("");
      setPendingLogoUrl("");
      setHasCustomLogo(false);
      toast.success("Workspace logosu kaldırıldı.");
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

      <div className="flex flex-col md:flex-row gap-8 flex-1 min-h-0 pb-12">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 flex overflow-x-auto md:flex-col gap-2 shrink-0 pb-2 md:pb-0 tiny-scrollbar">
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
          {activeTab === "Workspace" && (
            <Card className="animate-in fade-in duration-300">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-7 space-y-1.5">
                  <h2 className="text-xl font-bold text-foreground">Workspace görünümü</h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Müşterilerinizin ve sizin gördüğünüz workspace adını, logoyu ve ana rengi yönetin.
                  </p>
                </div>

                <form action={handleWorkspaceBrandingAction} className="max-w-3xl space-y-8">
                  <section className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="workspaceName">Workspace adı</Label>
                      <p className="text-xs text-muted-foreground">
                        Firma, freelance marka veya çalışma alanı adınız.
                      </p>
                    </div>
                    <Input
                      id="workspaceName"
                      name="workspaceName"
                      value={workspaceName}
                      onChange={(event) => setWorkspaceName(event.target.value)}
                      minLength={1}
                      maxLength={80}
                      required
                    />
                  </section>

                  <section className="space-y-4 border-t border-border pt-7">
                    <div className="space-y-1">
                      <Label htmlFor="workspaceLogo">Workspace logosu</Label>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPEG, WebP veya GIF; en fazla 5 MB. Şeffaf arka planlı yatay logo önerilir.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
                      <div className="space-y-3">
                        <Input
                          id="workspaceLogo"
                          name="logo"
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={handleLogoChange}
                          className="cursor-pointer"
                        />
                        {hasCustomLogo ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSavingBranding}
                            onClick={handleRemoveWorkspaceLogo}
                            className="gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Logoyu kaldır
                          </Button>
                        ) : null}
                      </div>

                      <div className="flex min-h-28 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40 p-4">
                        {pendingLogoUrl || logoUrl ? (
                          <Image
                            src={pendingLogoUrl || logoUrl}
                            alt="Workspace logo önizlemesi"
                            width={220}
                            height={80}
                            unoptimized
                            className="max-h-20 w-auto max-w-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <ImageIcon className="h-7 w-7" aria-hidden="true" />
                            <span className="text-xs">Henüz özel logo yüklenmedi</span>
                          </div>
                        )}
                      </div>
                    </div>
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
                      Workspace görünümünü kaydet
                    </Button>
                  </div>
                </form>
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

          {activeTab === "Görünüm" && (
            <Card className="animate-in fade-in duration-300">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6 space-y-1.5">
                  <h2 className="text-xl font-bold text-foreground">Tema görünümü</h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Neta arayüzünün açık, koyu veya cihazınızla uyumlu görünmesini seçin.
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

                <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">
                  {isSavingColorMode
                    ? "Görünüm tercihi kaydediliyor…"
                    : "Değişiklik tüm Neta sayfalarına anında uygulanır."}
                </p>
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
