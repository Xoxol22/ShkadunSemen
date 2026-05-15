import { useEffect, useState } from 'react';
import {
  getDocumentStorageKey,
  getDocumentsListKey,
  loadSavedDocument,
} from '../features/documents/mockDocumentsApi';
import { exportCellsToCsv, exportCellsToJson, parseCsv } from '../features/documents/exportImport';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useNavigate } from 'react-router-dom';
import {
  addDocument,
  deleteDocument as deleteDocumentAction,
  renameDocument,
  loadDocuments,
  updateDocumentPreview,
} from '../store/slices/documentsSlice';


type DocumentItem = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  preview: string[][];
};


export function DocumentsPage() {

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    const dispatch = useAppDispatch();

    const documents = useAppSelector((state) => state.documents.items);
    const isLoading = useAppSelector((state) => state.documents.isLoading);
    const currentUser = useAppSelector((state) => state.auth.user);
    const userId = currentUser?.id;

    const navigate = useNavigate();

    useEffect(() => {
        if (!userId) return;

        dispatch(loadDocuments(userId));
    }, [dispatch, userId]);

    function getDocumentCells(document: DocumentItem) {
        if (!userId) {
            return {};
        }

        const savedDocument = loadSavedDocument(document.id, userId);

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
        if (!userId) return;

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
                getDocumentStorageKey(userId, documentId),
                JSON.stringify({
                    cells,
                    updatedAt: new Date().toISOString(),
                }),
            );

            const documentsListKey = getDocumentsListKey(userId);

            const localDocuments = JSON.parse(
                localStorage.getItem(documentsListKey) ?? '[]',
            ) as DocumentItem[];

            const exists = documents.some((document) => document.id === documentId);

            if (exists) {
                dispatch(
                    updateDocumentPreview({
                        documentId,
                        preview,
                        updatedAt: date,
                    }),
                );

                localStorage.setItem(
                    documentsListKey,
                    JSON.stringify(
                        localDocuments.map((document) =>
                            document.id === documentId
                                ? {
                                    ...document,
                                    preview,
                                    updatedAt: date,
                                }
                                : document,
                        ),
                    ),
                );

                return;
            }

            const newDocument: DocumentItem = {
                id: documentId,
                title: title ?? 'Импортированная таблица',
                createdAt: date,
                updatedAt: date,
                preview,
            };

            dispatch(addDocument(newDocument));

            localStorage.setItem(
                documentsListKey,
                JSON.stringify([...localDocuments, newDocument]),
            );
        };

        reader.readAsText(file);
    }

    function startRename(documentId: string, currentTitle: string) {
        setEditingId(documentId);
        setEditingTitle(currentTitle);
    }

    function saveRename(documentId: string) {
        if (!userId) return;

        const title = editingTitle.trim();

        if (!title) {
            setEditingId(null);
            setEditingTitle('');
            return;
        }

        const updatedAt = new Date().toLocaleDateString('ru-RU');

        dispatch(
            renameDocument({
                documentId,
                title,
                updatedAt,
            }),
        );

        const documentsListKey = getDocumentsListKey(userId);

        const localDocuments = JSON.parse(
            localStorage.getItem(documentsListKey) ?? '[]',
        ) as DocumentItem[];

        const documentsForUpdate = localDocuments.length > 0 ? localDocuments : documents;

        localStorage.setItem(
            documentsListKey,
            JSON.stringify(
                documentsForUpdate.map((document) =>
                    document.id === documentId
                        ? {
                            ...document,
                            title,
                            updatedAt,
                        }
                        : document,
                ),
            ),
        );

        setEditingId(null);
        setEditingTitle('');
    }

    function deleteDocument(documentId: string) {
        if (!userId) return;

        const confirmed = window.confirm('Удалить документ? Это действие нельзя отменить.');

        if (!confirmed) return;

        dispatch(deleteDocumentAction(documentId));

        localStorage.removeItem(getDocumentStorageKey(userId, documentId));

        const documentsListKey = getDocumentsListKey(userId);

        const localDocuments = JSON.parse(
            localStorage.getItem(documentsListKey) ?? '[]',
        ) as DocumentItem[];

        const updatedLocalDocuments = localDocuments.filter(
            (document) => document.id !== documentId,
        );

        localStorage.setItem(
            documentsListKey,
            JSON.stringify(updatedLocalDocuments),
        );
    }

    function duplicateDocument(documentId: string) {
        if (!userId) return;

        const sourceDocument = documents.find((document) => document.id === documentId);

        if (!sourceDocument) return;

        const date = new Date().toLocaleDateString('ru-RU');
        const newDocumentId = crypto.randomUUID();

        const copyIndex =
            documents.filter((document) =>
                document.title.startsWith(`${sourceDocument.title} — копия`),
            ).length + 1;

        const copiedDocument: DocumentItem = {
            ...sourceDocument,
            id: newDocumentId,
            title: `${sourceDocument.title} — копия ${copyIndex}`,
            createdAt: date,
            updatedAt: date,
        };

        dispatch(addDocument(copiedDocument));

        const sourceSavedDocument = loadSavedDocument(sourceDocument.id, userId);

        localStorage.setItem(
            getDocumentStorageKey(userId, newDocumentId),
            JSON.stringify({
                cells: sourceSavedDocument?.cells ?? getDocumentCells(sourceDocument),
                updatedAt: new Date().toISOString(),
            }),
        );

        const documentsListKey = getDocumentsListKey(userId);

        const localDocuments = JSON.parse(
            localStorage.getItem(documentsListKey) ?? '[]',
        ) as DocumentItem[];

        localStorage.setItem(
            documentsListKey,
            JSON.stringify([...localDocuments, copiedDocument]),
        );
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
                if (!userId) return;

                const date = new Date().toLocaleDateString('ru-RU');

                const newDocument: DocumentItem = {
                    id: crypto.randomUUID(),
                    title: 'Новая таблица',
                    createdAt: date,
                    updatedAt: date,
                    preview: [
                        ['', '', ''],
                        ['', '', ''],
                        ['', '', ''],
                    ],
                };

                dispatch(addDocument(newDocument));

                localStorage.setItem(
                    getDocumentStorageKey(userId, newDocument.id),
                    JSON.stringify({
                        cells: {},
                        updatedAt: new Date().toISOString(),
                    }),
                );

                const documentsListKey = getDocumentsListKey(userId);

                const localDocuments = JSON.parse(
                    localStorage.getItem(documentsListKey) ?? '[]',
                ) as DocumentItem[];

                localStorage.setItem(
                    documentsListKey,
                    JSON.stringify([...localDocuments, newDocument]),
                );

                setEditingId(newDocument.id);
                setEditingTitle(newDocument.title);
            }}
            >
            + Создать пустую таблицу
            </button>
        </div>
      </header>

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
                navigate(`/documents/${document.id}`);
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