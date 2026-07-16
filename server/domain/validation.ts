import { z } from "zod";
import {
  calendarEventTypes,
  chatMessageRoles,
  clientActivityTypes,
  clientPipelineStages,
  clientStatuses,
  contractStatuses,
  financeTransactionTypes,
  invoiceStatuses,
  paymentStatuses,
  planningSectionCategories,
  projectProgressTypes,
  projectStatuses,
  projectTypes,
  proposalStatuses,
  revisionStatuses,
  subscriptionBillingCycles,
  subscriptionStatuses,
  taskPriorities,
  taskStatuses,
} from "./types";
import { DomainError } from "./errors";

export const resourceIdSchema = z.string().trim().min(1).max(128);
export const businessDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır.");
export const currencySchema = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase());
export const minorAmountSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const optionalId = resourceIdSchema.nullable().optional();
const optionalDate = businessDateSchema.nullable().optional();

export const clientCreateSchema = z.object({
  id: resourceIdSchema.optional(),
  name: z.string().trim().min(1).max(160),
  companyName: optionalText(160),
  email: z.email().nullable().optional(),
  phone: optionalText(40),
  website: z.url().nullable().optional(),
  status: z.enum(clientStatuses).default("active"),
  pipelineStage: z.enum(clientPipelineStages).default("lead"),
  nextFollowUpDate: optionalDate,
  notes: optionalText(10_000),
});
export const clientUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  companyName: optionalText(160),
  email: z.email().nullable().optional(),
  phone: optionalText(40),
  website: z.url().nullable().optional(),
  status: z.enum(clientStatuses).optional(),
  pipelineStage: z.enum(clientPipelineStages).optional(),
  nextFollowUpDate: optionalDate,
  notes: optionalText(10_000),
});

export const clientActivityCreateSchema = z.object({
  id: resourceIdSchema.optional(),
  clientId: resourceIdSchema,
  type: z.enum(clientActivityTypes),
  title: z.string().trim().min(1).max(200),
  content: optionalText(10_000),
  activityDate: z.date().default(() => new Date()),
});

export const projectCreateSchema = z.object({
  id: resourceIdSchema.optional(),
  clientId: optionalId,
  name: z.string().trim().min(1).max(200),
  type: z.enum(projectTypes).default("client_project"),
  description: optionalText(20_000),
  status: z.enum(projectStatuses).default("planning"),
  startDate: optionalDate,
  dueDate: optionalDate,
  budgetAmountMinor: minorAmountSchema.nullable().optional(),
  currency: currencySchema.default("USD"),
  progress: z.number().int().min(0).max(100).default(0),
  progressType: z.enum(projectProgressTypes).default("manual"),
  revisionQuota: z.number().int().min(0).max(10_000).default(0),
  legacyCoverImagePath: optionalText(1_000),
  coverImageAlt: optionalText(500),
});
export const projectUpdateSchema = z.object({
  clientId: optionalId,
  name: z.string().trim().min(1).max(200).optional(),
  type: z.enum(projectTypes).optional(),
  description: optionalText(20_000),
  status: z.enum(projectStatuses).optional(),
  startDate: optionalDate,
  dueDate: optionalDate,
  budgetAmountMinor: minorAmountSchema.nullable().optional(),
  currency: currencySchema.optional(),
  progress: z.number().int().min(0).max(100).optional(),
  progressType: z.enum(projectProgressTypes).optional(),
  revisionQuota: z.number().int().min(0).max(10_000).optional(),
  legacyCoverImagePath: optionalText(1_000),
  coverImageAlt: optionalText(500),
});

export const taskCreateSchema = z.object({
  id: resourceIdSchema.optional(),
  clientId: optionalId,
  projectId: optionalId,
  sourceJournalEntryId: optionalId,
  title: z.string().trim().min(1).max(300),
  description: optionalText(20_000),
  status: z.enum(taskStatuses).default("todo"),
  priority: z.enum(taskPriorities).default("medium"),
  scheduledDate: optionalDate,
  dueAt: z.date().nullable().optional(),
  estimatedMinutes: z.number().int().min(0).nullable().optional(),
  actualMinutes: z.number().int().min(0).nullable().optional(),
  aiGenerated: z.boolean().default(false),
  isPublicToClient: z.boolean().default(false),
});
export const taskUpdateSchema = z.object({
  clientId: optionalId,
  projectId: optionalId,
  sourceJournalEntryId: optionalId,
  title: z.string().trim().min(1).max(300).optional(),
  description: optionalText(20_000),
  status: z.enum(taskStatuses).optional(),
  priority: z.enum(taskPriorities).optional(),
  scheduledDate: optionalDate,
  dueAt: z.date().nullable().optional(),
  estimatedMinutes: z.number().int().min(0).nullable().optional(),
  actualMinutes: z.number().int().min(0).nullable().optional(),
  aiGenerated: z.boolean().optional(),
  isPublicToClient: z.boolean().optional(),
});

const calendarEventBaseSchema = z.object({
    id: resourceIdSchema.optional(),
    clientId: optionalId,
    projectId: optionalId,
    taskId: optionalId,
    title: z.string().trim().min(1).max(300),
    description: optionalText(20_000),
    type: z.enum(calendarEventTypes).default("focus"),
    startsAt: z.date(),
    endsAt: z.date().nullable().optional(),
  });
