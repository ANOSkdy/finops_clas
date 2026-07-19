import { compare, hash } from "bcryptjs";

export const PASSWORD_MIN_LENGTH = 8;

export function hashPassword(password: string) {
  return hash(password, 10);
}

export function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}
