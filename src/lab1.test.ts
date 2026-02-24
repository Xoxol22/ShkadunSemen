import { it, describe, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';

import {
  createUser,
  createBook,
  calculateArea,
  getStatusColor,
  capitalizeFirst,
  trimAndFormat,
  getFirstElement,
  findById,
} from "./lab1";

describe("createUser", () => {
  it("создаёт активного пользователя по умолчанию", () => {
    const user = createUser(1, "Alice");
    expect(user).toEqual({
      id: 1,
      name: "Alice",
      email: undefined,
      isActive: true,
    });
  });

  it("принимает все аргументы", () => {
    const user = createUser(2, "Bob", "bob@example.com", false);
    expect(user).toEqual({
      id: 2,
      name: "Bob",
      email: "bob@example.com",
      isActive: false,
    });
  });
});

describe("createBook", () => {
  it("возвращает ту же книгу", () => {
    const book = {
      title: "Test",
      author: "Author",
      year: 2024,
      genre: "fiction" as const,
    };
    expect(createBook(book)).toBe(book);
  });
});

describe("calculateArea", () => {
  it("считает площадь круга", () => {
    const area = calculateArea("circle", 2);
    expect(area).toBeCloseTo(Math.PI * 4);
  });

  it("считает площадь квадрата", () => {
    const area = calculateArea("square", 3);
    expect(area).toBe(9);
  });
});

describe("getStatusColor", () => {
  it("возвращает корректные цвета", () => {
    expect(getStatusColor("active")).toBe("green");
    expect(getStatusColor("inactive")).toBe("gray");
    expect(getStatusColor("new")).toBe("blue");
  });
});

describe("capitalizeFirst", () => {
  it("делает первую букву заглавной, остальные маленькими", () => {
    expect(capitalizeFirst("hELLo")).toBe("Hello");
  });

  it("возвращает пустую строку для пустого ввода", () => {
    expect(capitalizeFirst("")).toBe("");
  });

  it("переводит всё слово в верхний регистр при флаге uppercase", () => {
    expect(capitalizeFirst("hello", true)).toBe("HELLO");
  });
});

describe("trimAndFormat", () => {
  it("обрезает пробелы по краям", () => {
    expect(trimAndFormat("   hi   ")).toBe("hi");
  });

  it("обрезает и делает верхний регистр при флаге uppercase", () => {
    expect(trimAndFormat("  hello world  ", true)).toBe("HELLO WORLD");
  });
});

describe("getFirstElement", () => {
  it("возвращает первый элемент массива", () => {
    expect(getFirstElement([1, 2, 3])).toBe(1);
  });

  it("возвращает undefined для пустого массива", () => {
    expect(getFirstElement([])).toBeUndefined();
  });
});

describe("findById", () => {
  const items = [
    { id: 1, name: "One" },
    { id: 2, name: "Two" },
  ];

  it("находит элемент по id", () => {
    expect(findById(items, 2)).toEqual({ id: 2, name: "Two" });
  });

  it("возвращает undefined, если элемента нет", () => {
    expect(findById(items, 3)).toBeUndefined();
  });
});