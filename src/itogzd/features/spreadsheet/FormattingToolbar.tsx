import {
	applyCellStyle,
	setNumberFormat,
	toggleCellStyle,
} from '../../store/slices/spreadsheetSlice';
import { useAppDispatch } from '../../store/hooks';
import type { CellTextAlign } from '../../types';

export function FormattingToolbar() {
	const dispatch = useAppDispatch();

	function setAlign(align: CellTextAlign) {
		dispatch(applyCellStyle({ align }));
	}

	return (
		<div className="formattingToolbar">
			<button type="button" onClick={() => dispatch(toggleCellStyle('bold'))}>
				B
			</button>

			<button type="button" onClick={() => dispatch(toggleCellStyle('italic'))}>
				I
			</button>

			<button type="button" onClick={() => dispatch(toggleCellStyle('underline'))}>
				U
			</button>

			<label>
				Текст
				<input
					type="color"
					defaultValue="#111827"
					onChange={(event) =>
						dispatch(applyCellStyle({ textColor: event.target.value }))
					}
				/>
			</label>

			<label>
				Фон
				<input
					type="color"
					defaultValue="#ffffff"
					onChange={(event) =>
						dispatch(applyCellStyle({ backgroundColor: event.target.value }))
					}
				/>
			</label>

			<button type="button" onClick={() => setAlign('left')}>
				Left
			</button>

			<button type="button" onClick={() => setAlign('center')}>
				Center
			</button>

			<button type="button" onClick={() => setAlign('right')}>
				Right
			</button>

			<select
				defaultValue="number"
				onChange={(event) =>
					dispatch(setNumberFormat(event.target.value as never))
				}
			>
				<option value="number">Число</option>
				<option value="percent">Процент</option>
				<option value="currency">Валюта</option>
				<option value="date">Дата</option>
			</select>
		</div>
	);
}
