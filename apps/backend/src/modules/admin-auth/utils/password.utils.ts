import * as argon2 from "argon2";
import * as bcrypt from "bcrypt";

/**
 * Hash password using Argon2id (recommended for admin passwords)
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

/**
 * Verify password against hash (supports both Argon2id and bcrypt)
 */
export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (isBcryptHash(hash)) {
    return bcrypt.compare(password, hash);
  }
  // Otherwise, assume it's Argon2id
  return argon2.verify(hash, password);
}

/**
 * Check if a hash is a bcrypt hash
 */
export function isBcryptHash(hash: string): boolean {
  return (
    hash.startsWith("$2a$") ||
    hash.startsWith("$2b$") ||
    hash.startsWith("$2y$")
  );
}

/**
 * Migrate bcrypt hash to Argon2id
 */
export async function migratePasswordHash(
  password: string,
  bcryptHash: string,
): Promise<string> {
  // Verify the password against the bcrypt hash first
  const isValid = await bcrypt.compare(password, bcryptHash);
  if (!isValid) {
    throw new Error("Invalid password for migration");
  }
  // Generate new Argon2id hash
  return hashPassword(password);
}
