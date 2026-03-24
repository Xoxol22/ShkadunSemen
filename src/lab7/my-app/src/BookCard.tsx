import { useEffect, useState } from "react";

type BookCardProps = {
  title: string;
  authors: string[];
  coverBlob: Blob | null;
};

export default function BookCard({ title, authors, coverBlob }: BookCardProps) {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    if (!coverBlob) {
      setImageUrl("");
      return;
    }

    const url = URL.createObjectURL(coverBlob);
    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [coverBlob]);

  return (
    <div className="book-card">
      <div className="book-card__image-wrapper">
        {imageUrl ? (
          <img className="book-card__image" src={imageUrl} alt={title} />
        ) : (
          <div className="book-card__placeholder">Нет обложки</div>
        )}
      </div>

      <h3 className="book-card__title">{title}</h3>
      <p className="book-card__authors">{authors.join(", ")}</p>
    </div>
  );
}