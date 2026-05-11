import { describe, expect, it } from 'vitest';
import authReducer, {
	logout,
	setUser,
} from '../authSlice';

describe('authSlice', () => {
	it('хранит mock-пользователя по умолчанию', () => {
		const state = authReducer(undefined, { type: 'unknown' });

		expect(state.isAuthenticated).toBe(true);
		expect(state.user?.email).toBe('demo@example.com');
	});

	it('устанавливает пользователя', () => {
		const state = authReducer(
			undefined,
			setUser({
				id: '2',
				name: 'Anton',
				email: 'anton@test.ru',
			}),
		);

		expect(state.isAuthenticated).toBe(true);
		expect(state.user?.name).toBe('Anton');
	});

	it('выходит из аккаунта', () => {
		const state = authReducer(undefined, logout());

		expect(state.isAuthenticated).toBe(false);
		expect(state.user).toBeNull();
	});
});