export type Transform<T> = (data: T[]) => T[];

export type Where<T> = <K extends keyof T>(key: K, value: T[K]) => Transform<T>;

export type Sort<T> = <K extends keyof T>(key: K) => Transform<T>;

export type Group<T, K extends keyof T> = {
	key: T[K];
	items: T[];
};

export type GroupBy<T> = <K extends keyof T>(key: K) => (data: T[]) => Group<T, K>[];

export type GroupTransform<T, K extends keyof T> = (
	groups: Group<T, K>[],
) => Group<T, K>[];

export type Having<T> = <K extends keyof T>(
	predicate: (group: Group<T, K>) => boolean,
) => GroupTransform<T, K>;

type Phase = 'where' | 'groupBy' | 'having' | 'sort';

type StepPhase<T, F> =
	F extends Transform<T>
		? 'where' | 'sort'
		: F extends (data: T[]) => Group<T, any>[]
			? 'groupBy'
			: F extends GroupTransform<T, any>
				? 'having'
				: never;

type CheckSteps<
	T,
	Steps extends readonly unknown[],
	State extends Phase = 'where',
> = Steps extends [infer F, ...infer Rest]
	? StepPhase<T, F> extends infer P
		? P extends never
			? never
			: State extends 'where'
				? P extends 'where' | 'groupBy' | 'sort'
					? CheckSteps<
							T,
							Rest,
							P extends 'groupBy'
								? 'groupBy'
								: P extends 'sort'
									? 'sort'
									: 'where'
						>
					: never
				: State extends 'groupBy'
					? P extends 'having'
						? CheckSteps<T, Rest, 'having'>
						: never
					: State extends 'having'
						? P extends 'having' | 'sort'
							? CheckSteps<T, Rest, P extends 'sort' ? 'sort' : 'having'>
							: never
						: State extends 'sort'
							? P extends 'sort'
								? CheckSteps<T, Rest, 'sort'>
								: never
							: never
		: never
	: Steps;

type ValidSteps<T, S extends readonly unknown[]> =
	CheckSteps<T, S> extends never ? never : S;

export function where<T>(): Where<T> {
	return (key, value) => (data: T[]) =>
		data.filter((item) => item[key as keyof T] === value);
}

export function groupBy<T>(): GroupBy<T> {
	return <K extends keyof T>(key: K) =>
		(data: T[]) => {
			const acc = {} as Record<string, Group<T, K>>;
			for (const item of data) {
				const k = String(item[key]);
				if (!acc[k]) acc[k] = { key: item[key], items: [] };
				acc[k].items.push(item);
			}
			return Object.values(acc);
		};
}

export function having<T>(): Having<T> {
	return (predicate) => (groups) => groups.filter(predicate);
}

export function sort<T>(): Sort<T> {
	return (key) => (data: T[]) =>
		[...data].sort((a, b) => {
			const av = a[key as keyof T];
			const bv = b[key as keyof T];
			if (av < bv) return -1;
			if (av > bv) return 1;
			return 0;
		});
}

export function query<T, S extends readonly unknown[] = readonly unknown[]>(
	...steps: ValidSteps<
		T,
		S &
			readonly (
				| Transform<T>
				| ((data: T[]) => Group<T, any>[])
				| GroupTransform<T, any>
			)[]
	>
): (data: T[]) => any {
	const fns = steps as unknown as Array<(data: unknown) => unknown>;
	return (data: T[]) => fns.reduce((acc, step) => step(acc), data as unknown) as any;
}
