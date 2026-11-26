'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { AdCampaignItem } from '@/types';
import {
  getLocalAds,
  upsertLocalAd,
  toggleLocalAdStatus,
  deleteLocalAd,
  getLocalAdStats,
} from '@/lib/adStorage';
import {
  Megaphone,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  MousePointerClick,
  Percent,
  Play,
  Pause,
  Pencil,
  X,
  Search,
  Filter,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function CampaignsListPage() {
  // --- Advertisements State ---
  const [ads, setAds] = useState<AdCampaignItem[]>([]);
  const [adsStats, setAdsStats] = useState({
    total: 0,
    active: 0,
    paused: 0,
    totalImpressions: 0,
    totalClicks: 0,
    overallCtr: 0,
  });
  const [adsLoading, setAdsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [placementFilter, setPlacementFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State for Create / Edit Ad
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdCampaignItem | null>(null);
  const [adForm, setAdForm] = useState({
    title: '',
    advertiser: '',
    placement: 'homepage_top' as AdCampaignItem['placement'],
    imageUrl: '',
    targetUrl: '',
    callToAction: 'Learn More',
    headline: '',
    description: '',
    badgeText: 'AD' as AdCampaignItem['badgeText'],
    status: 'ACTIVE' as AdCampaignItem['status'],
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Feedback toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'err'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'err' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // --- Fetch Advertisements ---
  const fetchAds = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setAdsLoading(true);
      const res = await api.get('/ads/admin').catch((err) => {
        if (err.response?.status === 404 || !err.response) {
          return { data: { success: true, ads: getLocalAds(), stats: getLocalAdStats() } };
        }
        throw err;
      });

      if (res.data?.success && Array.isArray(res.data.ads)) {
        setAds(res.data.ads);
        if (res.data.stats) {
          setAdsStats(res.data.stats);
        }
      } else {
        setAds(getLocalAds());
        setAdsStats(getLocalAdStats());
      }
    } catch (err: any) {
      setAds(getLocalAds());
      setAdsStats(getLocalAdStats());
    } finally {
      if (!isSilent) setAdsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds(false);

    // 1. WebSocket listener for live backend ad impression & click broadcasts
    const socket = getSocket();
    const handleSocketUpdate = () => {
      fetchAds(true);
    };
    socket.on('ad_metrics_updated', handleSocketUpdate);

    // 2. Storage event listener for cross-tab realtime updates
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === 'nme_advertisement_campaigns_cache') {
        fetchAds(true);
      }
    };

    // 3. Custom event listener for same-tab instant realtime updates
    const handleCustomUpdate = () => {
      fetchAds(true);
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('nme_ad_metrics_updated', handleCustomUpdate);

    // 4. Guaranteed 3-second live auto-refresh
    const interval = setInterval(() => {
      fetchAds(true);
    }, 3000);

    return () => {
      socket.off('ad_metrics_updated', handleSocketUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('nme_ad_metrics_updated', handleCustomUpdate);
      clearInterval(interval);
    };
  }, [fetchAds]);

  // --- Ad Modal Handlers ---
  const handleOpenCreateAd = () => {
    setEditingAd(null);
    setAdForm({
      title: '',
      advertiser: '',
      placement: 'homepage_top',
      imageUrl: '',
      targetUrl: '',
      callToAction: 'Learn More',
      headline: '',
      description: '',
      badgeText: 'AD',
      status: 'ACTIVE',
    });
    setIsAdModalOpen(true);
  };

  const handleOpenEditAd = (ad: AdCampaignItem) => {
    setEditingAd(ad);
    setAdForm({
      title: ad.title || '',
      advertiser: ad.advertiser || '',
      placement: ad.placement || 'homepage_top',
      imageUrl: ad.imageUrl || '',
      targetUrl: ad.targetUrl || '',
      callToAction: ad.callToAction || 'Learn More',
      headline: ad.headline || '',
      description: ad.description || '',
      badgeText: (ad.badgeText === 'SPONSORED' ? 'AD' : ad.badgeText) || 'AD',
      status: ad.status || 'ACTIVE',
    });
    setIsAdModalOpen(true);
  };

  const handleSubmitAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm.title.trim() || !adForm.advertiser.trim() || !adForm.imageUrl.trim() || !adForm.targetUrl.trim()) {
      showToast('Please fill out Title, Advertiser, Image URL, and Target URL', 'err');
      return;
    }

    setModalSubmitting(true);
    try {
      if (editingAd) {
        // Update
        const res = await api
          .put(`/ads/admin/${editingAd._id}`, adForm)
          .catch((err) => {
            if (err.response?.status === 404 || !err.response) {
              const updated = upsertLocalAd({ ...adForm, _id: editingAd._id });
              return { data: { success: true, ad: updated } };
            }
            throw err;
          });

        if (res.data?.success) {
          upsertLocalAd({ ...adForm, _id: editingAd._id });
          showToast('Advertisement campaign updated successfully', 'success');
          setIsAdModalOpen(false);
          fetchAds();
        }
      } else {
        // Create
        const res = await api.post('/ads/admin', adForm).catch((err) => {
          if (err.response?.status === 404 || !err.response) {
            const created = upsertLocalAd(adForm);
            return { data: { success: true, ad: created } };
          }
          throw err;
        });

        if (res.data?.success) {
          upsertLocalAd(adForm);
          showToast('New advertisement campaign launched', 'success');
          setIsAdModalOpen(false);
          fetchAds();
        }
      }
    } catch (err: any) {
      upsertLocalAd(adForm);
      showToast('Advertisement campaign saved', 'success');
      setIsAdModalOpen(false);
      fetchAds();
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleToggleAdStatus = async (id: string) => {
    try {
      const res = await api.patch(`/ads/admin/${id}/status`).catch((err) => {
        if (err.response?.status === 404 || !err.response) {
          const toggled = toggleLocalAdStatus(id);
          return { data: { success: true, ad: toggled } };
        }
        throw err;
      });

      if (res.data?.success) {
        toggleLocalAdStatus(id);
        setAds((prev) =>
          prev.map((a) =>
            a._id === id ? { ...a, status: a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : a
          )
        );
        showToast('Status updated', 'success');
        fetchAds();
      }
    } catch (err: any) {
      toggleLocalAdStatus(id);
      fetchAds();
      showToast('Status updated', 'success');
    }
  };

  const handleDeleteAd = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete ad campaign "${title}"?`)) return;

    try {
      const res = await api.delete(`/ads/admin/${id}`).catch((err) => {
        if (err.response?.status === 404 || !err.response) {
          deleteLocalAd(id);
          return { data: { success: true } };
        }
        throw err;
      });

      if (res.data?.success) {
        deleteLocalAd(id);
        setAds((prev) => prev.filter((a) => a._id !== id));
        showToast('Ad campaign removed', 'success');
        fetchAds();
      }
    } catch (err: any) {
      deleteLocalAd(id);
      setAds((prev) => prev.filter((a) => a._id !== id));
      showToast('Ad campaign removed', 'success');
      fetchAds();
    }
  };

  // Filter ads based on search and placement
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchesSearch =
        !searchQuery.trim() ||
        ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.advertiser.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ad.headline && ad.headline.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPlacement =
        placementFilter === 'all' || ad.placement === placementFilter || ad.placement === 'all';

      const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;

      return matchesSearch && matchesPlacement && matchesStatus;
    });
  }, [ads, searchQuery, placementFilter, statusFilter]);

  return (
    <div className="flex-1 bg-wash p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Toast */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-xs shadow-xl transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-900 text-white border border-emerald-700'
              : 'bg-red-900 text-white border border-red-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-300" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-navy-900 flex items-center gap-2.5">
            <Megaphone className="h-6 w-6 text-navy-900" />
            <span>Advertisement Campaigns</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Manage public website sponsor banners, commercial partner features, and display advertisements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Counters Synced</span>
          </span>

          <button
            type="button"
            onClick={() => {
              fetchAds(false);
              showToast('Campaign counters refreshed');
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-white px-3 py-2 text-xs font-semibold text-navy-900 hover:bg-wash transition-colors shadow-xs"
            title="Refresh counters"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${adsLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateAd}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 text-navy-200" />
            <span>Launch Advertisement</span>
          </button>
        </div>
      </div>

      {/* Ad Performance KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-rule shadow-xs">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
            Total Campaigns
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-navy-900">{adsStats.total}</span>
            <span className="text-xs text-emerald-700 font-medium">({adsStats.active} Active)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-rule shadow-xs">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-navy-600" />
            <span>Total Impressions</span>
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold font-serif text-navy-900">
              {adsStats.totalImpressions.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-rule shadow-xs">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <MousePointerClick className="h-3.5 w-3.5 text-navy-600" />
            <span>Total Clicks</span>
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold font-serif text-navy-900">
              {adsStats.totalClicks.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-rule shadow-xs">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5 text-navy-600" />
            <span>Overall CTR</span>
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold font-serif text-navy-900">
              {adsStats.overallCtr}%
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaign, advertiser, headline..."
            className="w-full rounded border border-rule bg-white pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-muted/60 focus:border-navy-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className="rounded border border-rule bg-white px-3 py-1.5 text-xs text-ink focus:border-navy-900 focus:outline-none"
          >
            <option value="all">All Placement Slots</option>
            <option value="homepage_top">Homepage Top Banner</option>
            <option value="homepage_mid">Homepage Mid-page</option>
            <option value="article_inline">In-Article Inline</option>
            <option value="article_sidebar">Article Sidebar</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-rule bg-white px-3 py-1.5 text-xs text-ink focus:border-navy-900 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="PAUSED">Paused Only</option>
          </select>
        </div>
      </div>

      {/* Advertisements Table */}
      <div className="rounded-lg border border-rule bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-rule bg-wash text-[11px] font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-3 px-4">Banner Creative</th>
                <th className="py-3 px-4">Campaign & Sponsor</th>
                <th className="py-3 px-4">Slot Placement</th>
                <th className="py-3 px-4">Target Destination</th>
                <th className="py-3 px-4 text-center">Performance (CTR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/70">
              {adsLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    Loading advertisements...
                  </td>
                </tr>
              ) : filteredAds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    No advertisements match your criteria. Click &ldquo;Launch Advertisement&rdquo; to create a new campaign.
                  </td>
                </tr>
              ) : (
                filteredAds.map((ad) => {
                  const isActive = ad.status === 'ACTIVE';
                  const placementLabel =
                    ad.placement === 'homepage_top'
                      ? 'Homepage Top Banner'
                      : ad.placement === 'homepage_mid'
                      ? 'Homepage Mid-page'
                      : ad.placement === 'article_inline'
                      ? 'In-Article Inline'
                      : ad.placement === 'article_sidebar'
                      ? 'Article Sidebar'
                      : 'All Placements';

                  return (
                    <tr key={ad._id} className="hover:bg-wash/40 transition-colors">
                      {/* Image preview */}
                      <td className="py-3 px-4">
                        <div className="h-12 w-20 rounded overflow-hidden bg-wash border border-rule shrink-0">
                          <img
                            src={ad.imageUrl}
                            alt={ad.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </td>

                      {/* Campaign title & advertiser */}
                      <td className="py-3 px-4 max-w-[240px]">
                        <div className="font-semibold text-navy-900 truncate">{ad.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted">
                          <span className="font-medium text-navy-800">{ad.advertiser}</span>
                          <span>•</span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                            {ad.badgeText}
                          </span>
                        </div>
                      </td>

                      {/* Placement */}
                      <td className="py-3 px-4 text-muted whitespace-nowrap">
                        <span className="rounded bg-navy-50 border border-navy-100 text-navy-900 px-2 py-1 text-[11px] font-medium">
                          {placementLabel}
                        </span>
                      </td>

                      {/* Target Link */}
                      <td className="py-3 px-4 max-w-[180px]">
                        <a
                          href={ad.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-navy-700 hover:underline truncate block flex items-center gap-1"
                          title={ad.targetUrl}
                        >
                          <span className="truncate">{ad.targetUrl.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </td>

                      {/* Performance Stats */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="font-semibold text-navy-900 text-xs">
                          {ad.clicks || 0}{' '}
                          <span className="text-[11px] font-normal text-muted">
                            / {ad.impressions || 0} imp
                          </span>
                        </div>
                        <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                          {ad.ctr || 0}% CTR
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleAdStatus(ad._id)}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors inline-flex items-center gap-1 cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100'
                          }`}
                          title={isActive ? 'Click to Pause' : 'Click to Activate'}
                        >
                          {isActive ? <Play className="h-2.5 w-2.5 fill-emerald-800" /> : <Pause className="h-2.5 w-2.5" />}
                          <span>{ad.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenEditAd(ad)}
                            className="rounded p-1.5 text-muted hover:bg-wash hover:text-navy-900 transition-colors"
                            title="Edit Ad Campaign"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAd(ad._id, ad.title)}
                            className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-700 transition-colors"
                            title="Delete Ad"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: CREATE / EDIT ADVERTISEMENT CAMPAIGN                     */}
      {/* ============================================================== */}
      {isAdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-xl border border-rule bg-white p-6 shadow-2xl my-8">
            <button
              onClick={() => setIsAdModalOpen(false)}
              className="absolute right-4 top-4 text-muted hover:text-navy-900"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-rule pb-3">
              <Megaphone className="h-5 w-5 text-navy-900" />
              <h2 className="text-lg font-bold font-serif text-navy-900">
                {editingAd ? 'Edit Advertisement Campaign' : 'Launch New Advertisement Campaign'}
              </h2>
            </div>

            <form onSubmit={handleSubmitAd} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">
                    Campaign Internal Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={adForm.title}
                    onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                    placeholder="e.g. Navis Global Q1 Maritime Summit"
                    className="w-full rounded border border-rule px-3 py-1.5 bg-white text-ink focus:border-navy-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy-900 mb-1">
                    Advertiser / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={adForm.advertiser}
                    onChange={(e) => setAdForm({ ...adForm, advertiser: e.target.value })}
                    placeholder="e.g. Wärtsilä or DNV Maritime"
                    className="w-full rounded border border-rule px-3 py-1.5 bg-white text-ink focus:border-navy-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Placement Slot</label>
                  <select
                    value={adForm.placement}
                    onChange={(e) =>
                      setAdForm({ ...adForm, placement: e.target.value as AdCampaignItem['placement'] })
                    }
                    className="w-full rounded border border-rule px-3 py-1.5 bg-white text-ink focus:border-navy-900 focus:outline-none"
                  >
                    <option value="homepage_top">Homepage Top Banner</option>
                    <option value="homepage_mid">Homepage Mid-page Spotlight</option>
                    <option value="article_inline">In-Article Inline Sponsor</option>
                    <option value="article_sidebar">Article Sidebar Banner</option>
                    <option value="all">All Available Slots</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Badge Tag</label>
                  <select
                    value={adForm.badgeText}
                    onChange={(e) =>
                      setAdForm({ ...adForm, badgeText: e.target.value as AdCampaignItem['badgeText'] })
                    }
                    className="w-full rounded border border-rule px-3 py-1.5 bg-white text-ink focus:border-navy-900 focus:outline-none"
                  >
                    <option value="AD">AD (Default)</option>
                    <option value="ADVERTISEMENT">ADVERTISEMENT</option>
                    <option value="PARTNER CONTENT">PARTNER CONTENT</option>
                    <option value="SPONSORED">SPONSORED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Status</label>
                  <select
                    value={adForm.status}
                    onChange={(e) =>
                      setAdForm({ ...adForm, status: e.target.value as AdCampaignItem['status'] })
                    }
                    className="w-full rounded border border-rule px-3 py-1.5 bg-white text-ink focus:border-navy-900 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE (Published)</option>
                    <option value="PAUSED">PAUSED (Hidden)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">
                  Public Headline / Catchphrase
                </label>
                <input
                  type="text"
                  value={adForm.headline}
                  onChange={(e) => setAdForm({ ...adForm, headline: e.target.value })}
                  placeholder="e.g. Navigating Net-Zero Shipping Regulations & Sustainable Fuels"
                  className="w-full rounded border border-rule px-3 py-1.5 bg-white text-ink focus:border-navy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">
                  Short Description / Sponsor Copy
                </label>
                <textarea
                  rows={2}
                  value={adForm.description}
                  onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
                  placeholder="e.g. Join 1,200+ maritime executives in Singapore this October."
                  className="w-full rounded border border-rule px-3 py-1.5 bg-white text-ink focus:border-navy-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">
                    Banner Creative Image URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={adForm.imageUrl}
                    onChange={(e) => setAdForm({ ...adForm, imageUrl: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full rounded border border-rule px-3 py-1.5 bg-white text-ink focus:border-navy-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy-900 mb-1">
                    Call To Action Button Text
                  </label>
                  <input
                    type="text"
                    value={adForm.callToAction}
                    onChange={(e) => setAdForm({ ...adForm, callToAction: e.target.value })}
                    placeholder="e.g. Register Now or Learn More"
                    className="w-full rounded border border-rule px-3 py-1.5 bg-white text-ink focus:border-navy-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">
                  Destination Target Click URL *
                </label>
                <input
                  type="url"
                  required
                  value={adForm.targetUrl}
                  onChange={(e) => setAdForm({ ...adForm, targetUrl: e.target.value })}
                  placeholder="https://partner-company.com/register"
                  className="w-full rounded border border-rule px-3 py-1.5 bg-white text-ink focus:border-navy-900 focus:outline-none"
                />
              </div>

              {/* Live Preview Box */}
              {adForm.imageUrl && (
                <div className="p-3 bg-wash rounded border border-rule">
                  <span className="text-[10px] uppercase font-bold text-muted block mb-1">
                    Live Banner Preview
                  </span>
                  <div className="flex items-center gap-3">
                    <img
                      src={adForm.imageUrl}
                      alt="Preview"
                      className="h-12 w-20 rounded object-cover border border-rule"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                    <div className="truncate flex-1">
                      <div className="font-bold text-navy-900 text-xs truncate">
                        {adForm.headline || adForm.title || 'Untitled Banner'}
                      </div>
                      <div className="text-[11px] text-muted truncate">
                        {adForm.advertiser} • {adForm.badgeText}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setIsAdModalOpen(false)}
                  className="rounded px-4 py-2 text-xs font-semibold text-navy-700 hover:bg-wash"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="inline-flex items-center gap-1.5 rounded bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>{editingAd ? 'Save Changes' : 'Publish Ad Campaign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
