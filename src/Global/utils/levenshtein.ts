function normalize(s: string): string {
  return s.trim().toLowerCase()
}

export function levenshtein(a: string, b: string): number {
  const s = normalize(a)
  const t = normalize(b)
  if (s === t) return 0
  if (s.length === 0) return t.length
  if (t.length === 0) return s.length

  const prev = new Array<number>(t.length + 1)
  const curr = new Array<number>(t.length + 1)

  for (let j = 0; j <= t.length; j++) prev[j] = j

  for (let i = 1; i <= s.length; i++) {
    curr[0] = i
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= t.length; j++) prev[j] = curr[j]
  }

  return prev[t.length]
}

/**
 * "Near match" for duplicate-detection hints in a typeahead.
 * Returns true if `needle` is a case-insensitive substring of `haystack`,
 * OR the Levenshtein distance between them is <= 2.
 * Returns false for exact-name matches because the caller wants near, not exact.
 */
export function isNearMatch(needle: string, haystack: string): boolean {
  const n = normalize(needle)
  const h = normalize(haystack)
  if (!n || !h) return false
  if (n === h) return false
  if (h.includes(n)) return true
  return levenshtein(n, h) <= 2
}
