/**
 * Centralized Route Definitions & Cybersecurity Path Hardening
 * Obfuscated admin login path to mitigate automated bot attacks, dictionary scans, and credential stuffing.
 */

export const SECURE_ADMIN_LOGIN_PATH =
  process.env.NEXT_PUBLIC_ADMIN_LOGIN_PATH || '/admin/secure-login-r9k';
