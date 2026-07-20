"use client";

import { useState, useTransition } from "react";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { Button, Card, CardContent, Label, Input } from "poyraz-ui/atoms";
import { Alert, AlertDescription, toast } from "poyraz-ui/molecules";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { exportTranslationsAction, importTranslationsAction } from "./actions";

export function ImportExportForm() {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportTranslationsAction();
      if (result.package) {
        const blob = new Blob([JSON.stringify(result.package, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `neta-i18n-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Dışa aktarma başarılı.");
      }
    });
  };

  const handleImport = () => {
    if (!file) return;
    
    if (!window.confirm("Bu işlem mevcut çevirilerin üzerine yazabilir. Devam etmek istiyor musunuz?")) {
      return;
    }

    startTransition(async () => {
      try {
        const text = await file.text();
        const result = await importTranslationsAction(text);
        if (result.errorKey) {
          toast.error(t(result.errorKey) + (result.details ? ` (${result.details})` : ""));
        } else {
          toast.success("İçe aktarma başarılı.");
          setFile(null);
        }
      } catch (err) {
        toast.error("Dosya okunurken bir hata oluştu.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">İçe / Dışa Aktarma</h2>
        <p className="text-sm text-muted-foreground mt-1">Dil paketlerini ve çevirileri taşıyın veya yedekleyin.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Dışa Aktar</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Mevcut tüm dilleri, aktif çevirileri ve tercih edilen varsayılan dil bilgisini içeren bir JSON yedeği oluşturun.
            </p>
            <Button onClick={handleExport} loading={pending} effect="shine" className="w-full">
              Dışa Aktar (.json)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">İçe Aktar</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Daha önce Neta üzerinden dışa aktarılmış bir dil paketini içeri yükleyin.
            </p>
            
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Aynı dil koduna sahip çevirilerin üzerine yazılacaktır.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>JSON Dosyası Seç</Label>
              <Input 
                type="file" 
                accept=".json,application/json" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={pending}
              />
            </div>

            <Button 
              onClick={handleImport} 
              disabled={!file} 
              loading={pending} 
              effect="shine" 
              className="w-full"
            >
              İçe Aktar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
