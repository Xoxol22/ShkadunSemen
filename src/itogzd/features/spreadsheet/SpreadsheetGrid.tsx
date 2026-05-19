import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { Cell } from './Cell';
import { getColumnName, DEFAULT_ROW_HEIGHT } from '../../cellUtils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	clearSelection,
	copySelection,
	cutSelection,
	moveActiveCell,
	pasteClipboard,
	redo,
	selectAll,
	setActiveCell,
	setCellRaw,
	setEditingCell,
	setColumnWidth,
	setRowHeight,
	toggleCellStyle,
	undo,
} from '../../store/slices/spreadsheetSlice';
import {
	openContextMenu,
	setSaveStatus,
	setUnsavedChanges,
} from '../../store/slices/uiSlice';

const HEADER_WIDTH = 52;
const HEADER_HEIGHT = 32;
const OVERSCAN = 8;
const DEFAULT_COL_WIDTH = 100;

function getColumnWidth(widths: Record<number, number>, col: number) {
	return widths[col] ?? DEFAULT_COL_WIDTH;
}

function getRowHeight(heights: Record<number, number>, row: number) {
	return heights[row] ?? DEFAULT_ROW_HEIGHT;
}

export function SpreadsheetGrid() {
	const dispatch = useAppDispatch();

	const rows = useAppSelector((state) => state.spreadsheet.rows);
	const cols = useAppSelector((state) => state.spreadsheet.cols);
	const activeCell = useAppSelector((state) => state.spreadsheet.activeCell);
	const editingCell = useAppSelector((state) => state.spreadsheet.editingCell);

	const columnWidths = useAppSelector((state) => state.spreadsheet.columnWidths);
	const rowHeights = useAppSelector((state) => state.spreadsheet.rowHeights);

	const containerRef = useRef<HTMLDivElement | null>(null);

	const [scroll, setScroll] = useState({ top: 0, left: 0 });
	const [viewport, setViewport] = useState({ width: 1000, height: 600 });

	const columnOffsets = useMemo(() => {
		const offsets: number[] = [];
		let current = 0;

		for (let col = 0; col < cols; col++) {
			offsets[col] = current;
			current += getColumnWidth(columnWidths, col);
		}

		return { offsets, total: current };
	}, [cols, columnWidths]);

	const rowOffsets = useMemo(() => {
		const offsets: number[] = [];
		let current = 0;

		for (let row = 0; row < rows; row++) {
			offsets[row] = current;
			current += getRowHeight(rowHeights, row);
		}

		return { offsets, total: current };
	}, [rows, rowHeights]);

	const visibleCols = useMemo(() => {
		const result: number[] = [];
		const from = scroll.left;
		const to = scroll.left + viewport.width;

		for (let col = 0; col < cols; col++) {
			const left = columnOffsets.offsets[col] ?? 0;
			const width = getColumnWidth(columnWidths, col);

			if (left + width >= from - OVERSCAN * 100 && left <= to + OVERSCAN * 100) {
				result.push(col);
			}
		}

		return result;
	}, [cols, columnOffsets, columnWidths, scroll.left, viewport.width]);

	const visibleRows = useMemo(() => {
		const result: number[] = [];
		const from = scroll.top;
		const to = scroll.top + viewport.height;

		for (let row = 0; row < rows; row++) {
			const top = rowOffsets.offsets[row] ?? 0;
			const height = getRowHeight(rowHeights, row);

			if (
				top + height >= from - OVERSCAN * DEFAULT_ROW_HEIGHT &&
				top <= to + OVERSCAN * DEFAULT_ROW_HEIGHT
			) {
				result.push(row);
			}
		}

		return result;
	}, [rows, rowOffsets, rowHeights, scroll.top, viewport.height]);

	function startColumnResize(event: MouseEvent<HTMLSpanElement>, col: number) {
		event.preventDefault();
		event.stopPropagation();

		const startX = event.clientX;
		const startWidth = getColumnWidth(columnWidths, col);

		function move(moveEvent: globalThis.MouseEvent) {
			dispatch(
				setColumnWidth({
					col,
					width: startWidth + moveEvent.clientX - startX,
				}),
			);
		}

		function up() {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseup', up);
		}

		window.addEventListener('mousemove', move);
		window.addEventListener('mouseup', up);
	}

	function startRowResize(event: MouseEvent<HTMLSpanElement>, row: number) {
		event.preventDefault();
		event.stopPropagation();

		const startY = event.clientY;
		const startHeight = getRowHeight(rowHeights, row);

		function move(moveEvent: globalThis.MouseEvent) {
			dispatch(
				setRowHeight({
					row,
					height: startHeight + moveEvent.clientY - startY,
				}),
			);
		}

		function up() {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseup', up);
		}

		window.addEventListener('mousemove', move);
		window.addEventListener('mouseup', up);
	}

	function handleSpreadsheetShortcut(event: KeyboardEvent) {
		const target = event.target;

		if (
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement
		) {
			return;
		}

		const key = event.key?.toLowerCase() ?? '';

		if ((event.ctrlKey || event.metaKey) && key === 's') {
			return;
		}

		if ((event.ctrlKey || event.metaKey) && key === 'b') {
			event.preventDefault();
			dispatch(toggleCellStyle('bold'));
			dispatch(setSaveStatus('saving'));
			dispatch(setUnsavedChanges(true));
			return;
		}

		if ((event.ctrlKey || event.metaKey) && key === 'i') {
			event.preventDefault();
			dispatch(toggleCellStyle('italic'));
			dispatch(setSaveStatus('saving'));
			dispatch(setUnsavedChanges(true));
			return;
		}

		if ((event.ctrlKey || event.metaKey) && key === 'u') {
			event.preventDefault();
			dispatch(toggleCellStyle('underline'));
			dispatch(setSaveStatus('saving'));
			dispatch(setUnsavedChanges(true));
			return;
		}

		if ((event.ctrlKey || event.metaKey) && key === 'a') {
			event.preventDefault();
			dispatch(selectAll());
			return;
		}

		if ((event.ctrlKey || event.metaKey) && key === 'c') {
			event.preventDefault();
			dispatch(copySelection());
			return;
		}

		if ((event.ctrlKey || event.metaKey) && key === 'x') {
			event.preventDefault();
			dispatch(cutSelection());
			dispatch(setSaveStatus('saving'));
			dispatch(setUnsavedChanges(true));
			return;
		}

		if ((event.ctrlKey || event.metaKey) && key === 'v') {
			event.preventDefault();
			dispatch(pasteClipboard());
			dispatch(setSaveStatus('saving'));
			dispatch(setUnsavedChanges(true));
			return;
		}

		if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 'z') {
			event.preventDefault();
			dispatch(redo());
			return;
		}

		if ((event.ctrlKey || event.metaKey) && key === 'z') {
			event.preventDefault();
			dispatch(undo());
			return;
		}

		if ((event.ctrlKey || event.metaKey) && key === 'y') {
			event.preventDefault();
			dispatch(redo());
			return;
		}

		if (editingCell) return;

		if (!activeCell) {
			dispatch(setActiveCell({ position: { row: 0, col: 0 } }));
			return;
		}

		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			dispatch(clearSelection());
			dispatch(setSaveStatus('saving'));
			dispatch(setUnsavedChanges(true));
			return;
		}

		if (event.key === 'Tab') {
			event.preventDefault();

			dispatch(
				moveActiveCell({
					rowDelta: 0,
					colDelta: event.shiftKey ? -1 : 1,
				}),
			);

			return;
		}

		if (event.key === 'Escape') {
			event.preventDefault();
			dispatch(setEditingCell(null));
			return;
		}

		if (event.key === 'Enter') {
			event.preventDefault();
			dispatch(setEditingCell(activeCell));
		}
	}

	useEffect(() => {
		document.addEventListener('keydown', handleSpreadsheetShortcut, true);

		return () => {
			document.removeEventListener('keydown', handleSpreadsheetShortcut, true);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeCell, editingCell, dispatch]);

	return (
		<div
			ref={containerRef}
			className="gridViewport"
			tabIndex={0}
			onKeyDown={(event) => {
				if (editingCell) return;

				if (!activeCell) {
					dispatch(setActiveCell({ position: { row: 0, col: 0 } }));
					return;
				}

				if (event.key === 'ArrowUp') {
					event.preventDefault();
					dispatch(
						moveActiveCell({
							rowDelta: -1,
							colDelta: 0,
							shiftKey: event.shiftKey,
						}),
					);
					return;
				}

				if (event.key === 'ArrowDown') {
					event.preventDefault();
					dispatch(
						moveActiveCell({
							rowDelta: 1,
							colDelta: 0,
							shiftKey: event.shiftKey,
						}),
					);
					return;
				}

				if (event.key === 'ArrowLeft') {
					event.preventDefault();
					dispatch(
						moveActiveCell({
							rowDelta: 0,
							colDelta: -1,
							shiftKey: event.shiftKey,
						}),
					);
					return;
				}

				if (event.key === 'ArrowRight') {
					event.preventDefault();
					dispatch(
						moveActiveCell({
							rowDelta: 0,
							colDelta: 1,
							shiftKey: event.shiftKey,
						}),
					);
					return;
				}

				if (
					event.key.length === 1 &&
					!event.ctrlKey &&
					!event.metaKey &&
					!event.altKey
				) {
					event.preventDefault();

					dispatch(
						setCellRaw({
							row: activeCell.row,
							col: activeCell.col,
							raw: event.key,
						}),
					);

					dispatch(setEditingCell(activeCell));
					dispatch(setSaveStatus('saving'));
					dispatch(setUnsavedChanges(true));
				}
			}}
			onScroll={(event) => {
				const el = event.currentTarget;

				setScroll({
					top: el.scrollTop,
					left: el.scrollLeft,
				});

				setViewport({
					width: el.clientWidth,
					height: el.clientHeight,
				});
			}}
			onMouseDown={(event) => {
				if (event.target instanceof HTMLInputElement) return;

				requestAnimationFrame(() => {
					containerRef.current?.focus();
				});
			}}
			onMouseEnter={() => {
				const el = containerRef.current;

				if (!el) return;

				setViewport({
					width: el.clientWidth,
					height: el.clientHeight,
				});
			}}
		>
			<div
				className="gridCanvas"
				style={{
					width: columnOffsets.total + HEADER_WIDTH,
					height: rowOffsets.total + HEADER_HEIGHT,
				}}
			>
				<div
					className="cornerHeader"
					style={{
						width: HEADER_WIDTH,
						height: HEADER_HEIGHT,
					}}
				/>

				{visibleCols.map((col) => {
					const left = HEADER_WIDTH + (columnOffsets.offsets[col] ?? 0);
					const width = getColumnWidth(columnWidths, col);

					return (
						<div
							key={col}
							className="columnHeader"
							style={{
								left,
								top: 0,
								width,
								height: HEADER_HEIGHT,
								lineHeight: `${HEADER_HEIGHT}px`,
							}}
							onContextMenu={(event) => {
								event.preventDefault();

								dispatch(
									openContextMenu({
										visible: true,
										x: event.clientX,
										y: event.clientY,
										row: 0,
										col,
										target: 'col',
									}),
								);
							}}
						>
							{getColumnName(col)}

							<span
								className="columnResizer"
								onMouseDown={(event) => startColumnResize(event, col)}
							/>
						</div>
					);
				})}

				{visibleRows.map((row) => {
					const top = HEADER_HEIGHT + (rowOffsets.offsets[row] ?? 0);
					const height = getRowHeight(rowHeights, row);

					return (
						<div
							key={row}
							className="rowHeader"
							style={{
								left: 0,
								top,
								width: HEADER_WIDTH,
								height,
								lineHeight: `${height}px`,
							}}
							onContextMenu={(event) => {
								event.preventDefault();

								dispatch(
									openContextMenu({
										visible: true,
										x: event.clientX,
										y: event.clientY,
										row,
										col: 0,
										target: 'row',
									}),
								);
							}}
						>
							{row + 1}

							<span
								className="rowResizer"
								onMouseDown={(event) => startRowResize(event, row)}
							/>
						</div>
					);
				})}

				{visibleRows.map((row) =>
					visibleCols.map((col) => {
						const left = HEADER_WIDTH + (columnOffsets.offsets[col] ?? 0);
						const top = HEADER_HEIGHT + (rowOffsets.offsets[row] ?? 0);
						const width = getColumnWidth(columnWidths, col);
						const height = getRowHeight(rowHeights, row);

						return (
							<div
								key={`${row}:${col}`}
								className="cellWrapper"
								style={{
									left,
									top,
									width,
									height,
								}}
							>
								<Cell
									position={{ row, col }}
									width={width}
									height={height}
								/>
							</div>
						);
					}),
				)}
			</div>
		</div>
	);
}
