/**
 * In-memory staging area for an employee that is being created.
 *
 * The child-record components (emergency contacts, dependents, qualifications, documents,
 * assets, ...) talk to the API through a `base` path. While an employee does not exist yet,
 * the "Add employee" page passes `draftBase(key)` instead of `/hr/employees/:id`, and the
 * api service routes those calls here. On save, `draftRecords` is replayed against the real
 * employee and each record is removed once it has been stored.
 */
const PREFIX = 'draft:';
const stores = new Map(); // key -> { seq, records: [{ id, entity, payload, row }] }

export const draftBase = (key) => `${PREFIX}${key}`;
export const isDraftBase = (base) => typeof base === 'string' && base.startsWith(PREFIX);

const getStore = (base) => {
  const key = base.slice(PREFIX.length);
  if (!stores.has(key)) stores.set(key, { seq: 0, records: [] });
  return stores.get(key);
};

const camelToSnake = (s) => s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

// Mirror the shape the API returns (snake_case columns) so the list components render drafts
// exactly like saved rows.
const toRow = (entity, payload) => {
  const entries = payload instanceof FormData ? [...payload.entries()] : Object.entries(payload);
  const row = {};
  entries.forEach(([k, v]) => {
    if (typeof File !== 'undefined' && v instanceof File) { row.file_name = v.name; return; }
    if (v === '' || v === undefined || v === null) return;
    const col = camelToSnake(k);
    row[col] = /_id$/.test(col) && !Number.isNaN(Number(v)) ? Number(v) : v;
  });
  if (entity === 'assets') row.status = 'assigned';
  return row;
};

export const draftList = (base, entity) => ({
  success: true,
  data: getStore(base).records.filter((r) => r.entity === entity).map((r) => r.row),
});

export const draftCreate = (base, entity, payload) => {
  const store = getStore(base);
  store.seq += 1;
  const id = `draft-${store.seq}`;
  const row = { id, ...toRow(entity, payload) };
  store.records.push({ id, entity, payload, row });
  return { success: true, data: row };
};

export const draftUpdate = (base, entity, id, payload) => {
  const record = getStore(base).records.find((r) => r.id === id && r.entity === entity);
  if (!record) return { success: false, message: 'Record not found' };
  record.payload = payload;
  record.row = { id, ...toRow(entity, payload) };
  return { success: true, data: record.row };
};

export const draftDelete = (base, entity, id) => {
  const store = getStore(base);
  store.records = store.records.filter((r) => !(r.id === id && r.entity === entity));
  return { success: true };
};

export const draftRecords = (base) => [...getStore(base).records];

export const draftCount = (base, entity) => getStore(base).records.filter((r) => !entity || r.entity === entity).length;

export const draftRemove = (base, id) => {
  const store = getStore(base);
  store.records = store.records.filter((r) => r.id !== id);
};

export const draftClear = (base) => { stores.delete(base.slice(PREFIX.length)); };
