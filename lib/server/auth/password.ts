import {
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";

const HASH_PREFIX = "scrypt:v1";
const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
  N: 16_384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024,
} as const;

function parseHash(value: string) {
  const [prefix, saltHex, hashHex] = value.split("$");
  if (prefix !== HASH_PREFIX || !saltHex || !hashHex) {
    throw new Error("invalid_password_hash");
  }

  return {
    salt: Buffer.from(saltHex, "hex"),
    hash: Buffer.from(hashHex, "hex"),
  };
}

async function deriveKey(password: string, salt: Buffer) {
  return await new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await deriveKey(password, salt);
  return `${HASH_PREFIX}$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  try {
    const { salt, hash } = parseHash(passwordHash);
    const derivedKey = await deriveKey(password, salt);

    if (derivedKey.length !== hash.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, hash);
  } catch {
    return false;
  }
}
