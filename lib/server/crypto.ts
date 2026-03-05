import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const PREFIX = "enc:";

function deriveKey(secret: string): Buffer {
  // SHA-256 hash of the secret to get a consistent 32-byte key
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  return createHash("sha256").update(secret).digest();
}

function getSecret(): string {
  const secret = process.env.ORIGEM_ENCRYPT_SECRET;
  if (!secret) {
    // In dev without env var, return empty — keys stored in plaintext
    return "";
  }
  return secret;
}

export function encrypt(plaintext: string): string {
  const secret = getSecret();
  if (!secret) return plaintext;

  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Format: enc:<iv>:<encrypted>:<tag> (all base64)
  return `${PREFIX}${iv.toString("base64")}:${encrypted.toString("base64")}:${tag.toString("base64")}`;
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext.startsWith(PREFIX)) {
    return ciphertext; // plaintext — not encrypted
  }

  const secret = getSecret();
  if (!secret) return ciphertext; // no secret available

  const parts = ciphertext.slice(PREFIX.length).split(":");
  if (parts.length !== 3) return ciphertext;

  const [ivB64, encB64, tagB64] = parts;
  const key = deriveKey(secret);
  const iv = Buffer.from(ivB64, "base64");
  const encrypted = Buffer.from(encB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf-8");
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}
