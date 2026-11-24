import { useEffect } from 'react';

const ERROR_ALERT = '.MuiAlert-colorError, .MuiAlert-standardError, .MuiAlert-filledError, .MuiAlert-outlinedError';
const FIELD_ERROR = '.Mui-error input, .Mui-error textarea, .Mui-error [role="combobox"], input[aria-invalid="true"], textarea[aria-invalid="true"]';

const inView = (el) => {
  const r = el.getBoundingClientRect();
  return r.top >= 70 && r.bottom <= (window.innerHeight || document.documentElement.clientHeight);
};

const reveal = (el) => {
  if (!el || !el.isConnected || inView(el)) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

/**
 * When a form shows an error (an error alert appears, or a submit leaves invalid fields), scroll the page
 * up/down to it so the user always notices. Mounted once in the main layout.
 */
const ScrollToError = () => {
  useEffect(() => {
    let timer = null;
    const findAlert = (node) => {
      if (!(node instanceof Element)) return null;
      if (node.closest('.MuiSnackbar-root')) return null; // toasts are already visible
      if (node.matches(ERROR_ALERT)) return node;
      return node.querySelector(ERROR_ALERT);
    };

    const observer = new MutationObserver((mutations) => {
      let target = null;
      for (const m of mutations) {
        for (const n of m.addedNodes) {
          const a = findAlert(n);
          if (a) target = a;
        }
      }
      if (!target) return;
      clearTimeout(timer);
      timer = setTimeout(() => reveal(target), 80);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const onSubmit = () => {
      setTimeout(() => {
        const field = document.querySelector(FIELD_ERROR);
        const alert = [...document.querySelectorAll(ERROR_ALERT)].find((a) => !a.closest('.MuiSnackbar-root'));
        reveal(field || alert);
      }, 300);
    };
    document.addEventListener('submit', onSubmit, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('submit', onSubmit, true);
      clearTimeout(timer);
    };
  }, []);
  return null;
};

export default ScrollToError;
