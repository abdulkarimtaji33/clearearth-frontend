/**
 * Phone number validation shared by every form in the app.
 *
 * Kept deliberately permissive about formatting (users paste numbers with spaces,
 * dashes, brackets and a leading +) but strict about the thing that actually matters:
 * the count of digits. UAE numbers are 9 digits after the country code, so the 7–15
 * range covers local and international numbers alike — 15 is the E.164 maximum.
 *
 * Mirrors clearearth-backend/src/utils/phone.js — keep both in sync.
 */

export const PHONE_MIN_DIGITS = 7;
export const PHONE_MAX_DIGITS = 15;

/** Characters we accept in raw input: digits, spaces, +, -, (), and dots. */
const ALLOWED_CHARS = /^[+()\d\s.-]+$/;

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
    return `${label} can only contain digits, spaces and + ( ) -  — remove any letters or other symbols.`;
  }

  // A "+" is only meaningful as a country-code prefix at the very start.
  if (raw.includes('+') && !raw.startsWith('+')) {
    return `${label} can only use + at the start, for the country code (e.g. +971 50 123 4567).`;
  }

  const digits = phoneDigits(raw);

  if (digits.length < PHONE_MIN_DIGITS) {
    return `${label} is too short — enter at least ${PHONE_MIN_DIGITS} digits (e.g. +971 50 123 4567).`;
  }

  if (digits.length > PHONE_MAX_DIGITS) {
    return `${label} is too long — enter no more than ${PHONE_MAX_DIGITS} digits (e.g. +971 50 123 4567).`;
  }

  return null;
}

/** Convenience boolean form. */
export function isValidPhone(value, options) {
  return validatePhone(value, options) === null;
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
export const PHONE_PLACEHOLDER = '+971 50 123 4567';
export const PHONE_HELP_TEXT = 'Include the country code, e.g. +971 50 123 4567';

export default validatePhone;
