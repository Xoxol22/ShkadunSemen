import { describe, it, expect, expectTypeOf } from "vitest";
import { query, where, groupBy, having, sort, Group } from "./lab5";

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

describe("query: корректный порядок", () => {
  it("where + where + groupBy + having + sort", () => {
    const search = query<User>(
      where<User>()("name", "John"),
      where<User>()("surname", "Doe"),
      groupBy<User>()("surname"),
      having<User>()((g) => g.items.length > 0)
    );

    const result = search(users);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("groupBy + having", () => {
    const groupAndFilter = query<User>(
      groupBy<User>()("city"),
      having<User>()((group) => group.items.length > 1)
    );

    const grouped = groupAndFilter(users) as Array<Group<User, "city">>;

    expect(grouped).toHaveLength(2);

    const ny = grouped.find((g) => g.key === "NY");
    const la = grouped.find((g) => g.key === "LA");

    expect(ny?.items).toHaveLength(2);
    expect(la?.items).toHaveLength(2);
  });

  it("where + groupBy + having", () => {
    const pipeline = query<User>(
      where<User>()("surname", "Doe"),
      groupBy<User>()("city"),
      having<User>()((group) =>
        group.items.some((u) => u.age > 34)
      )
    );

    const res = pipeline(users) as Array<Group<User, "city">>;

    expect(res).toHaveLength(1);
    expect(res[0]!.key).toBe("LA");
    expect(res[0]!.items).toHaveLength(2);
  });
});

describe("expectTypeOf: корректные цепочки", () => {
  it("where + groupBy + having — OK", () => {
    const q = query<User>(
      where<User>()("name", "John"),
      groupBy<User>()("city"),
      having<User>()((g) => g.items.length > 0)
    );

    expectTypeOf(q).toBeFunction();
    expectTypeOf(q).parameter(0).toMatchTypeOf<User[]>();
  });

  it("where + where + groupBy + having — OK", () => {
    const q = query<User>(
      where<User>()("name", "John"),
      where<User>()("city", "NY"),
      groupBy<User>()("surname"),
      having<User>()((g) => g.items.length > 0)
    );

    expectTypeOf(q).toBeFunction();
  });

  it("groupBy + having — OK", () => {
    const q = query<User>(
      groupBy<User>()("city"),
      having<User>()((g) => g.items.length > 1)
    );

    expectTypeOf(q).toBeFunction();
  });
});

describe("expectTypeOf: неверный порядок", () => {
  it("sort перед where — ошибка", () => {
    const q = query<User>(
      sort<User>()("age"),
      where<User>()("name", "John")
    );
    expectTypeOf(q).toBeFunction();
  });

  it("where после groupBy — ошибка", () => {
    const q = query<User>(
      groupBy<User>()("city"),
      where<User>()("name", "John")
    );
    expectTypeOf(q).toBeFunction();
  });

  it("groupBy после having — ошибка", () => {
    const q = query<User>(
      where<User>()("name", "John"),
      groupBy<User>()("city"),
      having<User>()((g) => g.items.length > 0),
      groupBy<User>()("age")
    );
    expectTypeOf(q).toBeFunction();
  });

  it("having перед groupBy — ошибка", () => {
    const q = query<User>(
      where<User>()("name", "John"),
      having<User>()((g) => g.items.length > 0),
      groupBy<User>()("city")
    );
    expectTypeOf(q).toBeFunction();
  });

  it("sort перед groupBy — ошибка", () => {
    const q = query<User>(
      sort<User>()("age"),
      groupBy<User>()("city")
    );
    expectTypeOf(q).toBeFunction();
  });
});