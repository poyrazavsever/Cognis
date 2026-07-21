"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import { Button, Card, CardContent, Input, Label, Badge } from "poyraz-ui/atoms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from "poyraz-ui/molecules";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { upsertTranslationsAction } from "./actions";

type ReferenceKey = {
  key: string;
  namespace: string;
  translationKey: string;
  tr: string;
  en: string;
  parityOk: boolean;
};

type LocaleDetail = {
  code: string;
  name: string;
  nativeName: string;
};

export function TranslationEditor({
  locale,
  namespaces,
  referenceKeys,
  overrides,
}: {
  locale: LocaleDetail;
  namespaces: readonly string[];
  referenceKeys: ReferenceKey[];
  overrides: Record<string, string>;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [activeNamespace, setActiveNamespace] = useState<string>("common");
  const [filter, setFilter] = useState<"all" | "missing" | "dirty">("all");
  
  const [edits, setEdits] = useState<Record<string, string>>({});
  
  const isDirty = Object.keys(edits).length > 0;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleSave = () => {
    if (!isDirty) return;
    
    startTransition(async () => {
      const payload = Object.entries(edits).map(([fullKey, value]) => {
        const [namespace, ...rest] = fullKey.split(".");
        return {
          namespace,
          key: rest.join("."),
          value,
        };
      });
      
      const result = await upsertTranslationsAction(locale.code, payload);
      if (result.errorKey) {
        toast.error(t(result.errorKey));
      } else {
        toast.success("Çeviriler başarıyla kaydedildi.");
        setEdits({});
        router.refresh();
      }
    });
  };

  const handleReset = (fullKey: string) => {
    setEdits(prev => {
      const next = { ...prev };
      delete next[fullKey];
      return next;
    });
  };

  const filteredKeys = referenceKeys.filter(k => {
    if (k.namespace !== activeNamespace && activeNamespace !== "all") return false;
    
    const isEdited = edits[k.key] !== undefined;
    const value = isEdited ? edits[k.key] : (overrides[k.key] || "");
    const isMissing = value.trim() === "";

    if (filter === "missing" && !isMissing) return false;
    if (filter === "dirty" && !isEdited) return false;
    
    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      <Card>
        <CardContent className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button asChild size="icon-sm" variant="secondary" effect="shine">
              <Link href={`/settings/languages/${locale.code}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {locale.nativeName} Çevirileri
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="missing">Eksikler</SelectItem>
                <SelectItem value="dirty">Değişenler</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={activeNamespace} onValueChange={setActiveNamespace}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Modüller</SelectItem>
                {namespaces.map(ns => (
                  <SelectItem key={ns} value={ns}>{ns}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSave} disabled={!isDirty} loading={pending} effect="shine">
              <Save className="h-4 w-4 mr-2" />
              Kaydet {isDirty && `(${Object.keys(edits).length})`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredKeys.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Gösterilecek çeviri anahtarı bulunamadı.
            </CardContent>
          </Card>
        ) : (
          filteredKeys.map((item) => {
            const isEdited = edits[item.key] !== undefined;
            const currentValue = isEdited ? edits[item.key] : (overrides[item.key] || "");
            
            const trVars = item.tr.match(/\{[^}]+\}/g) || [];
            const targetVars: string[] = currentValue.match(/\{[^}]+\}/g) || [];
            const missingVars = trVars.filter(v => !targetVars.includes(v));

            return (
              <Card key={item.key} className={isEdited ? "border-primary" : ""}>
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center justify-between">
                    <Badge variant="outline" className="w-fit">{item.key}</Badge>
                    {isEdited && <Badge variant="default" className="w-fit">Değiştirildi</Badge>}
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <div>
                      <span className="font-semibold block mb-1">TR Referans:</span>
                      {item.tr}
                    </div>
                    <div>
                      <span className="font-semibold block mb-1">EN Referans:</span>
                      {item.en}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Hedef Metin ({locale.code})</Label>
                    <Input 
                      value={currentValue}
                      onChange={(e) => setEdits(prev => ({ ...prev, [item.key]: e.target.value }))}
                      className={missingVars.length > 0 ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    
                    {missingVars.length > 0 && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Eksik değişkenler: {missingVars.join(", ")}
                      </p>
                    )}
                    
                    {isEdited && (
                      <div className="flex justify-end">
                         <Button variant="ghost" size="sm" onClick={() => handleReset(item.key)} className="text-xs h-7">
                           Değişikliği İptal Et
                         </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border flex justify-end gap-3 z-50 sm:pl-64">
           <Button variant="secondary" onClick={() => setEdits({})} disabled={pending}>
             İptal
           </Button>
           <Button onClick={handleSave} loading={pending}>
             Değişiklikleri Kaydet ({Object.keys(edits).length})
           </Button>
        </div>
      )}
    </div>
  );
}