export const calendarEventCreateSchema = calendarEventBaseSchema
  .refine((value) => !value.endsAt || value.endsAt >= value.startsAt, {
    message: "Bitiş zamanı başlangıç zamanından önce olamaz.",
    path: ["endsAt"],
  });
export const calendarEventUpdateSchema = z.object({
  clientId: optionalId,
  projectId: optionalId,
  taskId: optionalId,
  title: z.string().trim().min(1).max(300).optional(),
  description: optionalText(20_000),
  type: z.enum(calendarEventTypes).optional(),
  startsAt: z.date().optional(),
  endsAt: z.date().nullable().optional(),
});

export const financeTransactionCreateSchema = z.object({
  id: resourceIdSchema.optional(),
  clientId: optionalId,
  projectId: optionalId,
  type: z.enum(financeTransactionTypes),
  amountMinor: minorAmountSchema,
  currency: currencySchema.default("USD"),
  transactionDate: businessDateSchema,
  category: optionalText(160),
  paymentStatus: z.enum(paymentStatuses).default("planned"),
  description: optionalText(10_000),
});
export const financeTransactionUpdateSchema = z.object({
  clientId: optionalId,
  projectId: optionalId,
  type: z.enum(financeTransactionTypes).optional(),
  amountMinor: minorAmountSchema.optional(),
  currency: currencySchema.optional(),
  transactionDate: businessDateSchema.optional(),
  category: optionalText(160),
  paymentStatus: z.enum(paymentStatuses).optional(),
  description: optionalText(10_000),
});

export const journalEntrySchema = z.object({
  id: resourceIdSchema.optional(),
  entryDate: businessDateSchema,
  moodScore: z.number().int().min(1).max(5).nullable().optional(),
  energyScore: z.number().int().min(1).max(5).nullable().optional(),
  workSatisfactionScore: z.number().int().min(1).max(5).nullable().optional(),
  moodLabel: optionalText(80),
  note: optionalText(30_000),
  legacyAiMetadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const planningSectionCreateSchema = z.object({
  id: resourceIdSchema.optional(),
  projectId: resourceIdSchema,
  category: z.enum(planningSectionCategories),
  title: z.string().trim().min(1).max(300),
  content: optionalText(50_000),
  metadata: z.record(z.string(), z.unknown()).default({}),
  sortOrder: z.number().int().min(0).default(0),
});
export const planningSectionUpdateSchema = z.object({
  category: z.enum(planningSectionCategories).optional(),
  title: z.string().trim().min(1).max(300).optional(),
  content: optionalText(50_000),
  metadata: z.record(z.string(), z.unknown()).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const revisionCreateSchema = z.object({
  id: resourceIdSchema.optional(),
  projectId: resourceIdSchema,
  description: z.string().trim().min(1).max(20_000),
});
export const revisionStatusSchema = z.enum(revisionStatuses);

export const chatSessionCreateSchema = z.object({
  id: resourceIdSchema.optional(),
  title: z.string().trim().min(1).max(300),
});
export const chatMessageCreateSchema = z.object({
  id: resourceIdSchema.optional(),
  sessionId: resourceIdSchema,
  role: z.enum(chatMessageRoles),
  content: z.string().trim().min(1).max(100_000),
  contextJournalEntryIds: z.array(resourceIdSchema).max(100).default([]),
});

export const proposalCreateSchema = z.object({
  id: resourceIdSchema.optional(),
  clientId: optionalId,
  projectId: optionalId,
  title: z.string().trim().min(1).max(300),
  description: optionalText(30_000),
  amountMinor: minorAmountSchema.default(0),
  currency: currencySchema.default("TRY"),
  status: z.enum(proposalStatuses).default("draft"),
  validUntil: z.date().nullable().optional(),
});
export const contractCreateSchema = z.object({
  id: resourceIdSchema.optional(),
  proposalId: optionalId,
  clientId: optionalId,
  title: z.string().trim().min(1).max(300),
  content: optionalText(100_000),
  status: z.enum(contractStatuses).default("draft"),
  signedAt: z.date().nullable().optional(),
});
export const invoiceCreateSchema = z.object({
  id: resourceIdSchema.optional(),
  clientId: optionalId,
  projectId: optionalId,
  invoiceNumber: z.string().trim().min(1).max(100),
  amountMinor: minorAmountSchema.default(0),
  taxBasisPoints: z.number().int().min(0).max(10_000).default(0),
  currency: currencySchema.default("TRY"),
  status: z.enum(invoiceStatuses).default("draft"),
  issueDate: businessDateSchema,
  dueDate: optionalDate,
  paidAt: z.date().nullable().optional(),
});
export const subscriptionCreateSchema = z.object({
  id: resourceIdSchema.optional(),
  name: z.string().trim().min(1).max(300),
  amountMinor: minorAmountSchema.default(0),
  currency: currencySchema.default("TRY"),
  billingCycle: z.enum(subscriptionBillingCycles).default("monthly"),
  nextBillingDate: optionalDate,
  status: z.enum(subscriptionStatuses).default("active"),
  category: optionalText(160),
});

export function parseDomainInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new DomainError("VALIDATION_ERROR", "Girilen bilgiler geçersiz.", {
      fields: result.error.flatten().fieldErrors,
    });
  }

  return result.data;
}
