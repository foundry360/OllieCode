import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key(): Buffer {
  const secret = process.env.PENDING_SIGNUP_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("PENDING_SIGNUP_SECRET must be set (at least 16 characters).");
  }
  return createHash("sha256").update(secret).digest();
}

/** AES-256-GCM; output is base64url(iv || tag || ciphertext). */
export function encryptPendingPassword(plain: string): string {
  const k = key();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptPendingPassword(payload: string): string {
  const k = key();
  const buf = Buffer.from(payload, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", k, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
