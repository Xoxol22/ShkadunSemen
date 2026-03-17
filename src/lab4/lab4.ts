
// Шаг конвейера: принимает массив In и возвращает новый массив Ou  t
export type Transform<In, Out = In> = (data: In[]) => Out[];

// Возвращает Transform<T, T>, фильтрующий массив объектов T по полю K
export type Where<T extends object> = <K extends keyof T>(
  key: K,
  value: T[K]
) => Transform<T, T>;

// Возвращает Transform<T, T>, сортирующий массив объектов T по полю K
export type Sort<T extends object> = <K extends keyof T>(key: K) => Transform<T, T>;

// Описание одной группы по ключу K
export type Group<T, K extends keyof T> = {
  key: T[K];
  items: T[];
};

// Возвращает Transform<T, Group<T, K>>: превращает T[] в массив групп
export type GroupBy<T extends object> = <K extends keyof T>(
  key: K
) => Transform<T, Group<T, K>>;

// Шаг, который работает уже с массивом групп и возвращает новый массив таких же групп
export type GroupTransform<T, K extends keyof T> = Transform<Group<T, K>, Group<T, K>>;

// Возвращает GroupTransform<T, K>, фильтрующий группы по предикату
export type Having<T extends object> = <K extends keyof T>(
  predicate: (group: Group<T, K>) => boolean
) => GroupTransform<T, K>;

export const where = <T extends object>(): Where<T> =>
  <K extends keyof T>(key: K, value: T[K]) =>
  (data: T[]) =>
    data.filter((item) => item[key] === value);

export const sort = <T extends object>(): Sort<T> =>
  <K extends keyof T>(key: K) =>
  (data: T[]) =>
    [...data].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });

export const groupBy = <T extends object>(): GroupBy<T> =>
  <K extends keyof T>(key: K) =>
  (data: T[]) => {
    const acc: Record<string, Group<T, K>> = {};

    for (const item of data) {
      const k = String(item[key]); // ключ для Record<string, ...>
      (acc[k] ??= { key: item[key], items: [] }).items.push(item);
    }

    return Object.values(acc);
  };

export const having = <T extends object>(): Having<T> =>
  <K extends keyof T>(predicate: (group: Group<T, K>) => boolean) =>
  (groups: Group<T, K>[]) =>
    groups.filter(predicate);


export function query<A>(): Transform<A, A>;
export function query<A, B>(s1: Transform<A, B>): Transform<A, B>;
export function query<A, B, C>(s1: Transform<A, B>, s2: Transform<B, C>): Transform<A, C>;
export function query<A, B, C, D>(
  s1: Transform<A, B>,
  s2: Transform<B, C>,
  s3: Transform<C, D>
): Transform<A, D>;
export function query<A, B, C, D, E>(
  s1: Transform<A, B>,
  s2: Transform<B, C>,
  s3: Transform<C, D>,
  s4: Transform<D, E>
): Transform<A, E>;
export function query<A, B, C, D, E, F>(
  s1: Transform<A, B>,
  s2: Transform<B, C>,
  s3: Transform<C, D>,
  s4: Transform<D, E>,
  s5: Transform<E, F>
): Transform<A, F>;
export function query<A, B, C, D, E, F, G>(
  s1: Transform<A, B>,
  s2: Transform<B, C>,
  s3: Transform<C, D>,
  s4: Transform<D, E>,
  s5: Transform<E, F>,
  s6: Transform<F, G>
): Transform<A, G>;

export function query(...steps: Array<Transform<any, any>>) {
  return (data: any[]) => steps.reduce((acc, step) => step(acc), data);
}
