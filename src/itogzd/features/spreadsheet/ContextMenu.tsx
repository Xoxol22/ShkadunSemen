import { useAppDispatch, useAppSelector } from '../../store/hooks';

import {
	insertRow,
	deleteRow,
	insertCol,
	deleteCol,
} from '../../store/slices/spreadsheetSlice';

import { closeContextMenu } from '../../store/slices/uiSlice';

export function ContextMenu() {
	const dispatch = useAppDispatch();

	const contextMenu = useAppSelector((state) => state.ui.contextMenu);

	if (!contextMenu.visible) return null;

	return (
		<div
			className="contextMenu"
			style={{ left: contextMenu.x, top: contextMenu.y }}
			onMouseLeave={() => dispatch(closeContextMenu())}
		>
			<button
				onClick={() => {
					dispatch(insertRow(contextMenu.row));
					dispatch(closeContextMenu());
				}}
			>
				Вставить строку выше
			</button>

			<button
				onClick={() => {
					dispatch(insertRow(contextMenu.row + 1));
					dispatch(closeContextMenu());
				}}
			>
				Вставить строку ниже
			</button>

			<button
				onClick={() => {
					dispatch(deleteRow(contextMenu.row));
					dispatch(closeContextMenu());
				}}
			>
				Удалить строку
			</button>

			<div className="contextDivider" />

			<button
				onClick={() => {
					dispatch(insertCol(contextMenu.col));
					dispatch(closeContextMenu());
				}}
			>
				Вставить столбец слева
			</button>

			<button
				onClick={() => {
					dispatch(insertCol(contextMenu.col + 1));
					dispatch(closeContextMenu());
				}}
			>
				Вставить столбец справа
			</button>

			<button
				onClick={() => {
					dispatch(deleteCol(contextMenu.col));
					dispatch(closeContextMenu());
				}}
			>
				Удалить столбец
			</button>
		</div>
	);
}
