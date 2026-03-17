import { describe, it, expect } from "vitest";
import {
  query,
  type Transform,
  type Where,
  type Sort,
  type GroupBy,
  type GroupTransform,
  type Having,
  type Group,
} from "./lab4";

type User = {
  id: number;
  name: string;
  surname: string;
  age: number;
  city: string;
};

const users: User[] = [
  { id: 1, name: "John", surname: "Doe", age: 34, city: "NY" },
  { id: 2, name: "John", surname: "Doe", age: 33, city: "NY" },
  { id: 3, name: "John", surname: "Doe", age: 35, city: "LA" },
  { id: 4, name: "Mike", surname: "Doe", age: 35, city: "LA" },
];

describe("query: фильтрация и сортировка", () => {
  const where: Where<User> =
    (key, value) =>
    (data) =>
      data.filter((item) => item[key] === value);

  const sort: Sort<User> =
    (key) =>
    (data) =>
      [...data].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av < bv) return -1;
        if (av > bv) return 1;
        return 0;
      });

  it("цепочка where + where + sort даёт отфильтрованный и отсортированный массив", () => {
    const search = query<User>(
      where("name", "John"),
      where("surname", "Doe"),
      sort("age")
    );
    const result = search(users);

    expect(result).toEqual([
      { id: 2, name: "John", surname: "Doe", age: 33, city: "NY" },
      { id: 1, name: "John", surname: "Doe", age: 34, city: "NY" },
      { id: 3, name: "John", surname: "Doe", age: 35, city: "LA" },
    ]);
  });
});

describe("query: группировка и фильтр по группам", () => {
  const groupBy: GroupBy<User> = <K extends keyof User>(key: K) =>
    (data: User[]) =>
      Object.values(
        data.reduce(
          (acc, item) => {
            const k = String(item[key]);
            if (!acc[k]) acc[k] = { key: item[key], items: [] };
            acc[k].items.push(item);
            return acc;
          },
          {} as Record<string, Group<User, K>>
        )
      ) as Group<User, K>[];

  const having: Having<User> =
    (predicate) =>
    (groups) =>
      groups.filter(predicate);

  it("groupBy + having оставляет только группы с более чем одним элементом", () => {
    const groupAndFilter = query<User>(
      groupBy("city"),
      having((group) => group.items.length > 1)
    );
    const grouped = groupAndFilter(users) as Array<Group<User, "city">>;

    expect(grouped).toHaveLength(2); // NY и LA по 2 и 2
    const ny = grouped.find((g) => g.key === "NY");
    const la = grouped.find((g) => g.key === "LA");
    expect(ny?.items).toHaveLength(2);
    expect(la?.items).toHaveLength(2);
  });
});

describe("query: комбинированный конвейер", () => {
  const where: Where<User> =
    (key, value) =>
    (data) =>
      data.filter((item) => item[key] === value);

  const groupBy: GroupBy<User> = <K extends keyof User>(key: K) =>
    (data: User[]) =>
      Object.values(
        data.reduce(
          (acc, item) => {
            const k = String(item[key]);
            if (!acc[k]) acc[k] = { key: item[key], items: [] };
            acc[k].items.push(item);
            return acc;
          },
          {} as Record<string, Group<User, K>>
        )
      ) as Group<User, K>[];

  const having: Having<User> =
    (predicate) =>
    (groups) =>
      groups.filter(predicate);

  it("where + groupBy + having оставляет группы, где есть возраст > 34", () => {
    const pipeline = query<User>(
      where("surname", "Doe"),
      groupBy("city"),
      having((group) => group.items.some((u) => u.age > 34))
    );
    const res = pipeline(users) as Array<Group<User, "city">>;

    expect(res).toHaveLength(1); // только LA (John 35, Mike 35)
    const first = res[0];
    expect(first).toBeDefined();
    expect(first!.key).toBe("LA");
    expect(first!.items).toHaveLength(2);
  });
});

// --- Покрытие всех 8 типов из задания ---


describe("1. Transform<T>", () => {
  it("шаг типа Transform принимает T[] и возвращает T[]", () => {
    const reverse: Transform<User> = (data) => [...data].reverse();
    const run = query<User>(reverse);
    const result = run(users) as User[];
    expect(result).toHaveLength(4);
    expect(result[0]!.id).toBe(4);
    expect(result[3]!.id).toBe(1);
  });
});

describe("2. Where<T>", () => {
  const where: Where<User> =
    (key, value) =>
    (data) =>
      data.filter((item) => item[key] === value);

  it("один where фильтрует по полю", () => {
    const run = query<User>(where("city", "NY"));
    const result = run(users) as User[];
    expect(result).toHaveLength(2);
    expect(result.every((u) => u.city === "NY")).toBe(true);
  });
});

