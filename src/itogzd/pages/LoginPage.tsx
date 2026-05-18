import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login } from '../store/slices/authSlice';

type LocationState = {
	from?: {
		pathname: string;
	};
};

export function LoginPage() {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const location = useLocation();

	const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
	const isLoading = useAppSelector((state) => state.auth.isLoading);
	const error = useAppSelector((state) => state.auth.error);

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const state = location.state as LocationState | null;
	const from = state?.from?.pathname ?? '/dashboard';

	if (isAuthenticated) {
		return <Navigate to="/dashboard" replace />;
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const result = await dispatch(
			login({
				email,
				password,
			}),
		);

		if (login.fulfilled.match(result)) {
			navigate(from, { replace: true });
		}
	}

	return (
		<div className="authPage">
			<form className="authCard" onSubmit={handleSubmit}>
				<h1>Вход</h1>

				<label>
					Email
					<input
						type="email"
						value={email}
						required
						onChange={(event) => setEmail(event.target.value)}
					/>
				</label>

				<label>
					Пароль
					<input
						type="password"
						value={password}
						minLength={8}
						required
						onChange={(event) => setPassword(event.target.value)}
					/>
				</label>

				{error && <p className="authError">{error}</p>}

				<button type="submit" disabled={isLoading}>
					{isLoading ? 'Входим...' : 'Войти'}
				</button>

				<p>
					Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
				</p>
			</form>
		</div>
	);
}
