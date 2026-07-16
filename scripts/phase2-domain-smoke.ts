import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "../server/db/schema";
import type { DomainActor } from "../server/domain/actor";
import { DomainError } from "../server/domain/errors";
import { DomainService } from "../server/services/domain";

const databasePath = process.argv[2];
assert.ok(databasePath, "Database path is required");

const sqlite = new Database(databasePath);
sqlite.pragma("foreign_keys = ON");
const db = drizzle({ client: sqlite, schema });
let generatedId = 0;
const service = new DomainService(db, () => `generated-${++generatedId}`);

const ownerOne: DomainActor = { authUserId: "owner-1", role: "freelancer", clientId: null, disabled: false };
const ownerTwo: DomainActor = { authUserId: "owner-2", role: "freelancer", clientId: null, disabled: false };
const clientOne: DomainActor = { authUserId: "client-user-1", role: "client", clientId: "client-1", disabled: false };
const clientTwo: DomainActor = { authUserId: "client-user-2", role: "client", clientId: "client-2", disabled: false };

try {
  for (const actor of [ownerOne, ownerTwo, clientOne, clientTwo]) {
    db.insert(schema.user).values({
      id: actor.authUserId,
      name: actor.authUserId,
      email: `${actor.authUserId}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).run();
  }

  service.createClient(ownerOne, { id: "client-1", name: "Client One", email: "one@example.com" });
  service.createClient(ownerOne, { id: "client-2", name: "Client Two" });
  service.createClient(ownerTwo, { id: "client-other", name: "Other Owner Client" });
  db.update(schema.clients).set({ authUserId: clientOne.authUserId }).where(eq(schema.clients.id, "client-1")).run();
  db.update(schema.clients).set({ authUserId: clientTwo.authUserId }).where(eq(schema.clients.id, "client-2")).run();

  assertDomainError(() => service.getClient(ownerTwo, "client-1"), "NOT_FOUND");
  assertDomainError(() => service.listClients(clientOne), "FORBIDDEN");
  assert.equal(service.getClient(clientOne, "client-1").id, "client-1");
  assertDomainError(() => service.getClient(clientOne, "client-2"), "NOT_FOUND");
  assertDomainError(
    () => service.createProject(ownerOne, { id: "invalid-side", name: "Invalid", type: "side_project", clientId: "client-1" }),
    "INVARIANT_VIOLATION",
  );

  service.createProject(ownerOne, {
    id: "project-1",
    name: "Client Project",
    clientId: "client-1",
    status: "active",
    progressType: "auto",
    revisionQuota: 1,
  });
  service.createProject(ownerOne, { id: "project-2", name: "Second Client", clientId: "client-2" });
  service.createProject(ownerTwo, { id: "project-other", name: "Other Project", clientId: "client-other" });

  service.createTask(ownerOne, {
    id: "task-public",
    title: "Public Task",
    clientId: "client-1",
    projectId: "project-1",
    status: "done",
    isPublicToClient: true,
  });
  service.createTask(ownerOne, {
    id: "task-private",
    title: "Private Task",
    clientId: "client-1",
    projectId: "project-1",
    status: "todo",
    isPublicToClient: false,
  });
  assert.equal(service.getProject(ownerOne, "project-1").progress, 50, "Auto progress must aggregate active tasks");
  assert.deepEqual(service.listTasks(clientOne).map((task) => task.id), ["task-public"]);
  assertDomainError(() => service.getProject(clientOne, "project-2"), "NOT_FOUND");
  assertDomainError(() => service.listFinanceTransactions(clientOne), "FORBIDDEN");
  assertDomainError(() => service.updateTask(ownerTwo, "task-public", { status: "done" }), "NOT_FOUND");

  service.updateTask(ownerOne, "task-private", { status: "done" });
  assert.equal(service.getProject(ownerOne, "project-1").progress, 100);

  service.addPlanningSection(ownerOne, {
    id: "planning-1",
    projectId: "project-1",
    category: "overview",
    title: "Overview",
    content: "Visible project context",
  });
  assert.equal(service.listPlanningSections(clientOne, "project-1").length, 1);
  assertDomainError(() => service.listPlanningSections(clientTwo, "project-1"), "NOT_FOUND");

  assert.equal(service.requestRevision(clientOne, { id: "revision-1", projectId: "project-1", description: "Please revise" }).status, "pending");
  assertDomainError(
    () => service.requestRevision(clientOne, { id: "revision-2", projectId: "project-1", description: "Quota overflow" }),
    "CONFLICT",
  );
  assertDomainError(
    () => service.requestRevision(clientTwo, { id: "revision-3", projectId: "project-1", description: "Wrong client" }),
    "NOT_FOUND",
  );
  assert.equal(service.updateRevisionStatus(ownerOne, "revision-1", "completed").status, "completed");
  assert.deepEqual(service.listRevisions(clientOne, "project-1").map((revision) => revision.id), ["revision-1"]);

  service.createFinanceTransaction(ownerOne, {
    id: "income-1", type: "income", amountMinor: 150_00, currency: "try", transactionDate: "2026-07-16", paymentStatus: "paid",
  });
  service.createFinanceTransaction(ownerOne, {
    id: "expense-1", type: "expense", amountMinor: 40_00, currency: "TRY", transactionDate: "2026-07-16", paymentStatus: "paid",
  });
  service.createFinanceTransaction(ownerOne, {
    id: "planned-1", type: "income", amountMinor: 75_00, currency: "TRY", transactionDate: "2026-07-17", paymentStatus: "planned",
  });
  service.createFinanceTransaction(ownerTwo, {
    id: "other-income", type: "income", amountMinor: 999_00, currency: "TRY", transactionDate: "2026-07-16", paymentStatus: "paid",
  });
  assert.deepEqual(service.getAnalytics(ownerOne).finance, {
    incomeMinor: 150_00,
    expenseMinor: 40_00,
    plannedMinor: 75_00,
    netMinor: 110_00,
  });

  service.saveJournalEntry(ownerOne, { id: "journal-1", entryDate: "2026-07-16", moodScore: 3, note: "First" });
  service.saveJournalEntry(ownerOne, { entryDate: "2026-07-16", moodScore: 5, note: "Updated" });
  assert.equal(service.listJournalEntries(ownerOne).length, 1, "Journal date must upsert per owner");
  assert.equal(service.listJournalEntries(ownerOne)[0]?.moodScore, 5);
  assertDomainError(
    () => service.createTask(ownerTwo, { title: "Foreign journal", sourceJournalEntryId: "journal-1" }),
    "NOT_FOUND",
  );

  service.createChatSession(ownerOne, { id: "chat-1", title: "Daily review" });
  service.addChatMessage(ownerOne, { id: "message-1", sessionId: "chat-1", role: "user", content: "Summarize", contextJournalEntryIds: ["journal-1"] });
  assertDomainError(() => service.addChatMessage(ownerTwo, { sessionId: "chat-1", role: "user", content: "Cross owner" }), "NOT_FOUND");

  service.createProposal(ownerOne, { id: "proposal-1", clientId: "client-1", projectId: "project-1", title: "Proposal", amountMinor: 100_00 });
  service.createContract(ownerOne, { id: "contract-1", clientId: "client-1", title: "Contract" });
  service.createInvoice(ownerOne, { id: "invoice-1", clientId: "client-1", projectId: "project-1", invoiceNumber: "INV-001", amountMinor: 100_00, issueDate: "2026-07-16" });
  service.createSubscription(ownerOne, { id: "subscription-1", name: "Hosting", amountMinor: 500_00 });

  assert.throws(
    () => sqlite.prepare("insert into finance_transactions (id, owner_user_id, type, amount_minor, currency, transaction_date, payment_status) values (?, ?, ?, ?, ?, ?, ?)").run("invalid-finance", ownerOne.authUserId, "income", -1, "TRY", "2026-07-16", "paid"),
    /CHECK constraint failed/,
  );
  assert.throws(
    () => sqlite.prepare("insert into tasks (id, owner_user_id, title, status, priority) values (?, ?, ?, ?, ?)").run("invalid-task", ownerOne.authUserId, "Invalid", "unknown", "medium"),
    /CHECK constraint failed/,
  );

  console.log("Phase 2 domain smoke passed: scope, invariants, quota, aggregates and DB constraints verified.");
} finally {
  sqlite.close();
}

function assertDomainError(run: () => unknown, code: DomainError["code"]) {
  assert.throws(run, (error) => error instanceof DomainError && error.code === code);
}
