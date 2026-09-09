import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import './index.css';

// Prevent unhandled promise rejections and script errors from silently breaking preview
if (typeof window !== 'undefined') {
  try {
    window.addEventListener(
      'error',
      (event) => {
        if (
          event &&
          event.message &&
          typeof event.message === 'string' &&
          event.message.includes('fetch') &&
          event.message.includes('getter')
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );

    let activeFetch = window.fetch;
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!desc || !desc.set) {
      try {
        Object.defineProperty(window, 'fetch', {
          get() {
            return activeFetch;
          },
          set(fn) {
            activeFetch = fn;
          },
          configurable: true,
          enumerable: true,
        });
      } catch (errWindow) {
        try {
          const proto = Window.prototype || Object.getPrototypeOf(window);
          if (proto) {
            let protoFetch = proto.fetch || activeFetch;
            Object.defineProperty(proto, 'fetch', {
              get() {
                return protoFetch;
              },
              set(fn) {
                protoFetch = fn;
                activeFetch = fn;
              },
              configurable: true,
              enumerable: true,
            });
          }
        } catch (errProto) {
          // Silent fallback
        }
      }
    }
  } catch (err) {
    // Ignore if not configurable
  }

  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[Global] Unhandled promise rejection captured:', event.reason);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

