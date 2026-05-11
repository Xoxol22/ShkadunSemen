import { describe, expect, it } from 'vitest';
import documentsReducer, {
	addDocument,
	deleteDocument,
	renameDocument,
	setActiveDocument,
	setDocuments,
	setDocumentsLoading,
	updateDocumentPreview,
} from '../documentsSlice';

const document = {
	id: '1',
	title: 'Таблица 1',
	createdAt: '11.05.2026',
	updatedAt: '11.05.2026',
	preview: [
		['A', 'B', 'C'],
		['1', '2', '3'],
		['4', '5', '6'],
	],
};

describe('documentsSlice', () => {
	it('устанавливает список документов', () => {
		const state = documentsReducer(undefined, setDocuments([document]));

		expect(state.items).toHaveLength(1);
		expect(state.items[0].title).toBe('Таблица 1');
	});

	it('изменяет статус загрузки', () => {
		const state = documentsReducer(undefined, setDocumentsLoading(true));

		expect(state.isLoading).toBe(true);
	});

	it('устанавливает активный документ', () => {
		const state = documentsReducer(
			undefined,
			setActiveDocument({
				id: document.id,
				title: document.title,
				preview: document.preview,
			}),
		);

		expect(state.activeDocument?.id).toBe('1');
	});

	it('переименовывает документ', () => {
		const initialState = documentsReducer(undefined, setDocuments([document]));

		const state = documentsReducer(
			initialState,
			renameDocument({
				documentId: '1',
				title: 'Новое имя',
				updatedAt: '12.05.2026',
			}),
		);

		expect(state.items[0].title).toBe('Новое имя');
		expect(state.items[0].updatedAt).toBe('12.05.2026');
	});

	it('удаляет документ', () => {
		const initialState = documentsReducer(undefined, setDocuments([document]));

		const state = documentsReducer(initialState, deleteDocument('1'));

		expect(state.items).toHaveLength(0);
	});

	it('добавляет документ', () => {
		const state = documentsReducer(undefined, addDocument(document));

		expect(state.items).toHaveLength(1);
		expect(state.items[0].id).toBe('1');
	});

	it('обновляет preview документа', () => {
		const initialState = documentsReducer(undefined, setDocuments([document]));

		const state = documentsReducer(
			initialState,
			updateDocumentPreview({
				documentId: '1',
				preview: [['X']],
				updatedAt: '13.05.2026',
			}),
		);

		expect(state.items[0].preview[0][0]).toBe('X');
		expect(state.items[0].updatedAt).toBe('13.05.2026');
	});
});