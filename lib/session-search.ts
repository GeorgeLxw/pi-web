// Client-side keyword matching for the session list in the sidebar.
// Searches exactly what a row displays: the stored name, the collapsed
// first-message title, and the id — nothing heavier (no full-text scan).

import { skillExpansionToCommand } from "./slash-display";
import type { SessionInfo } from "./types";

type SearchableSession = Pick<SessionInfo, "name" | "firstMessage" | "id">;

/** The searchable text of a session, mirroring the row's display title. */
export function sessionSearchText(session: SearchableSession): string {
  const title = skillExpansionToCommand(session.firstMessage) ?? session.firstMessage;
  return `${session.name ?? ""}\n${title}\n${session.id}`;
}

/** Case-insensitive substring match; an empty/whitespace query matches all. */
export function matchesSessionQuery(session: SearchableSession, rawQuery: string): boolean {
  const query = rawQuery.trim().toLocaleLowerCase();
  if (!query) return true;
  return sessionSearchText(session).toLocaleLowerCase().includes(query);
}
