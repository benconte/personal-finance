import type { User } from '../types/auth';

const USERS_KEY = 'finance_users';
const SESSION_KEY = 'finance_session';

export function getUsers(): User[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

export function saveUser(user: User): void {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function setSession(userId: string): void {
  localStorage.setItem(SESSION_KEY, userId);
}

export function getSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/** Simple deterministic hash — NOT cryptographic, demo only */
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
