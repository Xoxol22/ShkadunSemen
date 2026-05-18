export type CellValueType = 'string' | 'number' | 'boolean' | 'formula' | 'empty';

export type CellTextAlign = 'left' | 'center' | 'right';

export type CellNumberFormat = 'number' | 'percent' | 'currency' | 'date';

export type CellStyle = {
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	backgroundColor?: string;
	textColor?: string;
	align?: CellTextAlign;
	numberFormat?: CellNumberFormat;
};

export type CellData = {
	raw: string;
	computed: string | number | boolean;
	type: CellValueType;
	style?: CellStyle;
};

export type CellPosition = {
	row: number;
	col: number;
};

export type SelectionRange = {
	start: CellPosition;
	end: CellPosition;
};

export type ContextMenuState = {
	visible: boolean;
	x: number;
	y: number;
	row: number;
	col: number;
	target: 'cell' | 'row' | 'col';
};


//sadasdasd