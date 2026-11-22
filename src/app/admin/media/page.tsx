'use client';

import React, { useEffect, useState, useRef } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { api } from '@/lib/api';
import { MediaItem } from '@/types';
import { Upload, Trash2, Copy, Check, Search, Image as ImageIcon, Cloud } from 'lucide-react';

export default function MediaLibraryPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get('/media', {
        params: { search: search.trim() || undefined },
      });
      if (res.data?.success) {
        setMediaList(res.data.media);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchMedia();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload media');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Permanently delete "${name}"?`)) {
      try {
        await api.delete(`/media/${id}`);
        fetchMedia();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete asset');
      }
    }
  };

  const copyUrl = (url: string, id: string) => {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <>
      <AdminHeader
        title="Media Library"
        actions={
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{uploading ? 'Uploading...' : 'Upload Asset'}</span>
            </button>
          </div>
        }
      />

      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg border border-rule">
          <div className="relative flex-1 max-w-sm">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets by file name..."
              className="w-full rounded-md border border-rule bg-white py-1.5 pl-3 pr-8 text-xs focus:border-navy-900 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchMedia}
            className="rounded-md border border-rule bg-wash px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-rule transition-colors"
          >
            Search
          </button>
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="py-20 text-center text-muted">Loading media assets...</div>
        ) : mediaList.length === 0 ? (
          <div className="rounded-lg border border-dashed border-rule bg-white p-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted mx-auto mb-3 opacity-40" />
            <h3 className="font-serif text-lg font-bold text-navy-900 mb-1">No media assets found</h3>
            <p className="text-xs text-muted mb-4">Upload high-resolution photography, diagrams, and maritime charts.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload First Asset</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaList.map((item) => (
              <div
                key={item._id}
                className="group rounded-lg border border-rule bg-white overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="aspect-square bg-wash relative overflow-hidden flex items-center justify-center">
                  {item.mimeType.startsWith('image/') ? (
                    <img src={item.url} alt={item.originalName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center p-3 text-muted">
                      <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px] font-mono uppercase">{item.mimeType.split('/')[1]}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-rule space-y-1">
                  <p className="text-xs font-semibold text-navy-900 truncate" title={item.originalName}>
                    {item.originalName}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-muted font-mono">
                    <span>{(item.size / 1024).toFixed(1)} KB</span>
                    {item.storageType === 'cloudinary' && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-sans font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                        <Cloud className="h-2.5 w-2.5 text-sky-600" />
                        Cloud
                      </span>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-rule/50">
                    <button
                      onClick={() => copyUrl(item.url, item._id)}
                      className="inline-flex items-center gap-1 text-[11px] text-navy-700 hover:text-navy-900"
                      title="Copy URL"
                    >
                      {copiedId === item._id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>URL</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(item._id, item.originalName)}
                      className="text-muted hover:text-signal p-1"
                      title="Delete asset"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
