import { describe, expect, it } from 'vitest';
import authReducer, {
	changePassword,
	clearAuthError,
	login,
	logout,
	register,
	updateProfileName,
} from '../authSlice';

const testUser = {
	id: 'user-1',
	name: 'Semen',
	email: 'semen@example.com',
	createdAt: '2026-05-18T10:00:00.000Z',
};

describe('authSlice', () => {
	it('starts as unauthenticated by default', () => {
		const state = authReducer(undefined, { type: 'unknown' });

		expect(state.isAuthenticated).toBe(false);
		expect(state.user).toBeNull();
		expect(state.accessToken).toBeNull();
		expect(state.isLoading).toBe(false);
		expect(state.error).toBeNull();
	});

	it('sets user after successful login', () => {
		const state = authReducer(
			undefined,
			login.fulfilled(
				{
					user: testUser,
					accessToken: 'access-token',
					refreshToken: 'refresh-token',
				},
				'request-id',
				{
					email: 'semen@example.com',
					password: '12345678',
				},
			),
		);

		expect(state.isAuthenticated).toBe(true);
		expect(state.user).toEqual(testUser);
		expect(state.accessToken).toBe('access-token');
		expect(state.isLoading).toBe(false);
		expect(state.error).toBeNull();
	});

	it('sets user after successful registration', () => {
		const state = authReducer(
			undefined,
			register.fulfilled(
				{
					user: testUser,
					accessToken: 'access-token',
					refreshToken: 'refresh-token',
				},
				'request-id',
				{
					name: 'Semen',
					email: 'semen@example.com',
					password: '12345678',
				},
			),
		);

		expect(state.isAuthenticated).toBe(true);
		expect(state.user?.email).toBe('semen@example.com');
		expect(state.accessToken).toBe('access-token');
	});

	it('stores auth error after rejected login', () => {
		const state = authReducer(
			undefined,
			login.rejected(new Error('Неверный email или пароль'), 'request-id', {
				email: 'wrong@example.com',
				password: '12345678',
			}),
		);

		expect(state.isAuthenticated).toBe(false);
		expect(state.user).toBeNull();
		expect(state.error).toBe('Неверный email или пароль');
		expect(state.isLoading).toBe(false);
	});

	it('clears auth error', () => {
		const stateWithError = authReducer(
			undefined,
			login.rejected(new Error('Ошибка входа'), 'request-id', {
				email: 'wrong@example.com',
				password: '12345678',
			}),
		);

		const state = authReducer(stateWithError, clearAuthError());

		expect(state.error).toBeNull();
	});

	it('updates profile name', () => {
		const loggedState = authReducer(
			undefined,
			login.fulfilled(
				{
					user: testUser,
					accessToken: 'access-token',
					refreshToken: 'refresh-token',
				},
				'request-id',
				{
					email: 'semen@example.com',
					password: '12345678',
				},
			),
		);

		const updatedUser = {
			...testUser,
			name: 'Anton',
		};

		const state = authReducer(
			loggedState,
			updateProfileName.fulfilled(updatedUser, 'request-id', {
				userId: 'user-1',
				name: 'Anton',
			}),
		);

		expect(state.user?.name).toBe('Anton');
		expect(state.isAuthenticated).toBe(true);
	});

	it('handles successful password change', () => {
		const loggedState = authReducer(
			undefined,
			login.fulfilled(
				{
					user: testUser,
					accessToken: 'access-token',
					refreshToken: 'refresh-token',
				},
				'request-id',
				{
					email: 'semen@example.com',
					password: '12345678',
				},
			),
		);

		const state = authReducer(
			loggedState,
			changePassword.fulfilled({ success: true }, 'request-id', {
				userId: 'user-1',
				currentPassword: '12345678',
				newPassword: '87654321',
			}),
		);

		expect(state.isLoading).toBe(false);
		expect(state.isAuthenticated).toBe(true);
		expect(state.user).toEqual(testUser);
	});

	it('logs out', () => {
		const loggedState = authReducer(
			undefined,
			login.fulfilled(
				{
					user: testUser,
					accessToken: 'access-token',
					refreshToken: 'refresh-token',
				},
				'request-id',
				{
					email: 'semen@example.com',
					password: '12345678',
				},
			),
		);

		const state = authReducer(loggedState, logout.fulfilled(undefined, 'request-id'));

		expect(state.isAuthenticated).toBe(false);
		expect(state.user).toBeNull();
		expect(state.accessToken).toBeNull();
		expect(state.error).toBeNull();
	});
});
