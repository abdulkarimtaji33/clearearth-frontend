/**
 * Phone number validation shared by every form in the app.
 *
 * Only digits and a single leading "+" (country code) are accepted — no spaces,
 * dashes, brackets or letters. Digit count must be 9–16.
 *
 * Mirrors clearearth-backend/src/utils/phone.js — keep both in sync.
 */

export const PHONE_MIN_DIGITS = 9;
export const PHONE_MAX_DIGITS = 16;

/** Characters we accept in raw input: digits and a leading +. */
const ALLOWED_CHARS = /^[+\d]+$/;

/** Strip formatting down to digits so length rules apply to the number itself. */
export function phoneDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/**
 * Validate a phone number.
 * Returns null when valid, otherwise a message that names the problem and the fix.
 */
export function validatePhone(value, { required = false, label = 'Phone number' } = {}) {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return required ? `${label} is required.` : null;
  }

  if (!ALLOWED_CHARS.test(raw)) {
    return `${label} can only contain numbers and a leading + — remove any spaces, letters or other symbols.`;
  }

  // A "+" is only meaningful as a country-code prefix at the very start.
  if (raw.includes('+') && !raw.startsWith('+')) {
    return `${label} can only use + at the start, for the country code (e.g. +971501234567).`;
  }

  const digits = phoneDigits(raw);

  if (digits.length < PHONE_MIN_DIGITS) {
    return `${label} is too short — enter at least ${PHONE_MIN_DIGITS} digits (e.g. +971501234567).`;
  }

  if (digits.length > PHONE_MAX_DIGITS) {
    return `${label} is too long — enter no more than ${PHONE_MAX_DIGITS} digits (e.g. +971501234567).`;
  }

  return null;
}

/** Convenience boolean form. */
export function isValidPhone(value, options) {
  return validatePhone(value, options) === null;
}

/**
 * Strip a raw input value down to what's allowed as the user types: an optional
 * leading + followed by digits, capped at the max digit count. Wire this into a
 * field's onChange so invalid characters can never be typed in the first place.
 */
export function sanitizePhoneInput(value) {
  const str = String(value ?? '');
  const hasLeadingPlus = str.trimStart().startsWith('+');
  const digits = str.replace(/\D/g, '').slice(0, PHONE_MAX_DIGITS);
  return (hasLeadingPlus ? '+' : '') + digits;
}

/**
 * Yup test factory so Formik schemas stay one-liners:
 *   phone: phoneSchema(Yup, { required: true })
 */
export function phoneYup(Yup, { required = false, label = 'Phone number' } = {}) {
  let schema = Yup.string().trim().nullable();
  if (required) schema = schema.required(`${label} is required.`);
  // `.required()` already covers the empty case, so the format test always runs in
  // optional mode — otherwise an empty required field reports the same error twice.
  return schema.test('valid-phone', function testPhone(value) {
    const message = validatePhone(value, { required: false, label });
    return message ? this.createError({ message }) : true;
  });
}

/** Placeholder/help text so every phone field teaches the same format. */
export const PHONE_PLACEHOLDER = '+971501234567';
export const PHONE_HELP_TEXT = 'Numbers only, with an optional leading + for the country code, e.g. +971501234567';

export default validatePhone;
