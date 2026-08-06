/**
 * Unit of Measure display helpers.
 *
 * Records store the raw catalog `value` (e.g. "kg"), while the catalog also carries a
 * human-readable `display_name` (e.g. "Kilograms (kg)"). Users should always see the
 * display name, so every read-only surface resolves the stored value through the
 * catalog before rendering.
 */

/** Build a { value -> display_name } lookup from the dropdown catalog. */
export function buildUomMap(unitsOfMeasure = []) {
  const map = new Map();
  unitsOfMeasure.forEach((u) => {
    if (u?.value != null) map.set(String(u.value), u.display_name || String(u.value));
  });
  return map;
}

/**
 * Resolve a stored UOM value to its display name.
 * Falls back to the raw value when the catalog has no match (legacy or deleted units),
 * so a line item never renders blank.
 */
export function formatUom(value, unitsOfMeasure = [], fallback = '—') {
  if (value == null || value === '') return fallback;
  const raw = String(value);
  const list = unitsOfMeasure instanceof Map
    ? unitsOfMeasure
    : buildUomMap(unitsOfMeasure);
  return list.get(raw) || raw;
}

/**
 * Resolve the UOM for a line item, honouring the item's own value first and
 * falling back to the linked product/service default.
 */
export function formatItemUom(item, unitsOfMeasure = [], fallback = '—') {
  const value = item?.unit_of_measure
    || item?.unitOfMeasure
    || item?.productService?.unit_of_measure
    || item?.productService?.unitOfMeasure;
  return formatUom(value, unitsOfMeasure, fallback);
}

/** Render a quantity together with its unit, e.g. "12.5 Kilograms (kg)". */
export function formatQuantityWithUom(quantity, value, unitsOfMeasure = [], fallback = '') {
  const qty = quantity == null || quantity === '' ? '' : String(quantity);
  const unit = formatUom(value, unitsOfMeasure, '');
  if (!unit) return qty || fallback;
  return qty ? `${qty} ${unit}` : unit;
}

export default formatUom;
