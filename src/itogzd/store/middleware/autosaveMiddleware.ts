import type { Middleware, UnknownAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../index';
import { saveDocument } from '../slices/documentsSlice';
import { setSaveStatus, setUnsavedChanges } from '../slices/uiSlice';

let saveTimer: number | null = null;

export const autosaveMiddleware: Middleware = (store) => (next) => (action) => {
	const result = next(action);

	const typedAction = action as UnknownAction;

	const autosaveActionTypes = [
		'spreadsheet/setCellRaw',
		'spreadsheet/setFormulaValue',
		'spreadsheet/applyCellStyle',
		'spreadsheet/toggleCellStyle',
		'spreadsheet/setNumberFormat',
		'spreadsheet/clearSelection',
		'spreadsheet/cutSelection',
		'spreadsheet/pasteClipboard',
	];

	if (!autosaveActionTypes.includes(String(typedAction.type))) {
		return result;
	}

	if (saveTimer) {
		window.clearTimeout(saveTimer);
	}

	const dispatch = store.dispatch as AppDispatch;

	dispatch(setSaveStatus('saving'));
	dispatch(setUnsavedChanges(true));

	saveTimer = window.setTimeout(() => {
		const state = store.getState() as RootState;

		const activeDocument = state.documents.activeDocument;
		const userId = state.auth.user?.id;

		if (!activeDocument || !userId) return;

		dispatch(
			saveDocument({
				userId,
				documentId: activeDocument.id,
				cells: state.spreadsheet.cells,
				updatedAt: new Date().toISOString(),
			}),
		)
			.unwrap()
			.then(() => {
				dispatch(setSaveStatus('saved'));
				dispatch(setUnsavedChanges(false));
			})
			.catch(() => {
				dispatch(setSaveStatus('error'));
			});
	}, 500);

	return result;
};
