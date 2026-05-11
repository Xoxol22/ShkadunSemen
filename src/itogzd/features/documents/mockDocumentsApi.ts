import type { CellData } from '../../types';

type PatchDocumentPayload = {
  cells: Record<string, CellData>;
  updatedAt: string;
};

export async function patchDocument(
  documentId: string,
  payload: PatchDocumentPayload,
) {
  console.log(`PATCH /documents/${documentId}`, payload);

  await new Promise((resolve) => {
    setTimeout(resolve, 300);
  });

  const raw = localStorage.getItem(`document:${documentId}`);

  const current = raw ? JSON.parse(raw) : {};

  localStorage.setItem(
    `document:${documentId}`,
    JSON.stringify({
      ...current,
      cells: payload.cells,
      updatedAt: payload.updatedAt,
    }),
  );

  return { success: true };
}

export function loadSavedDocument(documentId: string) {
  const raw = localStorage.getItem(`document:${documentId}`);

  if (!raw) return null;

  return JSON.parse(raw);
}