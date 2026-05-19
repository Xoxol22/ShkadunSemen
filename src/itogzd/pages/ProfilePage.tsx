import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
	changePassword,
	clearAuthError,
	updateProfileName,
} from '../store/slices/authSlice';

type DocumentItem = {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
	preview: string[][];
};

export function ProfilePage() {
	const dispatch = useAppDispatch();

	const user = useAppSelector((state) => state.auth.user);
	const isLoading = useAppSelector((state) => state.auth.isLoading);
	const error = useAppSelector((state) => state.auth.error);
	const documents = useAppSelector((state) => state.documents.items);

	const [name, setName] = useState(user?.name ?? '');
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [passwordConfirm, setPasswordConfirm] = useState('');

	const [isNameModalOpen, setIsNameModalOpen] = useState(false);
	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

	const [defaultDocumentIds, setDefaultDocumentIds] = useState<string[]>([]);

	const [profileMessage, setProfileMessage] = useState<string | null>(null);
	const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

	useEffect(() => {
		async function loadDefaultDocumentIds() {
			try {
				const response = await fetch('/itogzd/files/documents.json');

				if (!response.ok) return;

				const defaultDocuments = (await response.json()) as DocumentItem[];

				setDefaultDocumentIds(defaultDocuments.map((document) => document.id));
			} catch {
				setDefaultDocumentIds([]);
			}
		}

		loadDefaultDocumentIds();
	}, []);

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const userDocumentsCount = documents.filter(
		(document) => !defaultDocumentIds.includes(document.id),
	).length;

	async function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!user) return;

		const trimmedName = name.trim();

		if (!trimmedName) {
			setProfileMessage('Имя не может быть пустым');
			return;
		}

		dispatch(clearAuthError());
		setProfileMessage(null);

		const result = await dispatch(
			updateProfileName({
				userId: user.id,
				name: trimmedName,
			}),
		);

		if (updateProfileName.fulfilled.match(result)) {
			setProfileMessage('Имя обновлено');
			setIsNameModalOpen(false);
		}
	}

	async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!user) return;

		if (newPassword.length < 8) {
			setPasswordMessage('Новый пароль должен быть не короче 8 символов');
			return;
		}

		if (newPassword !== passwordConfirm) {
			setPasswordMessage('Пароли не совпадают');
			return;
		}

		dispatch(clearAuthError());
		setPasswordMessage(null);

		const result = await dispatch(
			changePassword({
				userId: user.id,
				currentPassword,
				newPassword,
			}),
		);

		if (changePassword.fulfilled.match(result)) {
			setCurrentPassword('');
			setNewPassword('');
			setPasswordConfirm('');
			setPasswordMessage('Пароль изменён');
			setIsPasswordModalOpen(false);
		}
	}

	function closeNameModal() {
		if (!user) return;
		setIsNameModalOpen(false);
		setName(user.name);
		setProfileMessage(null);
		dispatch(clearAuthError());
	}

	function closePasswordModal() {
		setIsPasswordModalOpen(false);
		setCurrentPassword('');
		setNewPassword('');
		setPasswordConfirm('');
		setPasswordMessage(null);
		dispatch(clearAuthError());
	}

	return (
		<div className="profilePage">
			<header className="profileHeader">
				<h1>Профиль</h1>
				<p>Данные текущего пользователя и настройки аккаунта</p>
			</header>

			<section className="profileGrid">
				<article className="profileCard">
					<h2>Данные пользователя</h2>

					<div className="profileInfo">
						<div>
							<span>Имя</span>
							<strong>{user.name}</strong>
						</div>

						<div>
							<span>Email</span>
							<strong>{user.email}</strong>
						</div>

						<div>
							<span>Дата регистрации</span>
							<strong>
								{new Date(user.createdAt).toLocaleDateString('ru-RU')}
							</strong>
						</div>

						<div>
							<span>Количество личных таблиц</span>
							<strong>{userDocumentsCount}</strong>
						</div>
					</div>

					<div className="profileActions">
						<button
							type="button"
							onClick={() => {
								setName(user.name);
								setIsNameModalOpen(true);
							}}
						>
							Изменить имя
						</button>

						<button
							type="button"
							onClick={() => {
								setIsPasswordModalOpen(true);
							}}
						>
							Сменить пароль
						</button>
					</div>
				</article>
			</section>

			{isNameModalOpen && (
				<div className="modalOverlay" onMouseDown={closeNameModal}>
					<div
						className="profileModal"
						onMouseDown={(event) => event.stopPropagation()}
					>
						<h2>Изменить имя</h2>

						<form className="profileForm" onSubmit={handleNameSubmit}>
							<label>
								Новое имя
								<input
									value={name}
									autoFocus
									onChange={(event) => setName(event.target.value)}
								/>
							</label>

							{profileMessage && (
								<p className="profileMessage">{profileMessage}</p>
							)}
							{error && <p className="profileError">{error}</p>}

							<div className="modalActions">
								<button type="button" onClick={closeNameModal}>
									Отмена
								</button>

								<button type="submit" disabled={isLoading}>
									{isLoading ? 'Сохраняем...' : 'Сохранить'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{isPasswordModalOpen && (
				<div className="modalOverlay" onMouseDown={closePasswordModal}>
					<div
						className="profileModal"
						onMouseDown={(event) => event.stopPropagation()}
					>
						<h2>Сменить пароль</h2>

						<form className="profileForm" onSubmit={handlePasswordSubmit}>
							<label>
								Текущий пароль
								<input
									type="password"
									value={currentPassword}
									autoFocus
									onChange={(event) =>
										setCurrentPassword(event.target.value)
									}
								/>
							</label>

							<label>
								Новый пароль
								<input
									type="password"
									value={newPassword}
									minLength={8}
									onChange={(event) =>
										setNewPassword(event.target.value)
									}
								/>
							</label>

							<label>
								Повторите новый пароль
								<input
									type="password"
									value={passwordConfirm}
									minLength={8}
									onChange={(event) =>
										setPasswordConfirm(event.target.value)
									}
								/>
							</label>

							{passwordMessage && (
								<p className="profileMessage">{passwordMessage}</p>
							)}
							{error && <p className="profileError">{error}</p>}

							<div className="modalActions">
								<button type="button" onClick={closePasswordModal}>
									Отмена
								</button>

								<button type="submit" disabled={isLoading}>
									{isLoading ? 'Сохраняем...' : 'Изменить пароль'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
