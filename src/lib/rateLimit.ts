// Rate limiter in-memory sederhana. Cukup untuk single-instance deployment;
// kalau nanti scale ke banyak instance, ganti dengan store bersama (mis. Redis).
const attempts = new Map<string, { count: number; resetAt: number }>()

/** Trims map secara oportunistik supaya tidak bocor memori dari key yang sudah kedaluwarsa. */
function cleanup(now: number) {
  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) attempts.delete(key)
  }
}

/**
 * Cek & catat satu percobaan untuk `key`. Return true kalau masih diizinkan (dan menaikkan counter),
 * false kalau sudah melebihi limit dalam window saat ini.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  if (attempts.size > 5000) cleanup(now)

  const entry = attempts.get(key)
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false
  entry.count += 1
  return true
}
