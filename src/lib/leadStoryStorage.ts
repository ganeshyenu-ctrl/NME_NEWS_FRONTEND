'use client';

const LEAD_STORY_KEY = 'nme_lead_story_ids_cache';

export function getStoredLeadStoryIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEAD_STORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStoredLeadStoryIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEAD_STORY_KEY, JSON.stringify(ids));
  } catch {}
}

export function addStoredLeadStoryId(id: string): void {
  if (!id) return;
  const list = getStoredLeadStoryIds();
  if (!list.includes(id)) {
    list.unshift(id);
    setStoredLeadStoryIds(list);
  }
}

export function removeStoredLeadStoryId(id: string): void {
  if (!id) return;
  const list = getStoredLeadStoryIds().filter((existingId) => existingId !== id);
  setStoredLeadStoryIds(list);
}

export function toggleStoredLeadStoryId(id: string): boolean {
  if (!id) return false;
  const list = getStoredLeadStoryIds();
  const exists = list.includes(id);
  if (exists) {
    removeStoredLeadStoryId(id);
    return false;
  } else {
    addStoredLeadStoryId(id);
    return true;
  }
}

export function isStoredLeadStory(id: string, fallbackIsLead?: boolean): boolean {
  if (!id) return Boolean(fallbackIsLead);
  const list = getStoredLeadStoryIds();
  if (list.includes(id)) return true;
  return Boolean(fallbackIsLead);
}
