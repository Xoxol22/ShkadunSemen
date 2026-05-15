import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { register } from '../store/slices/authSlice';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const error = useAppSelector((state) => state.auth.error);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setFormError('Пароль должен быть не короче 8 символов');
      return;
    }

    if (password !== passwordConfirm) {
      setFormError('Пароли не совпадают');
      return;
    }

    setFormError(null);

    const result = await dispatch(
      register({
        name,
        email,
        password,
      }),
    );

    if (register.fulfilled.match(result)) {
      navigate('/dashboard', { replace: true });
    }
  }

  return (
    <div className="authPage">
      <form className="authCard" onSubmit={handleSubmit}>
        <h1>Регистрация</h1>

        <label>
          Имя
          <input
            value={name}
            required
            onChange={(event) => setName(event.target.value)}
          />
        </label>

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

        <label>
          Подтверждение пароля
          <input
            type="password"
            value={passwordConfirm}
            minLength={8}
            required
            onChange={(event) => setPasswordConfirm(event.target.value)}
          />
        </label>

        {(formError || error) && (
          <p className="authError">{formError ?? error}</p>
        )}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
        </button>

        <p>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  );
}