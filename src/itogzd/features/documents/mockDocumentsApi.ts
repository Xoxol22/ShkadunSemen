import type { CellData } from '../../types';

type PatchDocumentPayload = {
  cells: Record<string, CellData>;
  updatedAt: string;
};

export function getDocumentsListKey(userId: string) {
  return `documents:list:${userId}`;
}

export function getDocumentStorageKey(userId: string, documentId: string) {
  return `document:${userId}:${documentId}`;
}

export function loadSavedDocument(documentId: string, userId: string) {
  const rawDocument = localStorage.getItem(
    getDocumentStorageKey(userId, documentId),
  );

  if (!rawDocument) {
    return null;
  }

  return JSON.parse(rawDocument);
}

export async function patchDocument(
  userId: string,
  documentId: string,
  payload: PatchDocumentPayload,
) {
  console.log(`PATCH /documents/${documentId}`, payload);

  await new Promise((resolve) => {
    setTimeout(resolve, 300);
  });

  const documentStorageKey = getDocumentStorageKey(userId, documentId);

  const raw = localStorage.getItem(documentStorageKey);

  const current = raw ? JSON.parse(raw) : {};

  localStorage.setItem(
    documentStorageKey,
    JSON.stringify({
      ...current,
      cells: payload.cells,
      updatedAt: payload.updatedAt,
    }),
  );

  return { success: true };
}