describe("3. Sort<T>", () => {
  const sort: Sort<User> =
    (key) =>
    (data) =>
      [...data].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av < bv) return -1;
        if (av > bv) return 1;
        return 0;
      });

  it("один sort сортирует по полю", () => {
    const run = query<User>(sort("age"));
    const result = run(users) as User[];
    expect(result.map((u) => u.age)).toEqual([33, 34, 35, 35]);
  });
});

describe("4. Group<T, K>", () => {
  const groupBy: GroupBy<User> = <K extends keyof User>(key: K) =>
    (data: User[]) =>
      Object.values(
        data.reduce(
          (acc, item) => {
            const k = String(item[key]);
            if (!acc[k]) acc[k] = { key: item[key], items: [] };
            acc[k].items.push(item);
            return acc;
          },
          {} as Record<string, Group<User, K>>
        )
      ) as Group<User, K>[];

  it("каждая группа имеет key и items (тип Group)", () => {
    const run = query<User>(groupBy("city"));
    const groups = run(users) as Array<Group<User, "city">>;
    for (const g of groups) {
      expect(g).toHaveProperty("key");
      expect(g).toHaveProperty("items");
      expect(Array.isArray(g.items)).toBe(true);
      expect(g.items.every((u) => u.city === g.key)).toBe(true);
    }
  });
});

describe("5. GroupBy<T>", () => {
  const groupBy: GroupBy<User> = <K extends keyof User>(key: K) =>
    (data: User[]) =>
      Object.values(
        data.reduce(
          (acc, item) => {
            const k = String(item[key]);
            if (!acc[k]) acc[k] = { key: item[key], items: [] };
            acc[k].items.push(item);
            return acc;
          },
          {} as Record<string, Group<User, K>>
        )
      ) as Group<User, K>[];

  it("groupBy по ключу превращает T[] в массив групп", () => {
    const run = query<User>(groupBy("city"));
    const groups = run(users) as Array<Group<User, "city">>;
    expect(groups).toHaveLength(2);
    const keys = groups.map((g) => g.key).sort();
    expect(keys).toEqual(["LA", "NY"]);
  });
});

describe("6. GroupTransform<T, K>", () => {
  const groupBy: GroupBy<User> = <K extends keyof User>(key: K) =>
    (data: User[]) =>
      Object.values(
        data.reduce(
          (acc, item) => {
            const k = String(item[key]);
            if (!acc[k]) acc[k] = { key: item[key], items: [] };
            acc[k].items.push(item);
            return acc;
          },
          {} as Record<string, Group<User, K>>
        )
      ) as Group<User, K>[];

  it("шаг GroupTransform фильтрует/преобразует массив групп", () => {
    const takeFirstGroup: GroupTransform<User, "city"> = (groups) =>
      groups.slice(0, 1);
    const run = query<User>(groupBy("city"), takeFirstGroup);
    const result = run(users) as Array<Group<User, "city">>;
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("key");
    expect(result[0]).toHaveProperty("items");
  });
});


describe("7. Having<T>", () => {
  const groupBy: GroupBy<User> = <K extends keyof User>(key: K) =>
    (data: User[]) =>
      Object.values(
        data.reduce(
          (acc, item) => {
            const k = String(item[key]);
            if (!acc[k]) acc[k] = { key: item[key], items: [] };
            acc[k].items.push(item);
            return acc;
          },
          {} as Record<string, Group<User, K>>
        )
      ) as Group<User, K>[];

  const having: Having<User> =
    (predicate) =>
    (groups) =>
      groups.filter(predicate);

  it("having отбирает группы по предикату", () => {
    const run = query<User>(
      groupBy("name"),
      having((group) => group.key === "John")
    );
    const result = run(users) as Array<Group<User, "name">>;
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe("John");
    expect(result[0]!.items).toHaveLength(3);
  });
});

describe("8. query", () => {
  it("возвращает функцию (Transform)", () => {
    const run = query<User>((data: User[]) => data);
    expect(typeof run).toBe("function");
    const result = run(users);
    expect(result).toEqual(users);
  });

  it("один шаг применяется к данным", () => {
    const run = query<User>((data: User[]) => data.filter((u) => u.id > 2));
    const result = run(users) as User[];
    expect(result).toHaveLength(2);
  });

  it("несколько шагов применяются по порядку", () => {
    const step1: Transform<User> = (data) => data.filter((u) => u.age === 35);
    const step2: Transform<User> = (data) => [...data].sort((a, b) => a.id - b.id);
    const run = query<User>(step1, step2);
    const result = run(users) as User[];
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe(3);
    expect(result[1]!.id).toBe(4);
  });
});
