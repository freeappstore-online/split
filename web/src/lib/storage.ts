import type { Group } from "./types";

const STORAGE_KEY = "split-app-groups";

export function loadGroups(): Group[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Group[];
  } catch {
    return [];
  }
}

export function saveGroups(groups: Group[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function generateId(): string {
  return crypto.randomUUID();
}
