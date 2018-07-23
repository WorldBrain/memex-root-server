export function stripStringPrefix(s, prefix) {
  return s.startsWith(prefix) ? s.substr(prefix.length) : s
}