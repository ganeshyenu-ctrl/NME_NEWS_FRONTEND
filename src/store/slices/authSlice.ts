import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, accessToken, refreshToken } = response.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('nme_access_token', accessToken);
        localStorage.setItem('nme_refresh_token', refreshToken);
        localStorage.setItem('nme_user', JSON.stringify(user));
      }

      return { user, accessToken };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      return rejectWithValue(msg);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await api.post('/auth/logout');
  } catch (err) {}

  if (typeof window !== 'undefined') {
    localStorage.removeItem('nme_access_token');
    localStorage.removeItem('nme_refresh_token');
    localStorage.removeItem('nme_user');
  }
  return true;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    restoreSession: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('nme_access_token');
        const userStr = localStorage.getItem('nme_user');
        if (token && userStr) {
          try {
            state.user = JSON.parse(userStr);
            state.accessToken = token;
            state.isAuthenticated = true;
          } catch (e) {
            localStorage.removeItem('nme_user');
          }
        }
      }
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    updateUserSession: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (typeof window !== 'undefined') {
          localStorage.setItem('nme_user', JSON.stringify(state.user));
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { restoreSession, clearAuthError, updateUserSession } = authSlice.actions;
export default authSlice.reducer;
