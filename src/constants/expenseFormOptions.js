/** Default payee options for manual expense entry */
export const PAID_TO_OPTIONS = [
  { value: 'Operations', label: 'Operations' },
  { value: 'Supplier', label: 'Supplier' },
  { value: 'Employee', label: 'Employee' },
  { value: 'Utility provider', label: 'Utility provider' },
  { value: 'Government / authority', label: 'Government / authority' },
  { value: 'Landlord', label: 'Landlord' },
];

export const PAID_TO_STORAGE_KEY = 'clearearth_expense_paid_to_custom';
export const PAYMENT_METHOD_STORAGE_KEY = 'clearearth_expense_payment_method_custom';

export function loadStoredOptions(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string' && v.trim()) : [];
  } catch {
    return [];
  }
}

export function saveStoredOptions(storageKey, values) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(values));
  } catch {
    /* ignore */
  }
}

export function mergeSelectOptions(baseOptions, customValues, currentValue) {
  const seen = new Set();
  const merged = [];
  const add = (value, label) => {
    const v = String(value || '').trim();
    if (!v || seen.has(v)) return;
    seen.add(v);
    merged.push({ value: v, label: label || v });
  };
  baseOptions.forEach((o) => add(o.value, o.label));
  customValues.forEach((v) => add(v, v));
  if (currentValue) add(currentValue, currentValue);
  return merged;
}
