import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const PREFIX = "enc:";

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

function getSecret(): string {
  return (
    process.env.ORIGEM_ENCRYPT_SECRET?.trim() ??
    process.env.AUTH_SECRET?.trim() ??
    ""
  );
}

export function hasEncryptionSecret(): boolean {
  return getSecret().length > 0;
}

export function assertEncryptionReady(reason = "persist encrypted secrets"): void {
  if (!hasEncryptionSecret()) {
    throw new Error(`ORIGEM_ENCRYPT_SECRET is required to ${reason}.`);
  }
}

export function encrypt(plaintext: string): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error("ORIGEM_ENCRYPT_SECRET is required to encrypt stored secrets.");
  }

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
    return ciphertext;
  }

  const secret = getSecret();
  if (!secret) {
    throw new Error("ORIGEM_ENCRYPT_SECRET is required to decrypt stored secrets.");
  }

  const parts = ciphertext.slice(PREFIX.length).split(":");
  if (parts.length !== 3) {
    throw new Error("Stored secret has an invalid encryption format.");
  }

  const [ivB64, encB64, tagB64] = parts;
  const key = deriveKey(secret);
  const iv = Buffer.from(ivB64, "base64");
  const encrypted = Buffer.from(encB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf-8");
  } catch {
    throw new Error("Failed to decrypt stored secret.");
  }
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}
