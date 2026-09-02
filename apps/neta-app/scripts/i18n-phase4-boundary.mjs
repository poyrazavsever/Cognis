import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checkedRoots = [
  "app/(dashboard)",
  "components/layout",
  "components/system",
  "config/sidebar.ts",
];

const files = checkedRoots.flatMap((entry) => {
  const absolute = path.join(root, entry);
  if (fs.statSync(absolute).isFile()) return [absolute];
  return walk(absolute).filter((file) => /\.(ts|tsx)$/.test(file));
});

const forbiddenFormatterPattern = /"tr-TR"|'tr-TR'|from "date-fns\/locale"|from 'date-fns\/locale'|locale:\s*tr\b/;
const formatterViolations = files
  .map((file) => ({
    file,
    lines: fs.readFileSync(file, "utf8")
      .split("\n")
      .map((line, index) => ({ line, number: index + 1 }))
      .filter(({ line }) => forbiddenFormatterPattern.test(line)),
  }))
  .filter((entry) => entry.lines.length > 0);

assert.deepEqual(
  formatterViolations,
  [],
  `Hardcoded Turkish formatter usage remains:\n${formatterViolations.map(formatViolation).join("\n")}`,
);

const dashboardLayout = fs.readFileSync(path.join(root, "app/(dashboard)/layout.tsx"), "utf8");
const dashboardShell = fs.readFileSync(path.join(root, "components/layout/dashboard-shell.tsx"), "utf8");
assert.match(dashboardLayout, /getClientI18nPayload/, "Dashboard layout must provide client i18n payload.");
assert.match(dashboardShell, /localizeSidebarData/, "Dashboard shell must localize sidebar with client-safe icons.");

const dashboardClient = fs.readFileSync(path.join(root, "app/(dashboard)/dashboard-client.tsx"), "utf8");
assert.match(dashboardClient, /useTranslations/, "Dashboard page must consume translations.");
assert.doesNotMatch(dashboardClient, />Dashboard</, "Dashboard title must not be hardcoded.");

const turkishLiteralPattern = /["'`][^"'`\n]*(?:ğ|ü|ş|ö|ç|ı|İ|Ğ|Ü|Ş|Ö|Ç)[^"'`\n]*["'`]/;
const remainingTurkishLiterals = files
  .flatMap((file) =>
    fs.readFileSync(file, "utf8")
      .split("\n")
      .map((line, index) => ({ file, line, number: index + 1 }))
      .filter(({ line }) => turkishLiteralPattern.test(line)),
  );

const reportPath = path.join(root, "docs", "self-hosted-redesign", "i18n-phase-4-hardcoded-text-report.md");
fs.writeFileSync(
  reportPath,
  [
    "---",
    "title: Faz 4 Kalan Hardcoded Metin Raporu",
    "phase: 4",
    "status: generated",
    `last_updated: ${new Date().toISOString()}`,
    "---",
    "",
    "# Faz 4 Kalan Hardcoded Metin Raporu",
    "",
    "Bu rapor Faz-4 boundary script'i tarafindan uretilir. Formatter sabitleri release blocker kabul edilir; kalan Turkce stringler Faz-4 kapsaminda raporlanir ve sonraki UI migration dalgalarinda eritilir.",
    "",
    `Toplam kalan Turkce literal satiri: ${remainingTurkishLiterals.length}`,
    "",
    ...remainingTurkishLiterals.slice(0, 250).map(({ file, line, number }) => (
      `- \`${path.relative(root, file)}:${number}\` ${line.trim()}`
    )),
    remainingTurkishLiterals.length > 250 ? "" : null,
    remainingTurkishLiterals.length > 250 ? `Ilk 250 satir listelendi; kalan: ${remainingTurkishLiterals.length - 250}` : null,
    "",
  ].filter((line) => line !== null).join("\n"),
);

console.log(`I18n phase 4 boundary passed. Hardcoded text report: ${path.relative(root, reportPath)}`);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(entryPath);
    if (entry.isFile()) return [entryPath];
    return [];
  });
}

function formatViolation(entry) {
  return `${path.relative(root, entry.file)}\n${entry.lines.map(({ line, number }) => `  ${number}: ${line}`).join("\n")}`;
}
