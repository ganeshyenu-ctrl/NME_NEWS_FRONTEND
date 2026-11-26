export interface StoredComment {
  _id: string;
  article: {
    _id: string;
    title: string;
    slug: string;
  } | null;
  authorName: string;
  authorEmail: string;
  content: string;
  status: 'pending' | 'approved' | 'spam';
  ipAddress?: string;
  createdAt: string;
  updatedAt?: string;
}

const COMMENTS_STORAGE_KEY = 'nme_comments_moderation_cache';

// Strictly empty - no fake or sample comments allowed
export const INITIAL_SAMPLE_COMMENTS: StoredComment[] = [];

export function getLocalComments(): StoredComment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Purge any legacy sample/fake comments
    const realOnly = parsed.filter(
      (c) =>
        c &&
        c._id &&
        !c._id.startsWith('comm_pending_') &&
        !c._id.startsWith('comm_approved_') &&
        c.authorName !== 'Captain Ramesh Sharma' &&
        c.authorName !== 'Elena Rostova' &&
        c.authorName !== 'David MacLeod'
    );

    if (realOnly.length !== parsed.length) {
      saveLocalComments(realOnly);
    }

    return realOnly;
  } catch {
    return [];
  }
}

export function saveLocalComments(comments: StoredComment[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
  } catch {}
}

export function updateLocalCommentStatus(
  id: string,
  status: 'pending' | 'approved' | 'spam'
): StoredComment | null {
  const list = getLocalComments();
  const item = list.find((c) => c._id === id);
  if (!item) return null;
  item.status = status;
  item.updatedAt = new Date().toISOString();
  saveLocalComments(list);
  return item;
}

export function deleteLocalComment(id: string): boolean {
  const list = getLocalComments();
  const filtered = list.filter((c) => c._id !== id);
  saveLocalComments(filtered);
  return true;
}

export function addLocalComment(comment: Partial<StoredComment>): StoredComment {
  const list = getLocalComments();
  const newComment: StoredComment = {
    _id: comment._id || `comm_${Date.now()}`,
    article: comment.article || null,
    authorName: comment.authorName || 'Reader',
    authorEmail: comment.authorEmail || '',
    content: comment.content || '',
    status: comment.status || 'pending',
    ipAddress: comment.ipAddress || '127.0.0.1',
    createdAt: new Date().toISOString(),
    ...comment,
  };

  // Prevent duplicates
  const existingIdx = list.findIndex((c) => c._id === newComment._id);
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...newComment };
  } else {
    list.unshift(newComment);
  }

  saveLocalComments(list);
  return newComment;
}

export function getLocalCommentCounts() {
  const list = getLocalComments();
  return {
    all: list.length,
    pending: list.filter((c) => c.status === 'pending').length,
    approved: list.filter((c) => c.status === 'approved').length,
    spam: list.filter((c) => c.status === 'spam').length,
  };
}
