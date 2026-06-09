const CHUNK_RELOAD_KEY = 'chunk_reload_attempted';

export function isChunkLoadError(error) {
  const message = String(error?.message || error || '');
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    error?.name === 'ChunkLoadError'
  );
}

/** Reload once after a deploy so the browser picks up new hashed asset files. */
export function reloadOnceForStaleChunks() {
  const alreadyRetried = sessionStorage.getItem(CHUNK_RELOAD_KEY);
  if (alreadyRetried) return false;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  window.location.reload();
  return true;
}

export function clearChunkReloadFlag() {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
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
