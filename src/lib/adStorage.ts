import { AdCampaignItem } from '@/types';

const AD_STORAGE_KEY = 'nme_advertisement_campaigns_cache';

export const INITIAL_SAMPLE_ADS: AdCampaignItem[] = [
  {
    _id: 'ad_sample_1',
    id: 'ad_sample_1',
    title: 'Global Maritime Decarbonisation Summit 2026',
    advertiser: 'Global Maritime Forum',
    placement: 'homepage_top',
    headline: 'Navigating Net-Zero Shipping Regulations & Sustainable Fuels',
    description: 'Join 1,200+ shipowners, charterers, port authorities, and technology leaders in Singapore this October.',
    imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
    targetUrl: 'https://www.globalmaritimeforum.org',
    callToAction: 'Register Delegate Pass',
    badgeText: 'AD',
    status: 'ACTIVE',
    impressions: 480,
    clicks: 34,
    ctr: 7.08,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'ad_sample_2',
    id: 'ad_sample_2',
    title: 'Next-Generation Multi-Fuel Marine Engines',
    advertiser: 'Wärtsilä Power Systems',
    placement: 'homepage_mid',
    headline: 'Future-Proof Your Commercial Fleet with Methanol & Ammonia Ready Propulsion',
    description: 'Ultra-low emission marine engines designed for next-decade environmental compliance and fuel efficiency.',
    imageUrl: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&w=1200&q=80',
    targetUrl: 'https://www.wartsila.com/marine',
    callToAction: 'Explore Engine Specifications',
    badgeText: 'AD',
    status: 'ACTIVE',
    impressions: 320,
    clicks: 22,
    ctr: 6.88,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'ad_sample_3',
    id: 'ad_sample_3',
    title: 'Fleet Emissions & EU ETS Compliance Software',
    advertiser: 'DNV Maritime Intelligence',
    placement: 'article_inline',
    headline: 'Automated Carbon Intensity Indicator (CII) & FuelEU Voyage Forecasting',
    description: 'Cut operational compliance fines by up to 35% with real-time digital voyage simulation.',
    imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80',
    targetUrl: 'https://www.dnv.com/maritime',
    callToAction: 'Request Platform Demo',
    badgeText: 'AD',
    status: 'ACTIVE',
    impressions: 590,
    clicks: 48,
    ctr: 8.14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getLocalAds(): AdCampaignItem[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_ADS;
  try {
    const raw = localStorage.getItem(AD_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AD_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_ADS));
      return INITIAL_SAMPLE_ADS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Auto-migrate any legacy sample image & update SPONSORED to AD
      const migrated = parsed.map((item) => {
        let updated = { ...item };
        if (updated._id === 'ad_sample_1' && updated.imageUrl?.includes('photo-1518709268805')) {
          updated.imageUrl =
            'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80';
        }
        if (updated.badgeText === 'SPONSORED') {
          updated.badgeText = 'AD';
        }
        return updated;
      });
      return migrated;
    }
    return INITIAL_SAMPLE_ADS;
  } catch {
    return INITIAL_SAMPLE_ADS;
  }
}

export function saveLocalAds(ads: AdCampaignItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AD_STORAGE_KEY, JSON.stringify(ads));
    window.dispatchEvent(new CustomEvent('nme_ad_metrics_updated'));
  } catch {}
}

export function getLocalAdsByPlacement(placement: string): AdCampaignItem[] {
  const ads = getLocalAds();
  return ads.filter(
    (a) => a.status === 'ACTIVE' && (a.placement === placement || a.placement === 'all')
  );
}

export function upsertLocalAd(adData: Partial<AdCampaignItem>): AdCampaignItem {
  const list = getLocalAds();
  const id = adData._id || adData.id || `ad_${Date.now()}`;
  const existingIdx = list.findIndex((a) => a._id === id || a.id === id);

  const now = new Date().toISOString();
  if (existingIdx >= 0) {
    const updated: AdCampaignItem = {
      ...list[existingIdx],
      ...adData,
      _id: id,
      updatedAt: now,
    };
    list[existingIdx] = updated;
    saveLocalAds(list);
    return updated;
  } else {
    const created: AdCampaignItem = {
      _id: id,
      id,
      title: adData.title || 'Untitled Campaign',
      advertiser: adData.advertiser || 'Sponsored Partner',
      placement: adData.placement || 'homepage_top',
      imageUrl: adData.imageUrl || '',
      targetUrl: adData.targetUrl || '',
      callToAction: adData.callToAction || 'Learn More',
      headline: adData.headline || '',
      description: adData.description || '',
      badgeText: adData.badgeText === 'SPONSORED' ? 'AD' : (adData.badgeText || 'AD'),
      status: adData.status || 'ACTIVE',
      impressions: 0,
      clicks: 0,
      ctr: 0,
      createdAt: now,
      updatedAt: now,
      ...adData,
    };
    list.unshift(created);
    saveLocalAds(list);
    return created;
  }
}

export function toggleLocalAdStatus(id: string): AdCampaignItem | null {
  const list = getLocalAds();
  const item = list.find((a) => a._id === id || a.id === id);
  if (!item) return null;
  item.status = item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  item.updatedAt = new Date().toISOString();
  saveLocalAds(list);
  return item;
}

export function deleteLocalAd(id: string): boolean {
  const list = getLocalAds();
  const filtered = list.filter((a) => a._id !== id && a.id !== id);
  saveLocalAds(filtered);
  return true;
}

export function recordLocalAdImpression(id: string): void {
  const list = getLocalAds();
  const item = list.find((a) => a._id === id || a.id === id);
  if (item) {
    item.impressions = (item.impressions || 0) + 1;
    item.ctr = item.impressions > 0 ? Number(((item.clicks / item.impressions) * 100).toFixed(2)) : 0;
    saveLocalAds(list);
  }
}

export function recordLocalAdClick(id: string): void {
  const list = getLocalAds();
  const item = list.find((a) => a._id === id || a.id === id);
  if (item) {
    item.clicks = (item.clicks || 0) + 1;
    item.ctr = item.impressions > 0 ? Number(((item.clicks / item.impressions) * 100).toFixed(2)) : 0;
    saveLocalAds(list);
  }
}

export function getLocalAdStats() {
  const ads = getLocalAds();
  const total = ads.length;
  const active = ads.filter((a) => a.status === 'ACTIVE').length;
  const paused = ads.filter((a) => a.status === 'PAUSED').length;
  const totalImpressions = ads.reduce((acc, a) => acc + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0);
  const overallCtr =
    totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

  return { total, active, paused, totalImpressions, totalClicks, overallCtr };
}
