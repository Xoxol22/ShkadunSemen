import { describe, it, expectTypeOf } from 'vitest';
import type { DeepReadonly, PickedByType, EventHandlers } from './lab6';

describe('1. DeepReadonly<T>', () => {
	it('примитивы остаются без изменений', () => {
		expectTypeOf<DeepReadonly<string>>().toEqualTypeOf<string>();
		expectTypeOf<DeepReadonly<number>>().toEqualTypeOf<number>();
		expectTypeOf<DeepReadonly<boolean>>().toEqualTypeOf<boolean>();
		expectTypeOf<DeepReadonly<null>>().toEqualTypeOf<null>();
	});

	it('функции остаются без изменений', () => {
		type Fn = (x: number) => string;
		expectTypeOf<DeepReadonly<Fn>>().toEqualTypeOf<Fn>();
	});

	it('массивы становятся readonly', () => {
		expectTypeOf<DeepReadonly<number[]>>().toEqualTypeOf<readonly number[]>();
	});

	it('вложенные объекты рекурсивно readonly', () => {
		type Nested = { a: { b: number } };
		type Expected = { readonly a: { readonly b: number } };
		expectTypeOf<DeepReadonly<Nested>>().toEqualTypeOf<Expected>();
	});

	it('массивы объектов — readonly массив с readonly элементами', () => {
		type Arr = { x: number }[];
		type Expected = readonly { readonly x: number }[];
		expectTypeOf<DeepReadonly<Arr>>().toEqualTypeOf<Expected>();
	});
});

describe('2. PickedByType<T, U>', () => {
	type Mixed = {
		id: number;
		name: string;
		age: number;
		city: string;
	};

	it('выбирает свойства заданного типа', () => {
		type Picked = PickedByType<Mixed, number>;
		expectTypeOf<Picked>().toEqualTypeOf<{ id: number; age: number }>();
	});

	it('выбирает все string-свойства', () => {
		type Picked = PickedByType<Mixed, string>;
		expectTypeOf<Picked>().toEqualTypeOf<{ name: string; city: string }>();
	});

	it('пустой объект при отсутствии совпадений', () => {
		type Picked = PickedByType<Mixed, boolean>;
		expectTypeOf<Picked>().toEqualTypeOf<{}>();
	});
});

describe('3. EventHandlers<T>', () => {
	type DOMEvents = {
		click: MouseEvent;
		submit: Event;
		change: Event;
	};

	it('генерирует onEventName из ключей объекта', () => {
		type Handlers = EventHandlers<DOMEvents>;
		expectTypeOf<Handlers>().toHaveProperty('onClick');
		expectTypeOf<Handlers>().toHaveProperty('onSubmit');
		expectTypeOf<Handlers>().toHaveProperty('onChange');
	});

	it('обработчик принимает событие соответствующего типа', () => {
		type Handlers = EventHandlers<DOMEvents>;
		expectTypeOf<Handlers['onClick']>().toEqualTypeOf<(event: MouseEvent) => void>();
		expectTypeOf<Handlers['onSubmit']>().toEqualTypeOf<(event: Event) => void>();
	});

	it('возвращаемый тип обработчика — void', () => {
		type Handlers = EventHandlers<{ click: MouseEvent }>;
		expectTypeOf<Handlers['onClick']>().returns.toEqualTypeOf<void>();
	});
});
