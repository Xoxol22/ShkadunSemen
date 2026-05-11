import { useState } from 'react';

const initialDocuments  = [
  {
    id: '1',
    title: 'Финансовый отчёт',
    createdAt: '11.05.2026',
    updatedAt: '11.05.2026',
    preview: [
      ['Доход', 'Расход', 'Итог'],
      ['12000', '4000', '8000'],
      ['9000', '3000', '6000'],
    ],
  },
  
  {
    id: '2',
    title: 'Учебная таблица',
    createdAt: '10.05.2026',
    updatedAt: '11.05.2026',
    preview: [
      ['Доход', 'Расход', 'Итог'],
      ['12000', '4000', '8000'],
      ['9000', '3000', '6000'],
    ],
  },
];

export function DocumentsPage() {

    const [documents, setDocuments] = useState(initialDocuments);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    function startRename(documentId: string, currentTitle: string) {
    setEditingId(documentId);
    setEditingTitle(currentTitle);
    }

    function saveRename(documentId: string) {
    const title = editingTitle.trim();

    if (!title) {
        setEditingId(null);
        return;
    }

    setDocuments((currentDocuments) =>
        currentDocuments.map((document) =>
        document.id === documentId
            ? {
                ...document,
                title,
                updatedAt: new Date().toLocaleDateString('ru-RU'),
            }
            : document,
        ),
    );

    setEditingId(null);
    setEditingTitle('');
    }

    function deleteDocument(documentId: string) {
    const confirmed = window.confirm('Удалить документ? Это действие нельзя отменить.');

    if (!confirmed) return;

    setDocuments((currentDocuments) =>
        currentDocuments.filter((document) => document.id !== documentId),
    );
    }

    function duplicateDocument(documentId: string) {
    const sourceDocument = documents.find((document) => document.id === documentId);
    if (!sourceDocument) return;

    const date = new Date().toLocaleDateString('ru-RU');

    setDocuments((currentDocuments) => [
        ...currentDocuments,
        {
        ...sourceDocument,
        id: crypto.randomUUID(),
        title: `${sourceDocument.title} — копия`,
        createdAt: date,
        updatedAt: date,
        },
    ]);
    }

  return (
    <div className="documentsPage">
      <header className="documentsHeader">
        <div>
          <h1>Мои таблицы</h1>
          <p>Управление личными документами пользователя</p>
        </div>

        <button
        className="primaryButton"
        onClick={() => {
            console.log('create empty spreadsheet');
        }}
        >
        + Создать пустую таблицу
        </button>
      </header>

      <section className="newDocumentSection">
        <div
            className="newDocumentCard"
            onDoubleClick={() => {
            console.log('create empty spreadsheet');
            }}
        >
            <div className="newDocumentPreview">
            <div className="miniGrid">
                {Array.from({ length: 28 }).map((_, index) => (
                <div key={index} className="miniCell" />
                ))}
            </div>
            </div>

            <span>Пустая таблица</span>
        </div>
        </section>

      <section className="documentsGrid">
        {documents.map((document) => (
          <article
            key={document.id}
            className="documentCard"
            onDoubleClick={() => {
                console.log('open document', document.id);
            }}
            >
            <div className="documentIcon">▦</div>

            <div className="documentInfo">
                {editingId === document.id ? (
                    <input
                        className="renameInput"
                        value={editingTitle}
                        autoFocus
                        onChange={(event) => setEditingTitle(event.target.value)}
                        onBlur={() => saveRename(document.id)}
                        onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            saveRename(document.id);
                        }

                        if (event.key === 'Escape') {
                            setEditingId(null);
                            setEditingTitle('');
                        }
                        }}
                        onDoubleClick={(event) => event.stopPropagation()}
                        onClick={(event) => event.stopPropagation()}
                    />
                    ) : (
                    <h2
                        onDoubleClick={(event) => {
                        event.stopPropagation();
                        startRename(document.id, document.title);
                        }}
                    >
                        {document.title}
                    </h2>
                    )}
                <p>Создан: {document.createdAt}</p>
                <p>Изменён: {document.updatedAt}</p>
            </div>

            <div className="previewTable">
              {document.preview.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div key={`${rowIndex}:${colIndex}`} className="previewCell">
                    {cell}
                  </div>
                )),
              )}
            </div>

            <div className="documentActions" onDoubleClick={(event) => event.stopPropagation()}>
                <button
                    onClick={(event) => {
                        event.stopPropagation();
                        startRename(document.id, document.title);
                    }}
                    >
                    Переименовать
                    </button>

                    <button
                    onClick={(event) => {
                        event.stopPropagation();
                        duplicateDocument(document.id);
                    }}
                    >
                    Копировать
                    </button>

                    <button
                    className="dangerButton"
                    onClick={(event) => {
                        event.stopPropagation();
                        deleteDocument(document.id);
                    }}
                    >
                    Удалить
                    </button>

                <select defaultValue="">
                <option value="" disabled>
                    Экспорт / Импорт
                </option>
                <option value="csv">Экспорт в CSV</option>
                <option value="json">Экспорт в JSON</option>
                <option value="import-csv">Импорт CSV</option>
                </select>
            </div>
            </article>
        ))}
      </section>
    </div>
  );
}