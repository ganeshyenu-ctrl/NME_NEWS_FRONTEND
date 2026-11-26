import { CampaignItem } from '@/types';

const STORAGE_KEY = 'nme_campaigns_cache';

const INITIAL_CAMPAIGNS: CampaignItem[] = [];

export function getLocalCampaigns(): CampaignItem[] {
  if (typeof window === 'undefined') return INITIAL_CAMPAIGNS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CAMPAIGNS));
      return INITIAL_CAMPAIGNS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CAMPAIGNS;
  } catch {
    return INITIAL_CAMPAIGNS;
  }
}

export function saveLocalCampaigns(campaigns: CampaignItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
  } catch (err) {
    console.error('Failed to save local campaigns', err);
  }
}

export function getLocalCampaignById(id: string): CampaignItem | null {
  const list = getLocalCampaigns();
  return list.find((c) => c._id === id || c.id === id) || null;
}

export function upsertLocalCampaign(campaign: Partial<CampaignItem> & { _id?: string; id?: string }): CampaignItem {
  const list = getLocalCampaigns();
  const targetId = campaign._id || campaign.id || `camp_${Date.now()}`;
  const existingIndex = list.findIndex((c) => c._id === targetId || c.id === targetId);

  const nowStr = new Date().toISOString();
  if (existingIndex >= 0) {
    const updated = {
      ...list[existingIndex],
      ...campaign,
      _id: targetId,
      updatedAt: nowStr,
    };
    list[existingIndex] = updated as CampaignItem;
    saveLocalCampaigns(list);
    return updated as CampaignItem;
  } else {
    const created: CampaignItem = {
      _id: targetId,
      subject: campaign.subject || 'Untitled Campaign',
      preview: campaign.preview || '',
      intro: campaign.intro || '',
      articleIds: campaign.articleIds || [],
      status: campaign.status || 'DRAFT',
      scheduledAt: campaign.scheduledAt || null,
      sentAt: campaign.sentAt || null,
      report: campaign.report || null,
      createdAt: nowStr,
      updatedAt: nowStr,
      ...campaign,
    };
    list.unshift(created);
    saveLocalCampaigns(list);
    return created;
  }
}

export function duplicateLocalCampaign(id: string): CampaignItem | null {
  const target = getLocalCampaignById(id);
  if (!target) return null;
  const newId = `camp_${Date.now()}`;
  const dup: CampaignItem = {
    ...target,
    _id: newId,
    id: newId,
    subject: `Copy of ${target.subject || 'Untitled'}`,
    status: 'DRAFT',
    scheduledAt: null,
    sentAt: null,
    report: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const list = getLocalCampaigns();
  list.unshift(dup);
  saveLocalCampaigns(list);
  return dup;
}

export function deleteLocalCampaign(id: string): void {
  const list = getLocalCampaigns().filter((c) => c._id !== id && c.id !== id);
  saveLocalCampaigns(list);
}
