/** Parse inspection request supporting_documents (legacy single path or JSON array). */
export const parseSupportingDocuments = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter((d) => d?.path)
      .map((d) => ({
        path: d.path,
        fileName: d.fileName || d.path.split('/').pop() || 'Document',
      }));
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((d) => d?.path)
          .map((d) => ({
            path: d.path,
            fileName: d.fileName || d.path.split('/').pop() || 'Document',
          }));
      }
    } catch {
      // legacy single file path
    }
    return [{ path: trimmed, fileName: trimmed.split('/').pop() || 'Document' }];
  }
  return [];
};

export const isImageDocumentPath = (path) => /\.(jpe?g|png|gif|webp)$/i.test(path || '');
