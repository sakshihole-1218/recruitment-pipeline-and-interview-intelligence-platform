export class PasswordHashingHelper {
  private static readonly SALT_ROUNDS = 10;

  static async hashPassword(plainPassword: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(plainPassword, this.SALT_ROUNDS);
  }

  static async verifyPassword(
    plainPassword: string,
    passwordHash: string,
  ): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(plainPassword, passwordHash);
  }
}
