/**
 * Turn API error payloads into plain-language messages for end users.
 */
export function formatApiErrorMessage(data, fallback = 'Something went wrong. Please try again.') {
  if (!data) return fallback;

  const humanize = (msg) => {
    if (!msg) return null;
    const m = String(msg);
    if (m.includes('Validation isEmail') || m.includes('isEmail on email')) {
      return 'Please enter a valid email address.';
    }
    if (m === 'Validation failed' || m === 'API request failed') return null;
    return m;
  };

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const parts = data.errors
      .map((e) => (typeof e === 'object' ? humanize(e.message) || humanize(e.msg) : humanize(e)))
      .filter(Boolean);
    if (parts.length > 0) return [...new Set(parts)].join(' ');
  }

  if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    const parts = Object.values(data.errors)
      .flat()
      .map((e) => humanize(typeof e === 'object' ? e.message || e.msg : e))
      .filter(Boolean);
    if (parts.length > 0) return [...new Set(parts)].join(' ');
  }

  return humanize(data.message) || fallback;
}

export default formatApiErrorMessage;
