import { useEffect, useState } from 'react';
import './App.css';
import BookCard from './BookCard';

type ApiBook = {
	id: number;
	title: string;
	isbn: string;
	pageCount: number;
	authors: string[];
};

type BookWithCover = ApiBook & {
	coverBlob: Blob | null;
};

async function getCoverBlobByIsbn(isbn: string): Promise<Blob | null> {
	try {
		const imageUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

		const response = await fetch(imageUrl);

		if (!response.ok) {
			return null;
		}

		const blob = await response.blob();

		if (blob.size === 0) {
			return null;
		}

		return blob;
	} catch {
		return null;
	}
}

function App() {
	const [books, setBooks] = useState<BookWithCover[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		async function loadBooks() {
			try {
				setLoading(true);
				setError('');

				const response = await fetch('https://fakeapi.extendsclass.com/books');

				if (!response.ok) {
					throw new Error('Не удалось получить книги');
				}

				const data: ApiBook[] = (await response.json()).slice(0, 10);

				const booksWithCovers: BookWithCover[] = await Promise.all(
					data.map(async (book) => {
						const coverBlob = await getCoverBlobByIsbn(book.isbn);

						return {
							...book,
							coverBlob,
						};
					}),
				);

				setBooks(booksWithCovers);
			} catch (e) {
				setError('Ошибка при загрузке книг');
				console.error(e);
			} finally {
				setLoading(false);
			}
		}

		loadBooks();
	}, []);

	if (loading) {
		return <div className="status">Загрузка...</div>;
	}

	if (error) {
		return <div className="status error">{error}</div>;
	}

	return (
		<div className="app">
			<h1 className="app__title">Каталог книг</h1>

			<div className="books-container">
				{books.map((book) => (
					<BookCard
						key={book.id}
						title={book.title}
						authors={book.authors}
						coverBlob={book.coverBlob}
					/>
				))}
			</div>
		</div>
	);
}

export default App;
