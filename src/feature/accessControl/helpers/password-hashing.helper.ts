import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export class PasswordHashingHelper {
  private static readonly KEY_LENGTH = 64;

  static hashPassword(plainPassword: string): string {
    const salt = randomBytes(16);
    const derivedKey = scryptSync(plainPassword, salt, this.KEY_LENGTH);

    return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
  }

  static verifyPassword(plainPassword: string, passwordHash: string): boolean {
    const [scheme, saltHex, hashHex] = passwordHash.split('$');

    if (scheme !== 'scrypt' || !saltHex || !hashHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = scryptSync(plainPassword, salt, expected.length);

    return timingSafeEqual(expected, actual);
  }
}
