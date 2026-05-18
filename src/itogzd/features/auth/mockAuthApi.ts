export type AuthUser = {
	id: string;
	name: string;
	email: string;
	createdAt: string;
};

export type LoginPayload = {
	email: string;
	password: string;
};

export type RegisterPayload = {
	name: string;
	email: string;
	password: string;
};

export type AuthResponse = {
	user: AuthUser;
	accessToken: string;
	refreshToken: string;
};

type StoredUser = AuthUser & {
	password: string;
};

const USERS_STORAGE_KEY = 'auth:users';
const REFRESH_TOKEN_STORAGE_KEY = 'auth:refreshToken';

function getStoredUsers(): StoredUser[] {
	return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) ?? '[]') as StoredUser[];
}

function saveStoredUsers(users: StoredUser[]) {
	localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function createToken(prefix: string) {
	return `${prefix}.${crypto.randomUUID()}.${Date.now()}`;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
	const users = getStoredUsers();

	const existingUser = users.find((user) => user.email === payload.email);

	if (existingUser) {
		throw new Error('Пользователь с таким email уже существует');
	}

	const newUser: StoredUser = {
		id: crypto.randomUUID(),
		name: payload.name,
		email: payload.email,
		password: payload.password,
		createdAt: new Date().toISOString(),
	};

	saveStoredUsers([...users, newUser]);

	const accessToken = createToken('access');
	const refreshToken = createToken('refresh');

	localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);

	const { password: _password, ...userWithoutPassword } = newUser;

	return {
		user: userWithoutPassword,
		accessToken,
		refreshToken,
	};
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
	const users = getStoredUsers();

	const user = users.find(
		(storedUser) =>
			storedUser.email === payload.email &&
			storedUser.password === payload.password,
	);

	if (!user) {
		throw new Error('Неверный email или пароль');
	}

	const accessToken = createToken('access');
	const refreshToken = createToken('refresh');

	localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);

	const { password: _password, ...userWithoutPassword } = user;

	return {
		user: userWithoutPassword,
		accessToken,
		refreshToken,
	};
}

export async function refreshAccessToken(): Promise<string> {
	const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

	if (!refreshToken) {
		throw new Error('Refresh token отсутствует');
	}

	return createToken('access');
}

export async function logoutUser() {
	localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export type UpdateUserNamePayload = {
	userId: string;
	name: string;
};

export type ChangePasswordPayload = {
	userId: string;
	currentPassword: string;
	newPassword: string;
};

export async function updateUserName(payload: UpdateUserNamePayload): Promise<AuthUser> {
	const users = getStoredUsers();

	const user = users.find((storedUser) => storedUser.id === payload.userId);

	if (!user) {
		throw new Error('Пользователь не найден');
	}

	const updatedUser: StoredUser = {
		...user,
		name: payload.name,
	};

	saveStoredUsers(
		users.map((storedUser) =>
			storedUser.id === payload.userId ? updatedUser : storedUser,
		),
	);

	const { password: _password, ...userWithoutPassword } = updatedUser;

	return userWithoutPassword;
}

export async function changeUserPassword(payload: ChangePasswordPayload) {
	const users = getStoredUsers();

	const user = users.find((storedUser) => storedUser.id === payload.userId);

	if (!user) {
		throw new Error('Пользователь не найден');
	}

	if (user.password !== payload.currentPassword) {
		throw new Error('Текущий пароль указан неверно');
	}

	const updatedUser: StoredUser = {
		...user,
		password: payload.newPassword,
	};

	saveStoredUsers(
		users.map((storedUser) =>
			storedUser.id === payload.userId ? updatedUser : storedUser,
		),
	);

	return { success: true };
}
