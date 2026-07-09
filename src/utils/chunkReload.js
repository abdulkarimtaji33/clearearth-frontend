const CHUNK_RELOAD_COUNT = 'chunk_reload_count';
const MAX_AUTO_RELOADS = 2;

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
  window.location.reload();
  return true;
}

export function clearChunkReloadFlag() {
  sessionStorage.removeItem(CHUNK_RELOAD_COUNT);
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
