export type ContentTranslationFieldKind = "text" | "textarea";
export type ContentTranslationEntityType =
  | "branding"
  | "calendar_event"
  | "client"
  | "planning_section"
  | "project"
  | "task";

export type ContentTranslationField = {
  name: string;
  label: string;
  kind?: ContentTranslationFieldKind;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
};

export type ContentTranslationInput = Record<string, Record<string, string | null>>;

export const contentTranslationRegistry = {
  project: [
    { name: "name", label: "Proje adı", required: true, maxLength: 200, placeholder: "Örn. Marka web sitesi" },
    { name: "description", label: "Açıklama", kind: "textarea", maxLength: 20_000, placeholder: "Kapsam, hedef veya teslimat notları..." },
    { name: "coverImageAlt", label: "Görsel alt metni", maxLength: 500, placeholder: "Görseli kısaca açıkla" },
  ],
  planning_section: [
    { name: "title", label: "Başlık", required: true, maxLength: 300, placeholder: "Örn. Başarı kriterleri" },
    { name: "content", label: "İçerik", kind: "textarea", maxLength: 50_000, placeholder: "Kısa notlar, kriterler, renkler, tipografi kararları..." },
  ],
  task: [
    { name: "title", label: "Başlık", required: true, maxLength: 300, placeholder: "Örn. Ana sayfa wireframe revizyonu" },
    { name: "description", label: "Açıklama", kind: "textarea", maxLength: 20_000, placeholder: "Kapsam, not veya teslim kriterleri..." },
  ],
  branding: [
    { name: "portalWelcome", label: "Portal karşılama metni", kind: "textarea", maxLength: 2_000 },
    { name: "portalFooter", label: "Portal footer metni", kind: "textarea", maxLength: 1_000 },
  ],
  calendar_event: [
    { name: "title", label: "Başlık", required: true, maxLength: 300 },
    { name: "description", label: "Açıklama", kind: "textarea", maxLength: 20_000 },
  ],
  client: [
    { name: "notes", label: "Notlar", kind: "textarea", maxLength: 10_000 },
  ],
} satisfies Record<ContentTranslationEntityType, ContentTranslationField[]>;

export function contentInputName(locale: string, field: string) {
  return `i18n.${locale}.${field}`;
}
