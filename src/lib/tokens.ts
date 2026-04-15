import { randomBytes } from 'crypto';

export function generateToken(bytes = 24): string {
  return randomBytes(bytes).toString('base64url');
}
