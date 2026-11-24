import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PlatformSettings } from '@/types';
import { api } from '@/lib/api';

interface SettingsState {
  settings: PlatformSettings;
  loading: boolean;
  error: string | null;
}

export const DEFAULT_SETTINGS: PlatformSettings = {
  publicationName: 'NME',
  tagline: 'Independent Perspectives. Informed Maritime Decisions.',
  contactEmail: 'contact@nmepublications.com',
  linkedinUrl: 'https://www.linkedin.com/company/navigating-marine-excellence',
  aboutText: 'Navigating Marine Excellence (NME) delivers independent maritime journalism, commercial shipping intelligence, technology breakthroughs, and regulatory analysis to global maritime leaders and professionals.',
  termsText: 'All articles, dispatches, and media published on NME are protected by international copyright laws. Reproduction without prior written editorial consent is strictly prohibited.',
  privacyText: 'NME respects your privacy. We collect minimal operational data solely to deliver editorial newsletters, provide live reader interaction, and safeguard platform security. We never sell your personal information.',
  maintenanceMode: false,
};

const initialState: SettingsState = {
  settings: DEFAULT_SETTINGS,
  loading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/settings');
      return response.data?.settings || DEFAULT_SETTINGS;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch settings');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<PlatformSettings>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = { ...DEFAULT_SETTINGS, ...action.payload };
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
