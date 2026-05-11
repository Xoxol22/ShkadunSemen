import type { CellData } from '../../types';

export function exportCellsToCsv(cells: Record<string, CellData>) {
  const maxRow = getMaxRow(cells);
  const maxCol = getMaxCol(cells);

  const rows: string[] = [];

  for (let row = 0; row <= maxRow; row++) {
    const values: string[] = [];

    for (let col = 0; col <= maxCol; col++) {
      const cell = cells[`${row}:${col}`];
      values.push(escapeCsvValue(String(cell?.raw ?? '')));
    }

    rows.push(values.join(','));
  }

  downloadFile('spreadsheet.csv', rows.join('\n'), 'text/csv;charset=utf-8');
}

export function exportCellsToJson(cells: Record<string, CellData>) {
  downloadFile(
    'spreadsheet.json',
    JSON.stringify(cells, null, 2),
    'application/json;charset=utf-8',
  );
}

export function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((row) => row.trim() !== '')
    .map((row) => row.split(',').map((cell) => cell.trim()));
}

function getMaxRow(cells: Record<string, CellData>) {
  return Math.max(
    0,
    ...Object.keys(cells).map((key) => Number(key.split(':')[0])),
  );
}

function getMaxCol(cells: Record<string, CellData>) {
  return Math.max(
    0,
    ...Object.keys(cells).map((key) => Number(key.split(':')[1])),
  );
}

function escapeCsvValue(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}