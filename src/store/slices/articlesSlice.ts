import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { Article } from '@/types';

interface ArticlesState {
  articles: Article[];
  leadArticle: Article | null;
  breakingNews: { title: string; slug: string }[];
  trending: Article[];
  currentArticle: Article | null;
  relatedArticles: Article[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: ArticlesState = {
  articles: [],
  leadArticle: null,
  breakingNews: [],
  trending: [],
  currentArticle: null,
  relatedArticles: [],
  total: 0,
  page: 1,
  totalPages: 1,
  loading: false,
  error: null,
};

export const fetchHomepageHighlights = createAsyncThunk(
  'articles/fetchHomepageHighlights',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/articles/highlights');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch highlights');
    }
  }
);

export const fetchPublicArticles = createAsyncThunk(
  'articles/fetchPublicArticles',
  async (
    params: { category?: string; search?: string; page?: number; limit?: number; sort?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get('/articles/public', { params });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch articles');
    }
  }
);

export const fetchArticleBySlug = createAsyncThunk(
  'articles/fetchArticleBySlug',
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/articles/public/${slug}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Article not found');
    }
  }
);

const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    clearCurrentArticle: (state) => {
      state.currentArticle = null;
      state.relatedArticles = [];
    },
    prependArticle: (state, action) => {
      state.articles.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    // Highlights
    builder
      .addCase(fetchHomepageHighlights.fulfilled, (state, action) => {
        state.leadArticle = action.payload.lead;
        state.breakingNews = action.payload.breakingNews || [];
        state.trending = action.payload.trending || [];
      })
      // Public articles
      .addCase(fetchPublicArticles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPublicArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.articles = action.payload.articles;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchPublicArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Single article
      .addCase(fetchArticleBySlug.pending, (state) => {
        state.loading = true;
        state.currentArticle = null;
      })
      .addCase(fetchArticleBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.currentArticle = action.payload.article;
        state.relatedArticles = action.payload.relatedArticles || [];
      })
      .addCase(fetchArticleBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentArticle, prependArticle } = articlesSlice.actions;
export default articlesSlice.reducer;
