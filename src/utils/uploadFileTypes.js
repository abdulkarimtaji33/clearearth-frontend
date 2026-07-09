/** Extensions allowed for inspection supporting documents. */
export const INSPECTION_ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
]);

export const INSPECTION_DOC_ACCEPT = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls', '.xlsx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.xls'],
  // Browsers often mislabel Office files as zip or octet-stream
  'application/zip': ['.docx', '.xlsx'],
  'application/x-zip-compressed': ['.docx', '.xlsx'],
  'application/octet-stream': ['.doc', '.docx', '.xls', '.xlsx'],
};

export const getFileExtension = (filename = '') => {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
};

/** Extension-based validator for react-dropzone (MIME types are unreliable for Office files). */
export const validateInspectionDocument = (file) => {
  const ext = getFileExtension(file.name);
  if (!INSPECTION_ALLOWED_EXTENSIONS.has(ext)) {
    return {
      code: 'file-invalid-type',
      message: 'Allowed: images, PDF, Word (.doc/.docx), Excel (.xls/.xlsx)',
    };
  }
  return null;
};

export const inspectionDocumentAcceptLabel = 'Images, PDF, Word (.doc/.docx), Excel (.xls/.xlsx)';
