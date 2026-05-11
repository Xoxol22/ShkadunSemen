import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadSavedDocument } from '../../features/documents/mockDocumentsApi';
import { patchDocument } from '../../features/documents/mockDocumentsApi';
import type { CellData } from '../../types';

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

export const loadDocuments = createAsyncThunk(
	'documents/loadDocuments',
	async () => {
		const response = await fetch('/itogzd/files/documents.json');

		if (!response.ok) {
			throw new Error('Failed to load documents');
		}

		const data = (await response.json()) as DocumentItem[];

        const localDocuments = JSON.parse(
            localStorage.getItem('documents:list') ?? '[]',
        ) as DocumentItem[];

        const allDocuments = [
            ...data,
            ...localDocuments.filter(
                (localDocument) =>
                    !data.some((document) => document.id === localDocument.id),
            ),
        ];

		return allDocuments.map((document) => { 
			const savedDocument = loadSavedDocument(document.id);

			if (!savedDocument?.cells) {
				return document;
			}

			const preview = Array.from({ length: 3 }, (_, rowIndex) =>
				Array.from({ length: 3 }, (_, colIndex) => {
					const cell = savedDocument.cells[`${rowIndex}:${colIndex}`];

					return cell?.raw ?? '';
				}),
			);

			return {
				...document,
				preview,
				updatedAt: savedDocument.updatedAt
					? new Date(savedDocument.updatedAt).toLocaleDateString('ru-RU')
					: document.updatedAt,
			};
		});
	},
);

export const saveDocument = createAsyncThunk(
	'documents/saveDocument',
	async (payload: {
		documentId: string;
		cells: Record<string, CellData>;
		updatedAt: string;
	}) => {
		await patchDocument(payload.documentId, {
			cells: payload.cells,
			updatedAt: payload.updatedAt,
		});

		return payload;
	},
);

export const loadDocumentById = createAsyncThunk(
	'documents/loadDocumentById',

	async (documentId: string, { getState }) => {
		const state = getState() as {
			documents: DocumentsState;
		};

		const document = state.documents.items.find(
			(item) => item.id === documentId,
		);

		if (!document) {
			throw new Error('Document not found');
		}

		return document;
	},
);

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
    extraReducers: (builder) => {
        builder
            .addCase(loadDocuments.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(loadDocuments.fulfilled, (state, action) => {
                state.items = action.payload;
                state.isLoading = false;
            })
            .addCase(loadDocuments.rejected, (state) => {
                state.items = [];
                state.isLoading = false;
            })
            .addCase(loadDocumentById.fulfilled, (state, action) => {
	            state.activeDocument = action.payload;
            });
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