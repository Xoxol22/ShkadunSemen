const ROWS = 100;
const COLS = 26;

const HEADER_WIDTH = 52;
const HEADER_HEIGHT = 32;
const CELL_WIDTH = 120;
const CELL_HEIGHT = 34;

function getColumnName(index: number): string {
  return String.fromCharCode(65 + index);
}

export function SpreadsheetGrid() {
  const rows = Array.from({ length: ROWS }, (_, index) => index);
  const cols = Array.from({ length: COLS }, (_, index) => index);

  return (
    <div className="gridViewport">
      <div
        className="gridCanvas"
        style={{
          width: HEADER_WIDTH + COLS * CELL_WIDTH,
          height: HEADER_HEIGHT + ROWS * CELL_HEIGHT,
        }}
      >
        <div
          className="cornerHeader"
          style={{
            width: HEADER_WIDTH,
            height: HEADER_HEIGHT,
          }}
        />

        {cols.map((col) => (
          <div
            key={col}
            className="columnHeader"
            style={{
              left: HEADER_WIDTH + col * CELL_WIDTH,
              top: 0,
              width: CELL_WIDTH,
              height: HEADER_HEIGHT,
              lineHeight: `${HEADER_HEIGHT}px`,
            }}
          >
            {getColumnName(col)}
          </div>
        ))}

        {rows.map((row) => (
          <div
            key={row}
            className="rowHeader"
            style={{
              left: 0,
              top: HEADER_HEIGHT + row * CELL_HEIGHT,
              width: HEADER_WIDTH,
              height: CELL_HEIGHT,
              lineHeight: `${CELL_HEIGHT}px`,
            }}
          >
            {row + 1}
          </div>
        ))}

        {rows.map((row) =>
          cols.map((col) => (
            <div
              key={`${row}:${col}`}
              className="cell"
              style={{
                left: HEADER_WIDTH + col * CELL_WIDTH,
                top: HEADER_HEIGHT + row * CELL_HEIGHT,
                width: CELL_WIDTH,
                height: CELL_HEIGHT,
                lineHeight: `${CELL_HEIGHT}px`,
              }}
            />
          )),
        )}
      </div>
    </div>
  );
}