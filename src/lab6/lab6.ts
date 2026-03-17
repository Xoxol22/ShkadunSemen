/**
 * Lab6: Утилитарные типы TypeScript
 */

/**
 * 1. DeepReadonly<T> — рекурсивный readonly.
 * Все свойства и вложенные объекты становятся readonly.
 */
export type DeepReadonly<T> = T extends Primitive
  ? T
  : T extends (...args: any[]) => any
    ? T
    : T extends (infer U)[]
      ? readonly DeepReadonly<U>[]
      : { readonly [K in keyof T]: DeepReadonly<T[K]> };

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/**
 * 2. PickedByType<T, U> — выбирает из объекта T свойства типа U.
 */
export type PickedByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

/**
 * 3. EventHandlers<T> — из объекта событий генерирует тип обработчиков onEventName.
 * { click: MouseEvent } -> { onClick: (event: MouseEvent) => void }
 */
export type EventHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (event: T[K]) => void;
};
