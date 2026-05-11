import { useState } from 'react';
import { DocumentsPage  } from './features/spreadsheet/DocumentsPage';
import { SpreadsheetPage } from './features/spreadsheet/SpreadsheetPage';

type OpenedDocument = {
  id: string;
  title: string;
  preview: string[][];
};

export default function App() {
 const [openedDocument, setOpenedDocument] = useState<OpenedDocument | null>(null);

  if (openedDocument) {
    return (
      <SpreadsheetPage
        documentId={openedDocument.id}
        documentTitle={openedDocument.title}
        preview={openedDocument.preview}
        onBack={() => setOpenedDocument(null)}
      />
    );
  }

  return <DocumentsPage onOpenDocument={setOpenedDocument} />;
}