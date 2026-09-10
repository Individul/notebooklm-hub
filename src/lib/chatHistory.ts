export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
}

export interface ChatSession {
  id: string;
  notebookId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

const STORAGE_PREFIX = 'notebooklm_chat_sessions_';

export function getStorageKey(notebookId: string): string {
  return `${STORAGE_PREFIX}${notebookId}`;
}

export function getDefaultWelcomeMessage(notebookTitle: string): ChatMessage {
  return {
    role: 'assistant',
    text: `Bun venit în spațiul direct de lucru pentru **${notebookTitle}**! 

Sursele încărcate sunt analizate. Poți pune orice întrebare legată de ele, poți cere un rezumat sau poți genera întrebări de aprofundare direct aici pe site.`,
    timestamp: new Date().toISOString(),
  };
}

export function createNewSession(notebookId: string, notebookTitle: string): ChatSession {
  const now = new Date().toISOString();
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    notebookId,
    title: 'Conversație nouă',
    createdAt: now,
    updatedAt: now,
    messages: [getDefaultWelcomeMessage(notebookTitle)],
  };
}

export function getStoredSessions(notebookId: string, notebookTitle: string): ChatSession[] {
  if (typeof window === 'undefined') return [createNewSession(notebookId, notebookTitle)];
  try {
    const raw = localStorage.getItem(getStorageKey(notebookId));
    if (!raw) {
      const initial = createNewSession(notebookId, notebookTitle);
      saveSession(initial);
      return [initial];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const initial = createNewSession(notebookId, notebookTitle);
    saveSession(initial);
    return [initial];
  } catch (err) {
    console.error('Error loading chat sessions:', err);
    return [createNewSession(notebookId, notebookTitle)];
  }
}

export function saveAllSessions(notebookId: string, sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(notebookId), JSON.stringify(sessions));
  } catch (err) {
    console.error('Error saving chat sessions:', err);
  }
}

export function saveSession(session: ChatSession): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey(session.notebookId);
    const raw = localStorage.getItem(key);
    let sessions: ChatSession[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(sessions)) sessions = [];

    const existingIdx = sessions.findIndex(s => s.id === session.id);
    if (existingIdx !== -1) {
      sessions[existingIdx] = session;
    } else {
      sessions.unshift(session);
    }
    localStorage.setItem(key, JSON.stringify(sessions));
  } catch (err) {
    console.error('Error saving single chat session:', err);
  }
}

export function deleteSessionFromStorage(notebookId: string, sessionId: string): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getStorageKey(notebookId);
    const raw = localStorage.getItem(key);
    let sessions: ChatSession[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(sessions)) sessions = [];

    const filtered = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(key, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.error('Error deleting chat session:', err);
    return [];
  }
}
