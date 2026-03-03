import { describe, it, expect } from "vitest";
import { where, sort, groupBy, having, query, type Group } from "./lab4";

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

describe("Конвейер query (фильтрация / сортировка / группировка)", () => {
  it("where: фильтрует массив объектов по точному совпадению поля", () => {
    const W = where<User>();

    const onlyJohn = W("name", "John")(users);

    expect(onlyJohn.map((u) => u.id)).toEqual([1, 2, 3]);
  });

  it("sort: сортирует по ключу по возрастанию и не мутирует исходный массив", () => {
    const S = sort<User>();

    const inputCopy = [...users];
    const sorted = S("age")(users);

    expect(sorted.map((u) => u.id)).toEqual([2, 1, 3, 4]);
    expect(users).toEqual(inputCopy);
  });

  it("query: собирает where + where + sort (пример из задания)", () => {
    const W = where<User>();
    const S = sort<User>();

    const search = query(W("name", "John"), W("surname", "Doe"), S("age"));

    const result = search(users);

    expect(result).toEqual([
      { id: 2, name: "John", surname: "Doe", age: 33, city: "NY" },
      { id: 1, name: "John", surname: "Doe", age: 34, city: "NY" },
      { id: 3, name: "John", surname: "Doe", age: 35, city: "LA" },
    ]);
  });

  it("groupBy: группирует по ключу и сохраняет элементы в группах", () => {
    const G = groupBy<User>();

    const groups = G("city")(users);

    const byKey = new Map(groups.map((g) => [g.key, g.items.map((u) => u.id)]));

    expect([...byKey.keys()].sort()).toEqual(["LA", "NY"]);
    expect(byKey.get("NY")?.sort()).toEqual([1, 2]);
    expect(byKey.get("LA")?.sort()).toEqual([3, 4]);
  });

  it("having: фильтрует группы по предикату (оставляет только подходящие)", () => {
    const H = having<User>();

    // безопасный доступ при strict + noUncheckedIndexedAccess
    const u0 = users.at(0)!;
    const u1 = users.at(1)!;
    const u2 = users.at(2)!;

    const groups: Group<User, "city">[] = [
      { key: "NY", items: [u0, u1] },
      { key: "LA", items: [u2] },
    ];

    const filtered = H<"city">((g) => g.items.length > 1)(groups);

    expect(filtered).toEqual([{ key: "NY", items: [u0, u1] }]);
  });

  it("query: собирает groupBy + having (группировка и фильтр групп)", () => {
    const G = groupBy<User>();
    const H = having<User>();

    const groupAndFilter = query(G("city"), H((group) => group.items.length > 1));

    const res = groupAndFilter(users);

    const keys = res.map((g) => g.key).sort();
    expect(keys).toEqual(["LA", "NY"]);

    const ny = res.find((g) => g.key === "NY");
    expect(ny).toBeDefined();
    expect(ny!.items.map((u) => u.id).sort()).toEqual([1, 2]);
  });

  it("query: where -> groupBy -> having (комбинированный конвейер)", () => {
    const W = where<User>();
    const G = groupBy<User>();
    const H = having<User>();

    const pipeline = query(
      W("surname", "Doe"),
      G("city"),
      H((group) => group.items.some((u) => u.age > 34))
    );

    const res = pipeline(users);

    expect(res).toHaveLength(1);
    expect(res[0]!.key).toBe("LA");
    expect(res[0]!.items.map((u) => u.id).sort()).toEqual([3, 4]);
  });
});