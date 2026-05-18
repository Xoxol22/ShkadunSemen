import { useEffect, useRef, useState } from 'react';
import type { CellPosition } from '../../types';
import { getCellKey, isCellInRange } from '../../cellUtils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	extendSelection,
	setActiveCell,
	setCellRaw,
	setEditingCell,
} from '../../store/slices/spreadsheetSlice';
import {
	openContextMenu,
	setSaveStatus,
	setUnsavedChanges,
} from '../../store/slices/uiSlice';

type CellProps = {
	position: CellPosition;
	width: number;
	height: number;
};

function formatCellValue(
	cell:
		| {
				computed: string | number | boolean;
				style?: {
					numberFormat?: 'number' | 'percent' | 'currency' | 'date';
				};
		  }
		| undefined,
) {
	if (!cell) return '';

	const value = cell.computed;
	const format = cell.style?.numberFormat;

	if (format === 'percent') {
		const numberValue = Number(value);

		return Number.isFinite(numberValue) ? `${numberValue * 100}%` : String(value);
	}

	if (format === 'currency') {
		const numberValue = Number(value);

		return Number.isFinite(numberValue)
			? new Intl.NumberFormat('ru-RU', {
					style: 'currency',
					currency: 'RUB',
				}).format(numberValue)
			: String(value);
	}

	if (format === 'date') {
		const date = new Date(String(value));

		return Number.isNaN(date.getTime())
			? String(value)
			: date.toLocaleDateString('ru-RU');
	}

	return String(value);
}

export function Cell({ position, width, height }: CellProps) {
	const { row, col } = position;

	const dispatch = useAppDispatch();

	const cell = useAppSelector((state) => state.spreadsheet.cells[getCellKey(row, col)]);
	const activeCell = useAppSelector((state) => state.spreadsheet.activeCell);
	const selection = useAppSelector((state) => state.spreadsheet.selection);
	const editingCell = useAppSelector((state) => state.spreadsheet.editingCell);

	const [draft, setDraft] = useState('');
	const inputRef = useRef<HTMLInputElement | null>(null);

	const isActive = activeCell?.row === row && activeCell?.col === col;
	const isEditing = editingCell?.row === row && editingCell?.col === col;
	const isSelected = isCellInRange(row, col, selection);

	const displayValue = formatCellValue(cell);

	useEffect(() => {
		if (!isEditing) return;

		setDraft(cell?.raw ?? '');

		requestAnimationFrame(() => {
			inputRef.current?.focus();
			inputRef.current?.select();
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isEditing]);

	function stopEditing() {
		dispatch(setEditingCell(null));

		requestAnimationFrame(() => {
			const grid = document.querySelector<HTMLDivElement>('.gridViewport');
			grid?.focus();
		});
	}

	return (
		<div
			className={[
				'cell',
				isActive ? 'cellActive' : '',
				isSelected ? 'cellSelected' : '',
				cell?.type === 'formula' ? 'cellFormula' : '',
			].join(' ')}
			style={{
				width,
				height,
				lineHeight: `${height - 2}px`,
				fontWeight: cell?.style?.bold ? 700 : 400,
				fontStyle: cell?.style?.italic ? 'italic' : 'normal',
				textDecoration: cell?.style?.underline ? 'underline' : 'none',
				backgroundColor: cell?.style?.backgroundColor,
				color: cell?.style?.textColor,
				textAlign: cell?.style?.align ?? 'left',
			}}
			onMouseDown={(event) => {
				if (event.button !== 0) return;

				dispatch(setActiveCell({ position, shiftKey: event.shiftKey }));
			}}
			onMouseEnter={(event) => {
				if (event.buttons === 1) {
					dispatch(extendSelection(position));
				}
			}}
			onDoubleClick={() => dispatch(setEditingCell(position))}
			onContextMenu={(event) => {
				event.preventDefault();

				dispatch(
					openContextMenu({
						visible: true,
						x: event.clientX,
						y: event.clientY,
						row,
						col,
						target: 'cell',
					}),
				);
			}}
		>
			{isEditing ? (
				<input
					ref={inputRef}
					className="cellEditor"
					value={draft}
					onChange={(event) => {
						const value = event.target.value;

						setDraft(value);
						dispatch(setCellRaw({ row, col, raw: value }));
						dispatch(setSaveStatus('saving'));
						dispatch(setUnsavedChanges(true));
					}}
					onBlur={stopEditing}
					onKeyDown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							stopEditing();
						}

						if (event.key === 'Escape') {
							event.preventDefault();
							stopEditing();
						}
					}}
				/>
			) : (
				<span>{displayValue}</span>
			)}
		</div>
	);
}
