import assert from "node:assert/strict";
import { user } from "../server/db/schema";
import { getSqliteConnection } from "../server/db/client";
import type { DomainActor } from "../server/domain/actor";
import { DomainService } from "../server/services/domain";
import { ContentTranslationService } from "../server/i18n/content";
import { I18nService } from "../server/i18n/service";

const { db } = getSqliteConnection();
const owner: DomainActor = {
  authUserId: "phase5-owner",
  role: "freelancer",
  clientId: null,
  disabled: false,
};

db.insert(user)
  .values({
    id: owner.authUserId,
    name: "Phase 5 Owner",
    email: "phase5-owner@example.com",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  .onConflictDoNothing()
  .run();

const i18n = new I18nService(db);
i18n.listLocales(owner);
if (!i18n.listLocales(owner).some((locale) => locale.code === "fr")) {
  i18n.createLocale(owner, {
    code: "fr",
    name: "French",
    nativeName: "Français",
    fallbackLocale: "en",
    status: "active",
  });
} else {
  i18n.updateLocale(owner, "fr", { status: "active" });
}

const domain = new DomainService(db, (() => {
  let next = 0;
  return () => `phase5-${++next}`;
})());
const content = new ContentTranslationService(db);

const project = domain.createProject(owner, {
  id: "phase5-project",
  type: "side_project",
  name: "Legacy fallback",
  translations: {
    tr: {
      name: "Çok dilli proje",
      description: "Türkçe açıklama",
      coverImageAlt: "Türkçe kapak",
    },
    en: {
      name: "Multilingual project",
      description: "English description",
      coverImageAlt: "English cover",
    },
    fr: {
      name: "Projet multilingue",
      description: "Description française",
      coverImageAlt: "Couverture française",
    },
  },
});

assert.equal(project.name, "Çok dilli proje", "Default locale must be projected to legacy project.name.");
assert.equal(project.description, "Türkçe açıklama");

const projectTranslations = content.listEntityTranslations("project", project.id);
assert.equal(projectTranslations.filter((row) => row.field === "name").length, 3);
assert.equal(
  content.resolveEntity("project", project, {
    locale: "fr",
    defaultLocale: "tr",
    translations: projectTranslations,
  }).name,
  "Projet multilingue",
  "Project must resolve according to selected locale.",
);

const section = domain.addPlanningSection(owner, {
  id: "phase5-section",
  projectId: project.id,
  category: "overview",
  title: "Legacy section",
  translations: {
    tr: { title: "Planlama", content: "Türkçe içerik" },
    en: { title: "Planning", content: "English content" },
    fr: { title: "Planification", content: "Contenu français" },
  },
});
assert.equal(section.title, "Planlama");

const task = domain.createTask(owner, {
  id: "phase5-task",
  projectId: project.id,
  title: "Legacy task",
  translations: {
    tr: { title: "Görev başlığı", description: "Türkçe görev" },
    en: { title: "Task title", description: "English task" },
    fr: { title: "Titre de tâche", description: "Tâche française" },
  },
});
assert.equal(task.title, "Görev başlığı");

const batch = content.listBatch("task", [task.id]);
assert.equal(batch.get(task.id)?.some((row) => row.locale === "fr" && row.value === "Titre de tâche"), true);

domain.deleteTask(owner, task.id);
assert.equal(content.listEntityTranslations("task", task.id).length, 0, "Task delete must remove content translations.");

console.log("I18n phase 5 content translation smoke passed.");
