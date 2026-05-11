const mockDocuments = [
  {
    id: '1',
    title: 'Финансовый отчёт',
    createdAt: '11.05.2026',
    updatedAt: '11.05.2026',
  },
  {
    id: '2',
    title: 'Учебная таблица',
    createdAt: '10.05.2026',
    updatedAt: '11.05.2026',
  },
];

export function DocumentsPage() {
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
        {mockDocuments.map((document) => (
          <article
            key={document.id}
            className="documentCard"
            onDoubleClick={() => {
                console.log('open document', document.id);
            }}
            >
            <div className="documentIcon">▦</div>

            <div className="documentInfo">
                <h2>{document.title}</h2>
                <p>Создан: {document.createdAt}</p>
                <p>Изменён: {document.updatedAt}</p>
            </div>

            <div className="documentActions" onDoubleClick={(event) => event.stopPropagation()}>
                <button>Переименовать</button>
                <button>Копировать</button>
                <button className="dangerButton">Удалить</button>

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