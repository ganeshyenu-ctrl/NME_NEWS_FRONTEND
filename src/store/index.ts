import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import articlesReducer from './slices/articlesSlice';
import categoriesReducer from './slices/categoriesSlice';
import socketReducer from './slices/socketSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    articles: articlesReducer,
    categories: categoriesReducer,
    socket: socketReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
