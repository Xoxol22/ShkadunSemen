import { describe, expect, it } from 'vitest';
import uiReducer, {
	closeContextMenu,
	openContextMenu,
	setSaveStatus,
	setUnsavedChanges,
} from '../uiSlice';

describe('uiSlice', () => {
	it('изменяет статус сохранения', () => {
		const state = uiReducer(undefined, setSaveStatus('saving'));

		expect(state.saveStatus).toBe('saving');
	});

	it('изменяет флаг несохранённых изменений', () => {
		const state = uiReducer(undefined, setUnsavedChanges(true));

		expect(state.hasUnsavedChanges).toBe(true);
	});

	it('открывает и закрывает контекстное меню', () => {
		const opened = uiReducer(
			undefined,
			openContextMenu({
				visible: true,
				x: 10,
				y: 20,
				row: 1,
				col: 2,
				target: 'cell',
			}),
		);

		expect(opened.contextMenu.visible).toBe(true);
		expect(opened.contextMenu.x).toBe(10);

		const closed = uiReducer(opened, closeContextMenu());

		expect(closed.contextMenu.visible).toBe(false);
	});
});
