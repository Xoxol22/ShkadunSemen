import { describe, it, expect, vi, beforeEach } from "vitest";

// ВАЖНО: мок ДО любых импортов, которые используют fs/promises
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

import { readFile, writeFile } from "node:fs/promises";
import { csvToJSON, formatCSVFileToJSONFile } from "./lab3";

// Делает типизированные моки (без кастов ReturnType<typeof vi.fn>)
const readFileMock = vi.mocked(readFile);
const writeFileMock = vi.mocked(writeFile);

describe("csvToJSON", () => {
  it("корректно конвертирует CSV в массив объектов", () => {
    const res = csvToJSON(["p1;p2;p3;p4", "1;A;b;c", "2;B;v;d"], ";");

    expect(res).toEqual([
      { p1: 1, p2: "A", p3: "b", p4: "c" },
      { p1: 2, p2: "B", p3: "v", p4: "d" },
    ]);
  });

  it("возвращает пустой массив, если есть только шапка", () => {
    expect(csvToJSON(["a;b;c"], ";")).toEqual([]);
  });

  it("кидает Error при несовпадении количества колонок и значений", () => {
    expect(() => csvToJSON(["a;b;c", "1;2"], ";")).toThrowError();
  });

  it("кидает Error при пустом delimiter", () => {
    expect(() => csvToJSON(["a;b", "1;2"], "")).toThrowError();
  });

  it("кидает Error при пустом input", () => {
    expect(() => csvToJSON([], ";")).toThrowError();
  });

  it("кидает Error при некорректной шапке (пустое имя колонки)", () => {
    expect(() => csvToJSON(["a;;c", "1;2;3"], ";")).toThrowError();
  });
});

describe("formatCSVFileToJSONFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("читает CSV, конвертирует и пишет JSON (readFile/writeFile замоканы)", async () => {
    readFileMock.mockResolvedValue("p1;p2;p3;p4\n1;A;b;c\n2;B;v;d\n");

    await formatCSVFileToJSONFile("in.csv", "out.json", ";");

    expect(readFileMock).toHaveBeenCalledWith("in.csv", { encoding: "utf-8" });

    const expected = JSON.stringify(
      [
        { p1: 1, p2: "A", p3: "b", p4: "c" },
        { p1: 2, p2: "B", p3: "v", p4: "d" },
      ],
      null,
      2
    );

    expect(writeFileMock).toHaveBeenCalledWith("out.json", expected, {
      encoding: "utf-8",
    });
  });

  it("пробрасывает ошибку, если readFile падает", async () => {
    readFileMock.mockRejectedValue(new Error("read failed"));

    await expect(
      formatCSVFileToJSONFile("in.csv", "out.json", ";")
    ).rejects.toThrow("read failed");

    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it("пробрасывает ошибку, если writeFile падает", async () => {
    readFileMock.mockResolvedValue("a;b\n1;2\n");
    writeFileMock.mockRejectedValue(new Error("write failed"));

    await expect(
      formatCSVFileToJSONFile("in.csv", "out.json", ";")
    ).rejects.toThrow("write failed");
  });
});