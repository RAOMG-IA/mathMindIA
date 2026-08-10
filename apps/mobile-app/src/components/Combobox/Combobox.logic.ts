// Logica pura de seleccion multiple, extraida del componente para poder testearla sin
// renderizar React (mismo criterio que sessionRouting.ts/HomeScreen.validation.ts: el monorepo
// no tiene React Testing Library).
export function toggleSelection(values: readonly string[], key: string): readonly string[] {
  return values.includes(key) ? values.filter((value) => value !== key) : [...values, key]
}

export function isAllSelected<T>(
  values: readonly string[],
  items: readonly T[],
  getKey: (item: T) => string,
): boolean {
  return items.length > 0 && items.every((item) => values.includes(getKey(item)))
}

export function toggleSelectAll<T>(
  values: readonly string[],
  items: readonly T[],
  getKey: (item: T) => string,
): readonly string[] {
  return isAllSelected(values, items, getKey) ? [] : items.map(getKey)
}
