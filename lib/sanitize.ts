/**
 * Sanitization layer for all agent-facing and user-facing API inputs.
 *
 * The two rules:
 *   1. Every text input is coerced to a flat string — never an object, array,
 *      or anything that could be evaluated as code or a system instruction.
 *   2. Null bytes and non-printable control characters are stripped so content
 *      can never manipulate terminal output or downstream string parsers.
 */

// Characters that could confuse terminals, logs, or naive string parsers.
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g

/**
 * Coerce `input` to a safe, flat string.
 *
 * - Handles null / undefined / numbers / objects by calling String()
 * - Strips null bytes and non-printable control chars (preserves \t \n \r)
 * - Truncates to `maxLength` (default 1 000 chars) before further processing
 *   so the check above always runs on bounded input
 */
export function sanitizeText(input: unknown, maxLength = 1000): string {
  return String(input ?? '')
    .trim()
    .slice(0, maxLength)
    .replace(CONTROL_CHARS, '')
}

/**
 * Coerce `input` to a safe identifier string (alphanumerics, hyphens,
 * underscores only). Used for IDs that flow into Redis keys.
 */
export function sanitizeId(input: unknown): string {
  return String(input ?? '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 64)
}

/**
 * Validate that `input` is exactly "yes" or "no" after coercion.
 * Returns the validated value or null.
 */
export function sanitizeVote(input: unknown): 'yes' | 'no' | null {
  const v = String(input ?? '').toLowerCase().trim()
  return v === 'yes' || v === 'no' ? v : null
}
