import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

/**
 * AES-256-GCM for secrets that must be readable again — currently the
 * per-faculty SMTP credentials entered in Mail Center.
 *
 * GCM is authenticated: tampering with a stored ciphertext makes decryption
 * fail loudly rather than returning garbage. Passwords are *not* stored this
 * way; those are bcrypt hashes and are never recoverable by design.
 */

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit nonce, the GCM standard
const VERSION = "v1";

function key(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ENCRYPTION_KEY is missing or shorter than 32 characters. See .env.example.",
    );
  }
  // Hash to exactly 32 bytes so any sufficiently long passphrase works.
  return createHash("sha256").update(secret).digest();
}

/** Returns `v1:<iv>:<authTag>:<ciphertext>`, all base64url. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

/** Returns null for anything malformed, tampered with, or from another key. */
export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload) return null;
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) return null;

  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      key(),
      Buffer.from(parts[1], "base64url"),
    );
    decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(parts[3], "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

/** Show only the shape of a stored credential, never the credential. */
export function maskSecret(value: string | null | undefined) {
  if (!value) return null;
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.min(12, value.length - 2))}${value.slice(-2)}`;
}
