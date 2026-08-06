import { useEffect, useState } from 'react';
import apiService from '../services/api';
import { formatItemUom, formatQuantityWithUom, formatUom } from '../utils/uom';

/**
 * The UOM catalog is small, tenant-wide and effectively static, so it is fetched once
 * per session and shared by every view that needs to turn a stored value ("kg") into
 * its display name ("Kilograms (kg)").
 */
let cachedUnits = null;
let inFlight = null;
const subscribers = new Set();

function loadUnitsOfMeasure() {
  // Only a non-empty catalog is treated as cached: an empty result usually means the
  // request failed upstream, and caching it would blank every label for the session.
  if (cachedUnits && cachedUnits.length > 0) return Promise.resolve(cachedUnits);
  if (inFlight) return inFlight;

  inFlight = apiService
    .getAllDropdowns()
    .then((res) => {
      const units = (res?.success && res.data?.units_of_measure) || [];
      cachedUnits = units.length > 0 ? units : null;
      return units;
    })
    .catch(() => {
      // A failed catalog fetch must not break the page — callers fall back to the raw
      // stored value, which is still meaningful (e.g. "kg").
      cachedUnits = null;
      return [];
    })
    .then((units) => {
      // Always notify, success or failure, so components mounted mid-flight settle.
      subscribers.forEach((notify) => notify(units));
      return units;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Invalidate the cache after a new unit is created so dropdowns/labels pick it up. */
export function invalidateUnitsOfMeasure() {
  cachedUnits = null;
}

/**
 * Returns the UOM catalog plus formatters bound to it.
 * `formatItem` is the common case for line-item tables.
 */
export default function useUnitsOfMeasure() {
  const [unitsOfMeasure, setUnitsOfMeasure] = useState(cachedUnits || []);

  useEffect(() => {
    let active = true;
    const notify = (units) => {
      if (active) setUnitsOfMeasure(units);
    };
    subscribers.add(notify);

    loadUnitsOfMeasure().then((units) => {
      if (active) setUnitsOfMeasure(units || []);
    });

    return () => {
      active = false;
      subscribers.delete(notify);
    };
  }, []);

  return {
    unitsOfMeasure,
    /** Resolve a raw stored value, e.g. "kg" -> "Kilograms (kg)". */
    format: (value, fallback) => formatUom(value, unitsOfMeasure, fallback),
    /** Resolve a line item's unit, falling back to its product/service default. */
    formatItem: (item, fallback) => formatItemUom(item, unitsOfMeasure, fallback),
    /** Render quantity + unit together, e.g. "12.5 Kilograms (kg)". */
    formatQuantity: (quantity, value, fallback) =>
      formatQuantityWithUom(quantity, value, unitsOfMeasure, fallback),
  };
}
