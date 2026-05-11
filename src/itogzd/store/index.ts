import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import documentsReducer from './slices/documentsSlice';
import spreadsheetReducer from './slices/spreadsheetSlice';
import authReducer from './slices/authSlice';
import { autosaveMiddleware } from './middleware/autosaveMiddleware';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    documents: documentsReducer,
    spreadsheet: spreadsheetReducer,
    auth: authReducer,
    },
    
  middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(autosaveMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;