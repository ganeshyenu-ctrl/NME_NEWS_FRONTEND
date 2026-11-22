'use client';

import React, { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveReaders } from '@/store/slices/socketSlice';
import { Users } from 'lucide-react';

interface Props {
  articleSlug: string;
}

export default function LiveReaderBadge({ articleSlug }: Props) {
  const dispatch = useAppDispatch();
  const { activeReaders } = useAppSelector((state) => state.socket);

  useEffect(() => {
    const socket = getSocket();

    // Join article room
    socket.emit('join_article', articleSlug);

    const handleCountUpdate = (data: { articleSlug: string; activeReaders: number }) => {
      if (data.articleSlug === articleSlug) {
        dispatch(setActiveReaders(data.activeReaders));
      }
    };

    socket.on('reader_count_update', handleCountUpdate);

    return () => {
      socket.emit('leave_article', articleSlug);
      socket.off('reader_count_update', handleCountUpdate);
    };
  }, [articleSlug, dispatch]);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-900">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
      </span>
      <Users className="h-3 w-3 text-emerald-700 ml-0.5" />
      <span>{activeReaders} {activeReaders === 1 ? 'reader online now' : 'readers online now'}</span>
    </div>
  );
}
