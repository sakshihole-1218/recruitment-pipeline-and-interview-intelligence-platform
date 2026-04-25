import * as bcrypt from 'bcrypt';

export class AuthPasswordHashingHelper {
  private static readonly SALT_ROUNDS = 10;

  static async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.SALT_ROUNDS);
  }

  static async verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
