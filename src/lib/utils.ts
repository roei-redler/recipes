import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** SHA-256 hash a plain-text password using the browser's SubtleCrypto API. */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Verify a plain-text input against a stored SHA-256 hex hash. */
export async function verifyPassword(input: string, storedHash: string): Promise<boolean> {
  return (await hashPassword(input)) === storedHash;
}
