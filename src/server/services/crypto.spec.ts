import { beforeAll, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, maskSecret } from "./crypto";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "test-only-key-at-least-32-characters-long";
});

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a value", () => {
    const secret = "abcd efgh ijkl mnop";
    expect(decryptSecret(encryptSecret(secret))).toBe(secret);
  });

  it("produces different ciphertext each time", () => {
    // A fresh nonce per call, so identical passwords do not look identical
    // at rest.
    const a = encryptSecret("same-password");
    const b = encryptSecret("same-password");
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(decryptSecret(b));
  });

  it("rejects a tampered ciphertext instead of returning garbage", () => {
    const token = encryptSecret("app-password");
    const parts = token.split(":");
    // Flip a character in the payload; GCM's auth tag must catch it.
    parts[3] = parts[3].slice(0, -1) + (parts[3].endsWith("A") ? "B" : "A");
    expect(decryptSecret(parts.join(":"))).toBeNull();
  });

  it("rejects a tampered auth tag", () => {
    const parts = encryptSecret("app-password").split(":");
    parts[2] = Buffer.from("0".repeat(16)).toString("base64url");
    expect(decryptSecret(parts.join(":"))).toBeNull();
  });

  it("returns null for malformed or missing input", () => {
    expect(decryptSecret(null)).toBeNull();
    expect(decryptSecret(undefined)).toBeNull();
    expect(decryptSecret("")).toBeNull();
    expect(decryptSecret("not-a-token")).toBeNull();
    expect(decryptSecret("v2:a:b:c")).toBeNull();
  });

  it("handles unicode and long values", () => {
    const value = "पासवर्ड-🔐-" + "x".repeat(500);
    expect(decryptSecret(encryptSecret(value))).toBe(value);
  });
});

describe("maskSecret", () => {
  it("reveals only the last two characters", () => {
    expect(maskSecret("abcdefghijkl")).toBe("••••••••••kl");
    expect(maskSecret("ab")).toBe("••••");
    expect(maskSecret(null)).toBeNull();
  });
});
