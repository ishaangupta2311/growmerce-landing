/**
 * Password hashing for admin accounts.
 *
 * bcrypt, via the pure-JS `bcryptjs` so nothing native has to build on the
 * deploy target. Deliberately free of `server-only` and of anything Next.js:
 * `scripts/create-admin.ts` runs this file under plain Node to seed the first
 * account, and it must hash exactly the way the login check verifies.
 */

import bcrypt from "bcryptjs";

/** ~250ms per hash on current hardware — slow for a guesser, fine for a login. */
const COST = 12;

export const PASSWORD_MIN_LENGTH = 12;

/**
 * bcrypt only reads the first 72 bytes of its input and silently ignores the
 * rest, so a longer password would *look* accepted while half of it did
 * nothing. Rejecting it is more honest than truncating it.
 */
export const PASSWORD_MAX_BYTES = 72;

/** A reason the password cannot be used, or null when it is acceptable. */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return `Use at most ${PASSWORD_MAX_BYTES} bytes (bcrypt ignores anything longer).`;
  }
  return null;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * A real hash of a password nobody has, compared against when the email is
 * unknown. Without it, "no such user" returns in a microsecond and "wrong
 * password" in 250ms, and the difference tells a guesser which emails exist.
 */
const DUMMY_HASH = "$2b$12$uh13GNaW/fLSd7MWsW.NTe/nveUTo/IYnvW0H7EFuuSrIUNhN/Nre";

export async function burnPasswordCheck(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_HASH);
}
