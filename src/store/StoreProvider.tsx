'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './index';
import { restoreSession } from './slices/authSlice';
import { fetchCategories } from './slices/categoriesSlice';
import { fetchHomepageHighlights, fetchPublicArticles } from './slices/articlesSlice';
import { getSocket } from '@/lib/socket';
import {
  setSocketConnected,
  setBreakingAlert,
  addEditorialEvent,
} from './slices/socketSlice';

function SocketInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Restore auth session
    store.dispatch(restoreSession());

    // 2. Fetch categories globally
    store.dispatch(fetchCategories());

    // 3. Connect socket & register global events
    const socket = getSocket();

    const onConnect = () => {
      store.dispatch(setSocketConnected(true));
    };

    const onDisconnect = () => {
      store.dispatch(setSocketConnected(false));
    };

    const onBreaking = (data: { title: string; slug: string }) => {
      store.dispatch(setBreakingAlert(data));
      // Dynamically refresh public articles & highlights
      store.dispatch(fetchHomepageHighlights());
      store.dispatch(fetchPublicArticles({ limit: 8 }));
    };

    const onNewArticle = () => {
      // Auto-refresh when CRM publishes any article
      store.dispatch(fetchHomepageHighlights());
      store.dispatch(fetchPublicArticles({ limit: 8 }));
    };

    const onCategoriesUpdated = () => {
      store.dispatch(fetchCategories());
    };

    const onEditorial = (event: any) => {
      store.dispatch(addEditorialEvent(event));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('breaking_news_alert', onBreaking);
    socket.on('new_article_published', onNewArticle);
    socket.on('categories_updated', onCategoriesUpdated);
    socket.on('editorial_activity', onEditorial);

    if (socket.connected) {
      store.dispatch(setSocketConnected(true));
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('breaking_news_alert', onBreaking);
      socket.off('new_article_published', onNewArticle);
      socket.off('categories_updated', onCategoriesUpdated);
      socket.off('editorial_activity', onEditorial);
    };
  }, []);

  return <>{children}</>;
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SocketInitializer>{children}</SocketInitializer>
    </Provider>
  );
}
