import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type User = {
	id: string;
	name: string;
	email: string;
};

type AuthState = {
	user: User | null;
	isAuthenticated: boolean;
};

const initialState: AuthState = {
	user: {
		id: '1',
		name: 'Demo User',
		email: 'demo@example.com',
	},

	isAuthenticated: true,
};

const authSlice = createSlice({
	name: 'auth',

	initialState,

	reducers: {
		setUser(state, action: PayloadAction<User | null>) {
			state.user = action.payload;
			state.isAuthenticated = Boolean(action.payload);
		},

		logout(state) {
			state.user = null;
			state.isAuthenticated = false;
		},
	},
});

export const {
	setUser,
	logout,
} = authSlice.actions;

export default authSlice.reducer;