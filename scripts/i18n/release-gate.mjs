import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const i18nNamespaces = [
  "common",
  "auth",
  "navigation",
  "dashboard",
  "clients",
  "projects",
  "tasks",
  "calendar",
  "finance",
  "journal",
  "chat",
  "settings",
  "portal",
  "status",
  "validation",
  "api",
  "analytics",
  "business",
];
const requiredDynamicKeys = [
  ...i18nNamespaces.map((namespace) => `settings.languageDetail.namespaces.${namespace}`),
  ...["light", "dark", "system"].flatMap((mode) => [
    `settings.appearance.theme.${mode}.label`,
    `settings.appearance.theme.${mode}.description`,
  ]),
  ...["all", "draft", "active", "archived"].map((status) => `settings.languages.filters.${status}`),
  ...["draft", "active", "archived", "test"].map((status) => `settings.languages.status.${status}`),
  ...["ltr", "rtl"].map((direction) => `settings.languageNew.direction.${direction}`),
  ...["activate", "default", "archive"].flatMap((action) => [
    `settings.languageDetail.messages.${action}`,
    `settings.languageDetail.dialog.${action}.title`,
    `settings.languageDetail.dialog.${action}.description`,
    `settings.languageDetail.dialog.${action}.confirm`,
  ]),
  ...["defaultSettings", "fallbacks", "userPreferences", "clients", "portalInvitations", "contentTranslations"]
    .map((key) => `settings.languageDetail.usage.${key}`),
];
const localeRoots = {
  tr: path.join(process.cwd(), "locales", "tr"),
  en: path.join(process.cwd(), "locales", "en"),
};
const authRoutes = [
  path.join(process.cwd(), "app", "login"),
  path.join(process.cwd(), "app", "register"),
  path.join(process.cwd(), "app", "forgot-password"),
  path.join(process.cwd(), "app", "reset-password"),
];

export function runReleaseGate() {
  const tr = collectLocaleKeys(localeRoots.tr);
  const en = collectLocaleKeys(localeRoots.en);
  const missingInEn = [...tr.keys()].filter((key) => !en.has(key)).sort();
  const missingInTr = [...en.keys()].filter((key) => !tr.has(key)).sort();
  const interpolationMismatches = [];

  for (const key of [...new Set([...tr.keys(), ...en.keys()])].sort()) {
    const trVars = interpolationVariables(tr.get(key) ?? "");
    const enVars = interpolationVariables(en.get(key) ?? "");
    if (trVars.join(",") !== enVars.join(",")) {
      interpolationMismatches.push({ key, tr: trVars, en: enVars });
    }
  }

  const authLanguageSelectors = scanAuthLanguageSelectors();
  const missingSettingsProviders = scanSettingsNamespaceProviders();
  const missingDynamicKeys = scanRequiredDynamicKeys(tr, en);
  const missingUsedLiteralKeys = scanUsedLiteralTranslationKeys(tr, en);
  const hardCodedSamples = scanHardCodedUserText();
  const failures = {
    missingInEn,
    missingInTr,
    interpolationMismatches,
    authLanguageSelectors,
    missingSettingsProviders,
    missingDynamicKeys,
    missingUsedLiteralKeys,
  };
  const ok = Object.values(failures).every((rows) => rows.length === 0);
  const summary = {
    ok,
    catalog: {
      trKeys: tr.size,
      enKeys: en.size,
      missingInEn: missingInEn.slice(0, 25),
      missingInTr: missingInTr.slice(0, 25),
      interpolationMismatches: interpolationMismatches.slice(0, 25),
    },
    authLanguageSelectors,
    missingSettingsProviders,
    missingDynamicKeys,
    missingUsedLiteralKeys: missingUsedLiteralKeys.slice(0, 50),
    hardCodedSamples,
    notes: [
      "hardCodedSamples bilgilendirme amaçlıdır; false-positive üretmemesi için gate'i fail ettirmez.",
      "Browser smoke, RTL ve payload ölçümleri için docs/self-hosted-redesign/release/i18n-self-host-upgrade.md dosyasındaki kabul adımlarını takip et.",
    ],
  };

  console.log(JSON.stringify(summary, null, 2));
  if (!ok) process.exitCode = 1;
  return summary;
}

function scanRequiredDynamicKeys(tr, en) {
  return requiredDynamicKeys
    .filter((key) => !tr.has(key) || !en.has(key))
    .map((key) => ({ key, tr: tr.has(key), en: en.has(key) }));
}

