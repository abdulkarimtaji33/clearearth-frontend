import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Spinner from './views/spinner/Spinner';
import './utils/i18n';
import { CustomizerContextProvider } from './context/CustomizerContext';
import { AuthProvider } from './context/AuthContext';
import { installGlobalChunkReloadHandlers } from './utils/chunkReload';
import { SocketProvider } from './context/SocketContext';

installGlobalChunkReloadHandlers();

async function deferRender() {
  const { worker } = await import("./api/mocks/browser");
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

deferRender().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <CustomizerContextProvider>
      <AuthProvider>
        <SocketProvider>
          <Suspense fallback={<Spinner />}>
            <App />
          </Suspense>
        </SocketProvider>
      </AuthProvider>
    </CustomizerContextProvider>,
  )
})
