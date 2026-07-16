"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Blocks, Brain, Key, Save, Shield, User } from "lucide-react";
import { loadSettings, saveAiSettings, updatePassword, updateProfile } from "./actions";
import { Button, Card, CardContent, Input, Label } from "poyraz-ui/atoms";
import { toast } from "poyraz-ui/molecules";

type AiProvider = "groq" | "ollama" | "openai" | "gemini";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("AI Preferences");

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

  const tabs = [
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
    };

    void fetchData();
    return () => { isActive = false; };
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

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-foreground">Settings</span> / {activeTab}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-foreground">
              Ayarlar
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Profilinizi, güvenlik ayarlarınızı ve yapay zeka tercihlerinizi yönetin.
            </p>
          </div>
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
