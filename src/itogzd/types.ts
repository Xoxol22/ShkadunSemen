export type CellValueType = 'string' | 'number' | 'boolean' | 'formula' | 'empty';

export type CellData = {
  raw: string;
  computed: string | number | boolean;
  type: CellValueType;
};

export type CellPosition = {
  row: number;
  col: number;
};