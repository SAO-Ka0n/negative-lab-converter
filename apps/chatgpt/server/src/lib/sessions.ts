import { randomUUID } from "node:crypto";

interface SessionRecord {
  createdAt: string;
  id: string;
  intent: string;
  preferredFormat?: string;
}

const sessions = new Map<string, SessionRecord>();

export function createSession(input: { intent: string; preferredFormat?: string }) {
  const id = `nlc-${randomUUID()}`;
  const session = {
    id,
    intent: input.intent,
    preferredFormat: input.preferredFormat,
    createdAt: new Date().toISOString(),
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string) {
  return sessions.get(id);
}
