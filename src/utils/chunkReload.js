const CHUNK_RELOAD_COUNT = 'chunk_reload_count';
const CHUNK_RELOAD_AT = 'chunk_reload_at';
const MAX_AUTO_RELOADS = 2;
const RELOAD_QUIET_MS = 60000;

export function isChunkLoadError(error) {
  const message = String(error?.message || error || '');
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Loading chunk') ||
    message.includes('Loading CSS chunk') ||
    error?.name === 'ChunkLoadError'
  );
}

export function isChunkReloadExhausted() {
  const count = parseInt(sessionStorage.getItem(CHUNK_RELOAD_COUNT) || '0', 10);
  return count >= MAX_AUTO_RELOADS;
}

/** Reload up to MAX_AUTO_RELOADS times after a deploy so the browser picks up new hashed assets. */
export function reloadOnceForStaleChunks() {
  const count = parseInt(sessionStorage.getItem(CHUNK_RELOAD_COUNT) || '0', 10);
  if (count >= MAX_AUTO_RELOADS) return false;
  sessionStorage.setItem(CHUNK_RELOAD_COUNT, String(count + 1));
  sessionStorage.setItem(CHUNK_RELOAD_AT, String(Date.now()));
  window.location.reload();
  return true;
}

/**
 * Reset the reload counter only after a quiet period. Every successful lazy import used to clear it, and the
 * layout always loads fine, so a screen file that kept failing made the whole app reload forever.
 */
export function clearChunkReloadFlag() {
  const last = parseInt(sessionStorage.getItem(CHUNK_RELOAD_AT) || '0', 10);
  if (last && Date.now() - last < RELOAD_QUIET_MS) return;
  sessionStorage.removeItem(CHUNK_RELOAD_COUNT);
  sessionStorage.removeItem(CHUNK_RELOAD_AT);
}

export function handleChunkLoadError(error) {
  if (!isChunkLoadError(error)) return false;
  return reloadOnceForStaleChunks();
}

export function installGlobalChunkReloadHandlers() {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    reloadOnceForStaleChunks();
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (handleChunkLoadError(event.reason)) {
      event.preventDefault();
    }
  });
}
