import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
export const PLACEHOLDER_MAPS_KEY = 'your_google_maps_api_key_here';

export const isGoogleMapsConfigured = Boolean(
  GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== PLACEHOLDER_MAPS_KEY,
);

export const MAPS_NOT_CONFIGURED_MSG =
  'Google Maps API key is not configured on the server. Set VITE_GOOGLE_MAPS_API_KEY in .env.production, enable Maps JavaScript + Places + Geocoding APIs, then rebuild the frontend.';

let optionsApplied = false;

/** Must run before any importLibrary call. Uses `key` + `v` per @googlemaps/js-api-loader API. */
export function ensureGoogleMapsOptions() {
  if (!isGoogleMapsConfigured) return false;
  if (!optionsApplied) {
    setOptions({ key: GOOGLE_MAPS_API_KEY, v: 'weekly' });
    optionsApplied = true;
  }
  return true;
}

export async function loadGoogleMapsLibrary(libraryName) {
  if (!ensureGoogleMapsOptions()) {
    throw new Error(MAPS_NOT_CONFIGURED_MSG);
  }
  return importLibrary(libraryName);
}

export async function loadGoogleMapsLibraries(libraryNames) {
  return Promise.all(libraryNames.map((name) => loadGoogleMapsLibrary(name)));
}
