import { DocumentsPage  } from './features/spreadsheet/DocumentsPage';
import { SpreadsheetPage } from './features/spreadsheet/SpreadsheetPage';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setActiveDocument } from './store/slices/documentsSlice';

export default function App() {
 const dispatch = useAppDispatch();
const openedDocument = useAppSelector((state) => state.documents.activeDocument);

  if (openedDocument) {
    return (
      <SpreadsheetPage
        documentId={openedDocument.id}
        documentTitle={openedDocument.title}
        preview={openedDocument.preview}
        onBack={() => dispatch(setActiveDocument(null))}
      />
    );
  }

  return <DocumentsPage />;
}