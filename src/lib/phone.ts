/**
 * Indian mobile number normalisation, pure so it unit-tests without a
 * database or a Twilio client.
 */

/**
 * Normalise to E.164 with the `whatsapp:` prefix Twilio expects.
 * Accepts "9876543210", "+91 98765 43210", "091-9876543210".
 * Returns null for anything that is not a valid Indian mobile number.
 */
export function toWhatsAppAddress(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;

  let national = digits.replace(/^0+/, "");
  if (national.length === 12 && national.startsWith("91")) {
    national = national.slice(2);
  }
  // Indian mobile numbers are ten digits starting 6-9.
  if (!/^[6-9]\d{9}$/.test(national)) return null;
  return `whatsapp:+91${national}`;
}
