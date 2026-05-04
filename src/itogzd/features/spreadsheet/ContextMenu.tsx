import { useSpreadsheetStore } from '../../spreadsheetStore';

export function ContextMenu() {
  const contextMenu = useSpreadsheetStore((state) => state.contextMenu);
  const insertRow = useSpreadsheetStore((state) => state.insertRow);
  const deleteRow = useSpreadsheetStore((state) => state.deleteRow);
  const insertCol = useSpreadsheetStore((state) => state.insertCol);
  const deleteCol = useSpreadsheetStore((state) => state.deleteCol);
  const closeContextMenu = useSpreadsheetStore((state) => state.closeContextMenu);

  if (!contextMenu.visible) return null;

  return (
    <div
      className="contextMenu"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onMouseLeave={closeContextMenu}
    >
      <button onClick={() => insertRow(contextMenu.row)}>Вставить строку выше</button>
      <button onClick={() => insertRow(contextMenu.row + 1)}>Вставить строку ниже</button>
      <button onClick={() => deleteRow(contextMenu.row)}>Удалить строку</button>
      <div className="contextDivider" />
      <button onClick={() => insertCol(contextMenu.col)}>Вставить столбец слева</button>
      <button onClick={() => insertCol(contextMenu.col + 1)}>Вставить столбец справа</button>
      <button onClick={() => deleteCol(contextMenu.col)}>Удалить столбец</button>
    </div>
  );
}