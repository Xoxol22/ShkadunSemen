import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DocumentItem = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  preview: string[][];
};

type ActiveDocument = {
  id: string;
  title: string;
  preview: string[][];
};

type DocumentsState = {
  items: DocumentItem[];
  isLoading: boolean;
  activeDocument: ActiveDocument | null;
};

const initialState: DocumentsState = {
  items: [],
  isLoading: false,
  activeDocument: null,
};

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setDocuments(state, action: PayloadAction<DocumentItem[]>) {
      state.items = action.payload;
    },

    setDocumentsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    setActiveDocument(state, action: PayloadAction<ActiveDocument | null>) {
      state.activeDocument = action.payload;
    },

    renameDocument(
      state,
      action: PayloadAction<{ documentId: string; title: string; updatedAt: string }>,
    ) {
      const document = state.items.find((item) => item.id === action.payload.documentId);

      if (document) {
        document.title = action.payload.title;
        document.updatedAt = action.payload.updatedAt;
      }
    },

    deleteDocument(state, action: PayloadAction<string>) {
      state.items = state.items.filter((document) => document.id !== action.payload);
    },

    addDocument(state, action: PayloadAction<DocumentItem>) {
      state.items.push(action.payload);
    },

    updateDocumentPreview(
      state,
      action: PayloadAction<{
        documentId: string;
        preview: string[][];
        updatedAt: string;
      }>,
    ) {
      const document = state.items.find((item) => item.id === action.payload.documentId);

      if (document) {
        document.preview = action.payload.preview;
        document.updatedAt = action.payload.updatedAt;
      }
    },
  },
});

export const {
  setDocuments,
  setDocumentsLoading,
  setActiveDocument,
  renameDocument,
  deleteDocument,
  addDocument,
  updateDocumentPreview,
} = documentsSlice.actions;

export default documentsSlice.reducer;