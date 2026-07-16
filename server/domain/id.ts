import { randomUUID } from "node:crypto";

export type IdGenerator = () => string;

export const generateId: IdGenerator = randomUUID;
