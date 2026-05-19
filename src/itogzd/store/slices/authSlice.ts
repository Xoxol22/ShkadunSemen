import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
	type AuthUser,
	type ChangePasswordPayload,
	type LoginPayload,
	type RegisterPayload,
	type UpdateUserNamePayload,
	changeUserPassword,
	loginUser,
	logoutUser,
	refreshAccessToken,
	registerUser,
	restoreAuthSession,
	updateUserName,
} from '../../features/auth/mockAuthApi';

type AuthState = {
	user: AuthUser | null;
	accessToken: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isInitialized: boolean;
	error: string | null;
};

const initialState: AuthState = {
	user: null,
	accessToken: null,
	isAuthenticated: false,
	isLoading: false,
	isInitialized: false,
	error: null,
};

export const restoreSession = createAsyncThunk('auth/restoreSession', async () => {
	return restoreAuthSession();
});

export const login = createAsyncThunk('auth/login', async (payload: LoginPayload) => {
	return loginUser(payload);
});

export const register = createAsyncThunk(
	'auth/register',
	async (payload: RegisterPayload) => {
		return registerUser(payload);
	},
);

export const refreshToken = createAsyncThunk('auth/refreshToken', async () => {
	return refreshAccessToken();
});

export const logout = createAsyncThunk('auth/logout', async () => {
	await logoutUser();
});

export const updateProfileName = createAsyncThunk(
	'auth/updateProfileName',
	async (payload: UpdateUserNamePayload) => {
		return updateUserName(payload);
	},
);

export const changePassword = createAsyncThunk(
	'auth/changePassword',
	async (payload: ChangePasswordPayload) => {
		return changeUserPassword(payload);
	},
);

const authSlice = createSlice({
	name: 'auth',
	initialState,

	reducers: {
		clearAuthError(state) {
			state.error = null;
		},
	},

	extraReducers: (builder) => {
		builder
			.addCase(restoreSession.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(restoreSession.fulfilled, (state, action) => {
				state.isLoading = false;
				state.isInitialized = true;
				state.user = action.payload.user;
				state.accessToken = action.payload.accessToken;
				state.isAuthenticated = true;
				state.error = null;
			})
			.addCase(restoreSession.rejected, (state) => {
				state.isLoading = false;
				state.isInitialized = true;
				state.user = null;
				state.accessToken = null;
				state.isAuthenticated = false;
				state.error = null;
			})

			.addCase(login.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(login.fulfilled, (state, action) => {
				state.isLoading = false;
				state.isInitialized = true;
				state.user = action.payload.user;
				state.accessToken = action.payload.accessToken;
				state.isAuthenticated = true;
				state.error = null;
			})
			.addCase(login.rejected, (state, action) => {
				state.isLoading = false;
				state.isInitialized = true;
				state.error = action.error.message ?? 'Ошибка входа';
			})

			.addCase(register.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(register.fulfilled, (state, action) => {
				state.isLoading = false;
				state.isInitialized = true;
				state.user = action.payload.user;
				state.accessToken = action.payload.accessToken;
				state.isAuthenticated = true;
				state.error = null;
			})
			.addCase(register.rejected, (state, action) => {
				state.isLoading = false;
				state.isInitialized = true;
				state.error = action.error.message ?? 'Ошибка регистрации';
			})

			.addCase(refreshToken.fulfilled, (state, action) => {
				state.accessToken = action.payload;
				state.isAuthenticated = Boolean(state.user);
			})

			.addCase(logout.fulfilled, (state) => {
				state.user = null;
				state.accessToken = null;
				state.isAuthenticated = false;
				state.isInitialized = true;
				state.error = null;
			})

			.addCase(updateProfileName.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(updateProfileName.fulfilled, (state, action) => {
				state.isLoading = false;
				state.user = action.payload;
			})
			.addCase(updateProfileName.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.error.message ?? 'Ошибка изменения имени';
			})

			.addCase(changePassword.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(changePassword.fulfilled, (state) => {
				state.isLoading = false;
			})
			.addCase(changePassword.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.error.message ?? 'Ошибка смены пароля';
			});
	},
});

export const { clearAuthError } = authSlice.actions;

export default authSlice.reducer;
