import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import documentsReducer from './slices/documentsSlice';
import spreadsheetReducer from './slices/spreadsheetSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    documents: documentsReducer,
    spreadsheet: spreadsheetReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;