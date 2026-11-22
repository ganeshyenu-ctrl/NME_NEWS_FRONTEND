import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SocketState {
  isConnected: boolean;
  breakingAlert: { title: string; slug: string } | null;
  activeReaders: number;
  liveEditorialEvents: Array<{
    type: string;
    user: string;
    title: string;
    timestamp: string;
  }>;
}

const initialState: SocketState = {
  isConnected: false,
  breakingAlert: null,
  activeReaders: 1,
  liveEditorialEvents: [],
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setBreakingAlert: (state, action: PayloadAction<{ title: string; slug: string }>) => {
      state.breakingAlert = action.payload;
    },
    dismissBreakingAlert: (state) => {
      state.breakingAlert = null;
    },
    setActiveReaders: (state, action: PayloadAction<number>) => {
      state.activeReaders = action.payload;
    },
    addEditorialEvent: (state, action: PayloadAction<any>) => {
      state.liveEditorialEvents.unshift(action.payload);
      if (state.liveEditorialEvents.length > 20) {
        state.liveEditorialEvents.pop();
      }
    },
  },
});

export const {
  setSocketConnected,
  setBreakingAlert,
  dismissBreakingAlert,
  setActiveReaders,
  addEditorialEvent,
} = socketSlice.actions;

export default socketSlice.reducer;
