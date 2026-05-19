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
	const rawDocument = localStorage.getItem(getDocumentStorageKey(userId, documentId));

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

export type DocumentAccessStatus = 'allowed' | 'forbidden' | 'not_found';

function readDocumentIdsFromList(storageKey: string) {
	try {
		const rawDocuments = localStorage.getItem(storageKey);

		if (!rawDocuments) {
			return [];
		}

		const documents = JSON.parse(rawDocuments) as Array<{ id?: unknown }>;

		return documents
			.map((document) => document.id)
			.filter((id): id is string => typeof id === 'string');
	} catch {
		return [];
	}
}

export function getDocumentAccessStatus(
	userId: string,
	documentId: string,
): DocumentAccessStatus {
	const currentUserDocumentsKey = getDocumentsListKey(userId);

	const currentUserDocumentIds = readDocumentIdsFromList(currentUserDocumentsKey);

	if (currentUserDocumentIds.includes(documentId)) {
		return 'allowed';
	}

	const documentExistsInAnotherAccount = Object.keys(localStorage)
		.filter(
			(key) => key.startsWith('documents:list:') && key !== currentUserDocumentsKey,
		)
		.some((key) => readDocumentIdsFromList(key).includes(documentId));

	if (documentExistsInAnotherAccount) {
		console.warn(`GET /documents/${documentId} -> 403 Forbidden`);

		return 'forbidden';
	}

	return 'not_found';
}
