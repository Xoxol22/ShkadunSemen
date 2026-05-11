import { useEffect, useState } from 'react';
import { loadSavedDocument } from '../documents/mockDocumentsApi';
import { exportCellsToCsv, exportCellsToJson, parseCsv } from '../documents/exportImport';


type DocumentItem = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  preview: string[][];
};


type DocumentsPageProps = {
  onOpenDocument: (document: {
    id: string;
    title: string;
    preview: string[][];
  }) => void;
};


export function DocumentsPage({ onOpenDocument }: DocumentsPageProps) {

    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    useEffect(() => {
    async function loadDocuments() {
        try {
        const response = await fetch('/itogzd/files/documents.json');

        if (!response.ok) {
            throw new Error('Failed to load documents');
        }

        const data = (await response.json()) as DocumentItem[];

        const documentsWithSavedPreview = data.map((document) => {
        const savedDocument = loadSavedDocument(document.id);

        if (!savedDocument?.cells) {
            return document;
        }

        const preview = Array.from({ length: 3 }, (_, rowIndex) =>
            Array.from({ length: 3 }, (_, colIndex) => {
            const cell = savedDocument.cells[`${rowIndex}:${colIndex}`];

            return cell?.raw ?? '';
            }),
        );

        return {
            ...document,
            preview,
            updatedAt: savedDocument.updatedAt
            ? new Date(savedDocument.updatedAt).toLocaleDateString('ru-RU')
            : document.updatedAt,
        };
        });

        setDocuments(documentsWithSavedPreview);
        } catch (error) {
        console.error(error);
        setDocuments([]);
        } finally {
        setIsLoading(false);
        }
    }
    loadDocuments();
    }, []);

    function getDocumentCells(document: DocumentItem) {
  const savedDocument = loadSavedDocument(document.id);

  if (savedDocument?.cells) {
    return savedDocument.cells;
  }

  const cells: Record<string, { raw: string; computed: string; type: 'string' }> = {};

  document.preview.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      cells[`${rowIndex}:${colIndex}`] = {
        raw: value,
        computed: value,
        type: 'string',
      };
    });
  });

  return cells;
}

function importCsvToDocument(documentId: string, file: File, title?: string) {
    const reader = new FileReader();

    reader.onload = () => {
        const text = String(reader.result ?? '');
        const rows = parseCsv(text);

        const date = new Date().toLocaleDateString('ru-RU');

        const preview = rows.slice(0, 3).map((row) => row.slice(0, 3));

        const cells: Record<string, { raw: string; computed: string; type: 'string' }> = {};

        rows.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
            cells[`${rowIndex}:${colIndex}`] = {
            raw: value,
            computed: value,
            type: 'string',
            };
        });
        });

        localStorage.setItem(
        `document:${documentId}`,
        JSON.stringify({
            cells,
            updatedAt: new Date().toISOString(),
        }),
        );

        setDocuments((currentDocuments) => {
        const exists = currentDocuments.some((document) => document.id === documentId);

        if (exists) {
            return currentDocuments.map((document) =>
            document.id === documentId
                ? {
                    ...document,
                    preview,
                    updatedAt: date,
                }
                : document,
            );
        }

        return [
            ...currentDocuments,
            {
            id: documentId,
            title: title ?? 'Импортированная таблица',
            createdAt: date,
            updatedAt: date,
            preview,
            },
        ];
        });
    };

    reader.readAsText(file);
    }

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
        title: `${sourceDocument.title} — копия ${
        currentDocuments.filter((document) =>
            document.title.startsWith(`${sourceDocument.title} — копия`)
        ).length + 1
        }`,
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

        <div className="documentsHeaderActions">
            <button
                className="importHeaderButton"
                onClick={() => {
                const input = window.document.createElement('input');

                input.type = 'file';
                input.accept = '.csv,text/csv';

                input.onchange = (changeEvent: Event) => {
                    const file = (changeEvent.target as HTMLInputElement).files?.[0];

                    if (file) {
                        const documentId = crypto.randomUUID();
                        const title = file.name.replace(/\.csv$/i, '');

                        importCsvToDocument(documentId, file, title);
                    }
                };

                input.click();
                }}
            >
                Импорт CSV
            </button>

            <button
            className="primaryButton"
            onClick={() => {
                console.log('create empty spreadsheet');
            }}
            >
            + Создать пустую таблицу
            </button>
        </div>
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
      {isLoading && <p className="documentsHint">Загрузка документов...</p>}

    {!isLoading && documents.length === 0 && (
    <p className="documentsHint">Документы не найдены</p>
    )}
      <section className="documentsGrid">
        {documents.map((document) => (
          <article
            key={document.id}
            className="documentCard"
            onDoubleClick={() => {
                onOpenDocument({
                    id: document.id,
                    title: document.title,
                    preview: document.preview,
                });
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
              {document.preview?.map((row, rowIndex) =>
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

                <select
                    defaultValue=""
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                        const action = event.target.value;

                        if (action === 'csv') {
                        exportCellsToCsv(getDocumentCells(document));
                        }

                        if (action === 'json') {
                        exportCellsToJson(getDocumentCells(document));
                        }
                        event.target.value = '';
                    }}
                    >
                    <option value="" disabled>
                        Экспорт
                    </option>

                    <option value="csv">
                        Экспорт в CSV
                    </option>

                    <option value="json">
                        Экспорт в JSON
                    </option>
                </select>
            </div>
            </article>
        ))}
      </section>
    </div>
  );
}