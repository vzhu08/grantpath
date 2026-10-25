# Narrow runtime helpers

`src/index.ts`: validated local text transformation, consistent errors, name-only environment validation, bounded user-scoped LRU cache, and JSON HTTP requests. Requests have a whole-operation deadline and bounded response bytes. Only GET/HEAD/OPTIONS may retry; no implicit retries for sends or mutations. Cache instances live in one process and need explicit per-user scope; invalidation removes only that scope. No persistence or cross-instance guarantee.