function scanUsedLiteralTranslationKeys(tr, en) {
  const roots = ["app", "components"].map((root) => path.join(process.cwd(), root));
  const used = new Map();
  const pattern = /\bt\(\s*["']([a-zA-Z][\w]*\.[^"'`{}]+)["']/g;

  for (const file of roots.flatMap((root) => (fs.existsSync(root) ? listFiles(root) : []))) {
    if (!/\.(tsx?|jsx?)$/.test(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    let match;
    while ((match = pattern.exec(source))) {
      const key = match[1];
      const files = used.get(key) ?? new Set();
      files.add(path.relative(process.cwd(), file));
      used.set(key, files);
    }
  }

  return [...used.entries()]
    .filter(([key]) => !tr.has(key) || !en.has(key))
    .map(([key, files]) => ({ key, tr: tr.has(key), en: en.has(key), files: [...files].slice(0, 5) }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function scanSettingsNamespaceProviders() {
  const requiredFiles = [
    { file: path.join(process.cwd(), "app", "(dashboard)", "layout.tsx"), label: "admin dashboard shell" },
    { file: path.join(process.cwd(), "app", "portal", "layout.tsx"), label: "portal shell" },
  ];
  return requiredFiles.flatMap(({ file, label }) => {
    if (!fs.existsSync(file)) return [{ file: path.relative(process.cwd(), file), label, reason: "missing file" }];
    const source = fs.readFileSync(file, "utf8");
    if (!source.includes("getClientI18nPayload")) {
      return [{ file: path.relative(process.cwd(), file), label, reason: "missing getClientI18nPayload" }];
    }
    if (!source.includes('"settings"') && !source.includes("'settings'")) {
      return [{ file: path.relative(process.cwd(), file), label, reason: "settings namespace is not included" }];
    }
    return [];
  });
}

function collectLocaleKeys(root) {
  const files = listFiles(root).filter((file) => file.endsWith(".ts"));
  const entries = new Map();

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    if (path.basename(file) === "common.ts") {
      collectObjectKeys(source, "common", entries);
      continue;
    }
    if (path.basename(file) !== "index.ts") continue;

    let namespace = null;
    for (const line of source.split("\n")) {
      const namespaceMatch = line.match(/^  ([a-zA-Z_][\w]*): \{/);
      if (namespaceMatch) {
        namespace = namespaceMatch[1];
        continue;
      }
      if (namespace && line.startsWith("  },")) {
        namespace = null;
        continue;
      }
      const keyMatch = line.match(/^\s+"([^"]+)"\s*:\s*"((?:\\"|[^"])*)"/);
      if (namespace && keyMatch) {
        entries.set(`${namespace}.${keyMatch[1]}`, keyMatch[2]);
      }
    }
  }
  return entries;
}

function collectObjectKeys(source, namespace, entries) {
  const keyPattern = /"([^"]+)"\s*:\s*"((?:\\"|[^"])*)"/g;
  let match;
  while ((match = keyPattern.exec(source))) {
    entries.set(`${namespace}.${match[1]}`, match[2]);
  }
}

function interpolationVariables(value) {
  return [...new Set([...value.matchAll(/\{([a-zA-Z][\w.-]*)(?:[,}])/g)].map((match) => match[1]))].sort();
}

function scanAuthLanguageSelectors() {
  const patterns = [
    /LocaleSelector/,
    /LanguageSelector/,
    /neta_locale/,
    /setLanguagePreference/,
    /updateLanguagePreference/,
  ];
  return authRoutes
    .flatMap((route) => (fs.existsSync(route) ? listFiles(route) : []))
    .filter((file) => /\.(tsx?|jsx?)$/.test(file))
    .flatMap((file) => {
      const source = fs.readFileSync(file, "utf8");
      return patterns
        .filter((pattern) => pattern.test(source))
        .map((pattern) => ({ file: path.relative(process.cwd(), file), pattern: String(pattern) }));
    });
}

function scanHardCodedUserText() {
  const roots = ["app", "components"].map((root) => path.join(process.cwd(), root));
  const pattern = /[A-Za-zÇĞİÖŞÜçğıöşü]{2,}\s+[A-Za-zÇĞİÖŞÜçğıöşü]{2,}/;
  const allowed = [
    "className",
    "import ",
    "from ",
    "aria-hidden",
    "export ",
    "type ",
    "interface ",
    "console.",
  ];
  const samples = [];

  for (const file of roots.flatMap((root) => (fs.existsSync(root) ? listFiles(root) : []))) {
    if (!/\.(tsx?|jsx?)$/.test(file)) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n");
    for (const [index, line] of lines.entries()) {
      if (samples.length >= 50) return samples;
      if (allowed.some((token) => line.includes(token))) continue;
      if (pattern.test(line) && /[">']/.test(line)) {
        samples.push({
          file: path.relative(process.cwd(), file),
          line: index + 1,
          sample: line.trim().slice(0, 180),
        });
      }
    }
  }
  return samples;
}

function listFiles(root) {
  const result = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      result.push(...listFiles(fullPath));
    } else {
      result.push(fullPath);
    }
  }
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runReleaseGate();
}
