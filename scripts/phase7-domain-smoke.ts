import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../server/db/schema";
import { buildChatContext, buildFinanceAnalysisContext, buildProjectRiskContext } from "../server/ai/context";
import type { DomainActor } from "../server/domain/actor";
import { DomainError } from "../server/domain/errors";
import { DomainService } from "../server/services/domain";

const databasePath = process.argv[2];
assert.ok(databasePath, "Database path is required");

const sqlite = new Database(databasePath);
sqlite.pragma("foreign_keys = ON");
const db = drizzle({ client: sqlite, schema });
let generatedId = 0;
const service = new DomainService(db, () => `phase7-generated-${++generatedId}`);
const owner: DomainActor = {
  authUserId: "phase7-owner",
  role: "freelancer",
  clientId: null,
  disabled: false,
};
const otherOwner: DomainActor = {
  authUserId: "phase7-other-owner",
  role: "freelancer",
  clientId: null,
  disabled: false,
};
const clientActor: DomainActor = {
  authUserId: "phase7-client-user",
  role: "client",
  clientId: "phase7-client",
  disabled: false,
};

try {
  for (const actor of [owner, otherOwner, clientActor]) {
    db.insert(schema.user).values({
      id: actor.authUserId,
      name: actor.authUserId,
      email: `${actor.authUserId}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).run();
  }

  service.createClient(owner, {
    id: "phase7-client",
    name: "Visible Client",
    email: "visible@example.com",
  });
  service.createClient(otherOwner, {
    id: "phase7-foreign-client",
    name: "Foreign Secret Client",
  });
  service.createProject(owner, {
    id: "phase7-project",
    clientId: "phase7-client",
    name: "Visible Project",
    status: "active",
    budgetAmountMinor: 250_000,
    currency: "TRY",
  });
  service.createProject(otherOwner, {
    id: "phase7-foreign-project",
    clientId: "phase7-foreign-client",
    name: "Foreign Secret Project",
    status: "active",
  });
  service.createTask(owner, {
    id: "phase7-task",
    clientId: "phase7-client",
    projectId: "phase7-project",
    title: "Visible Task",
    status: "done",
  });
  service.createFinanceTransaction(owner, {
    id: "phase7-finance",
    type: "income",
    amountMinor: 12_345,
    currency: "TRY",
    transactionDate: "2026-07-17",
    paymentStatus: "paid",
  });
  service.createFinanceTransaction(otherOwner, {
    id: "phase7-foreign-finance",
    type: "income",
    amountMinor: 999_999,
    currency: "TRY",
    transactionDate: "2026-07-17",
    paymentStatus: "paid",
    description: "Foreign Secret Finance",
  });
  service.saveJournalEntry(owner, {
    id: "phase7-journal",
    entryDate: "2026-07-17",
    moodScore: 4,
    note: "Visible journal note",
  });

  const chatContext = buildChatContext(service, owner, new Date("2026-07-17T12:00:00.000Z"));
  assert.match(chatContext, /Visible Project/);
  assert.match(chatContext, /Visible Task/);
  assert.match(chatContext, /Visible journal note/);
  assert.doesNotMatch(chatContext, /Foreign Secret/);

  const financeContext = buildFinanceAnalysisContext(
    service,
    owner,
    new Date("2026-07-17T12:00:00.000Z"),
  );
  assert.equal(financeContext.hasData, true);
  assert.match(financeContext.text, /123\.45/);
  assert.doesNotMatch(financeContext.text, /9999\.99|Foreign Secret/);
  assert.match(buildProjectRiskContext(service, owner, "phase7-project"), /Visible Client/);
  assertDomainError(
    () => buildProjectRiskContext(service, owner, "phase7-foreign-project"),
    "NOT_FOUND",
  );

  service.createChatSession(owner, { id: "phase7-chat", title: "Owner chat" });
  service.addChatMessage(owner, {
    id: "phase7-message",
    sessionId: "phase7-chat",
    role: "user",
    content: "Owner question",
  });
  assert.equal(service.listChatSessions(owner).length, 1);
  assert.equal(service.listChatMessages(owner, "phase7-chat")[0]?.content, "Owner question");
  assertDomainError(() => service.getChatSession(otherOwner, "phase7-chat"), "NOT_FOUND");
  assertDomainError(() => service.listChatMessages(otherOwner, "phase7-chat"), "NOT_FOUND");
  assertDomainError(() => service.deleteChatSession(otherOwner, "phase7-chat"), "NOT_FOUND");
  service.deleteChatSession(owner, "phase7-chat");
  const remainingMessages = sqlite
    .prepare("select count(*) as value from chat_messages where session_id = ?")
    .get("phase7-chat") as { value: number };
  assert.equal(
    remainingMessages.value,
    0,
    "Chat session deletion must cascade to messages",
  );

  service.createProposal(owner, {
    id: "phase7-proposal",
    clientId: "phase7-client",
    projectId: "phase7-project",
    title: "Proposal",
    amountMinor: 100_00,
  });
  service.createContract(owner, {
    id: "phase7-contract",
    proposalId: "phase7-proposal",
    clientId: "phase7-client",
    title: "Contract",
  });
  service.createInvoice(owner, {
    id: "phase7-invoice",
    clientId: "phase7-client",
    projectId: "phase7-project",
    invoiceNumber: "P7-001",
    amountMinor: 100_00,
    issueDate: "2026-07-17",
  });
  service.createSubscription(owner, {
    id: "phase7-subscription",
    name: "Hosting",
    amountMinor: 500_00,
  });

  assert.equal(service.listProposals(owner).length, 1);
  assert.equal(service.updateProposal(owner, "phase7-proposal", { status: "sent" }).status, "sent");
  assert.equal(service.listContracts(owner).length, 1);
  assert.equal(service.updateContract(owner, "phase7-contract", { status: "active" }).status, "active");
  assert.equal(service.listInvoices(owner).length, 1);
  assert.equal(service.updateInvoice(owner, "phase7-invoice", { status: "paid" }).status, "paid");
  assert.equal(service.listSubscriptions(owner).length, 1);
  assert.equal(
    service.updateSubscription(owner, "phase7-subscription", { status: "cancelled" }).status,
    "cancelled",
  );

  for (const run of [
    () => service.getProposal(otherOwner, "phase7-proposal"),
    () => service.updateContract(otherOwner, "phase7-contract", { status: "active" }),
    () => service.deleteInvoice(otherOwner, "phase7-invoice"),
    () => service.getSubscription(otherOwner, "phase7-subscription"),
  ]) {
    assertDomainError(run, "NOT_FOUND");
  }
  assertDomainError(() => service.listProposals(clientActor), "FORBIDDEN");

  service.deleteContract(owner, "phase7-contract");
  service.deleteProposal(owner, "phase7-proposal");
  service.deleteInvoice(owner, "phase7-invoice");
  service.deleteSubscription(owner, "phase7-subscription");
  assert.deepEqual(
    [
      service.listContracts(owner).length,
      service.listProposals(owner).length,
      service.listInvoices(owner).length,
      service.listSubscriptions(owner).length,
    ],
    [0, 0, 0, 0],
  );

  console.log("Phase 7 domain smoke passed: owner-scoped chat, AI context and business CRUD verified.");
} finally {
  sqlite.close();
}

function assertDomainError(run: () => unknown, code: DomainError["code"]) {
  assert.throws(run, (error) => error instanceof DomainError && error.code === code);
}
