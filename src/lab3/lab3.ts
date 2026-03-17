import { readFile, writeFile } from "node:fs/promises";

export function csvToJSON(input: string[], delimiter: string): object[] {
  if (!Array.isArray(input)) {
    throw new Error("Ошибка: входные данные должны быть массивом строк.");
  }

  if (typeof delimiter !== "string" || delimiter.length === 0) {
    throw new Error("Ошибка: разделитель (delimiter) должен быть непустой строкой.");
  }

  if (input.length === 0) {
    throw new Error("Ошибка: массив input должен содержать хотя бы строку заголовка.");
  }

  const headerLine = input[0];
  if (typeof headerLine !== "string") {
    throw new Error("Ошибка: первая строка (заголовок) должна быть строкой.");
  }

  const headers = headerLine.split(delimiter);
  if (headers.length === 0 || headers.some((h) => h.trim().length === 0)) {
    throw new Error("Ошибка: некорректный заголовок CSV (есть пустые названия столбцов).");
  }

  const result: object[] = [];

  for (let rowIndex = 1; rowIndex < input.length; rowIndex++) {
    const row = input[rowIndex];
    if (typeof row !== "string") {
      throw new Error("Ошибка: строка данных должна быть строкой.");
    }

    const values = row.split(delimiter);

    if (values.length !== headers.length) {
      throw new Error(
        "Ошибка: количество значений в строке не совпадает с количеством столбцов в заголовке."
      );
    }

    const obj: Record<string, string | number> = {};

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const key = headers[colIndex];
      const raw = values[colIndex];

      if (key === undefined || raw === undefined) {
        throw new Error(
          "Ошибка: обнаружено несоответствие структуры CSV (не хватает столбца или значения)."
        );
      }

      const trimmed = raw.trim();
      const num = Number(trimmed);

      const value: string | number =
        trimmed !== "" && Number.isFinite(num) && String(num) === trimmed ? num : raw;

      obj[key] = value;
    }

    result.push(obj);
  }

  return result;
}

export async function formatCSVFileToJSONFile(
  input: string,
  output: string,
  delimiter: string
): Promise<void> {
  if (typeof input !== "string" || input.length === 0) {
    throw new Error("Ошибка: путь к входному CSV-файлу должен быть непустой строкой.");
  }
  if (typeof output !== "string" || output.length === 0) {
    throw new Error("Ошибка: путь к выходному JSON-файлу должен быть непустой строкой.");
  }
  if (typeof delimiter !== "string" || delimiter.length === 0) {
    throw new Error("Ошибка: разделитель (delimiter) должен быть непустой строкой.");
  }

  const content = await readFile(input, { encoding: "utf-8" });

  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);

  const data = csvToJSON(lines, delimiter);
  const json = JSON.stringify(data, null, 2);

  await writeFile(output, json, { encoding: "utf-8" });
}