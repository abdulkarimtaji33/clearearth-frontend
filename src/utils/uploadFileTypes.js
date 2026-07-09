/** Extensions allowed for inspection supporting documents. */
export const INSPECTION_ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
]);

/** Generic MIME types browsers/OS often use for Office binaries. */
const GENERIC_OFFICE_MIMES = [
  'application/octet-stream',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'application/vnd.ms-office',
  'application/x-ole-storage',
  'application/CDFV2',
  'application/cdfv2',
];

/** Legacy Word (.doc) */
const WORD_DOC_MIMES = [
  'application/msword',
  'application/vnd.ms-word',
  'application/x-msword',
  'application/doc',
  'application/x-doc',
];

/** Word Open XML (.docx) */
const WORD_DOCX_MIMES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  'application/vnd.ms-word.document.macroEnabled.12',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',
];

/** Legacy Excel (.xls) */
const EXCEL_XLS_MIMES = [
  'application/vnd.ms-excel',
  'application/msexcel',
  'application/x-msexcel',
  'application/x-ms-excel',
  'application/x-excel',
  'application/x-dos_ms_excel',
  'application/xls',
  'application/excel',
];

/** Excel Open XML (.xlsx) */
const EXCEL_XLSX_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml',
];

const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx'];

const buildAcceptFromMimes = (mimes, extensions) =>
  Object.fromEntries(mimes.map((mime) => [mime, [...extensions]]));

/** react-dropzone accept map — all known Word/Excel MIME variants + extension validator as fallback. */
export const INSPECTION_DOC_ACCEPT = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  ...buildAcceptFromMimes(WORD_DOC_MIMES, ['.doc']),
  ...buildAcceptFromMimes(WORD_DOCX_MIMES, ['.docx']),
  ...buildAcceptFromMimes(EXCEL_XLS_MIMES, ['.xls', '.xlsx']),
  ...buildAcceptFromMimes(EXCEL_XLSX_MIMES, ['.xlsx', '.xls']),
  ...buildAcceptFromMimes(GENERIC_OFFICE_MIMES, officeExtensions),
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
