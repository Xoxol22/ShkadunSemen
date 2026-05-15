import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import {
  AuthUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  LoginPayload,
  RegisterPayload,
} from '../../features/auth/mockAuthApi';

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload) => {
    return loginUser(payload);
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload) => {
    return registerUser(payload);
  },
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async () => {
    return refreshAccessToken();
  },
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await logoutUser();
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
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Ошибка входа';
      })

      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
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
        state.error = null;
      });
  },
});

export const { clearAuthError } = authSlice.actions;

export default authSlice.reducer;