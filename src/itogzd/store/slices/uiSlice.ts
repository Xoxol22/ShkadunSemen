import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ContextMenuState } from '../../types';

export type SaveStatus = 'saved' | 'saving' | 'error';

type UiState = {
	saveStatus: SaveStatus;
	hasUnsavedChanges: boolean;
	contextMenu: ContextMenuState;
};

const initialState: UiState = {
	saveStatus: 'saved',
	hasUnsavedChanges: false,

	contextMenu: {
		visible: false,
		x: 0,
		y: 0,
		row: 0,
		col: 0,
		target: 'cell',
	},
};

const uiSlice = createSlice({
	name: 'ui',

	initialState,

	reducers: {
		setSaveStatus(state, action: PayloadAction<SaveStatus>) {
			state.saveStatus = action.payload;
		},

		setUnsavedChanges(state, action: PayloadAction<boolean>) {
			state.hasUnsavedChanges = action.payload;
		},

		openContextMenu(state, action: PayloadAction<ContextMenuState>) {
			state.contextMenu = action.payload;
		},

		closeContextMenu(state) {
			state.contextMenu.visible = false;
		},
	},
});

export const {
	setSaveStatus,
	setUnsavedChanges,
	openContextMenu,
	closeContextMenu,
} = uiSlice.actions;

export default uiSlice.reducer;