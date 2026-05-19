export type DeepReadonly<T> = T extends Primitive
	? T
	: T extends (...args: any[]) => any
		? T
		: T extends (infer U)[]
			? readonly DeepReadonly<U>[]
			: { readonly [K in keyof T]: DeepReadonly<T[K]> };

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

export type PickedByType<T, U> = {
	[K in keyof T as T[K] extends U ? K : never]: T[K];
};

export type EventHandlers<T> = {
	[K in keyof T as `on${Capitalize<string & K>}`]: (event: T[K]) => void;
};
