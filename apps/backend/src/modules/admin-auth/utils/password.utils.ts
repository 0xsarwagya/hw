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
  // Validate hash exists and is not empty
  if (!hash || hash.trim().length === 0) {
    throw new Error("Password hash is empty or invalid");
  }

  // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  const isBcrypt = isBcryptHash(hash);

  if (isBcrypt) {
    return await bcrypt.compare(password, hash);
  }

  // Check if it's an Argon2 hash (starts with $argon2id$)
  const isArgon2 = hash.startsWith("$argon2id$") || hash.startsWith("$argon2i$") || hash.startsWith("$argon2$");

  if (isArgon2) {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      // If argon2 verification fails, throw a more descriptive error
      throw new Error(`Argon2 verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // If hash doesn't match any known format, throw error
  throw new Error(`Invalid password hash format. Hash must start with $2a$, $2b$, $2y$ (bcrypt) or $argon2 (argon2)`);
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
