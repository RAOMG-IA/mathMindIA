import { describe, expect, it } from 'vitest'
import { isAllSelected, toggleSelectAll, toggleSelection } from './Combobox.logic'

interface Item {
  readonly code: string
}

const items: readonly Item[] = [{ code: 'a' }, { code: 'b' }, { code: 'c' }]
const getKey = (item: Item) => item.code

describe('toggleSelection', () => {
  it('añade la key si todavia no estaba seleccionada', () => {
    expect(toggleSelection(['a'], 'b')).toEqual(['a', 'b'])
  })

  it('quita la key si ya estaba seleccionada', () => {
    expect(toggleSelection(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('no muta el array original', () => {
    const original = ['a']
    toggleSelection(original, 'b')
    expect(original).toEqual(['a'])
  })
})

describe('isAllSelected', () => {
  it('true si todos los items estan seleccionados', () => {
    expect(isAllSelected(['a', 'b', 'c'], items, getKey)).toBe(true)
  })

  it('false si falta alguno', () => {
    expect(isAllSelected(['a', 'b'], items, getKey)).toBe(false)
  })

  it('false si la lista de items esta vacia (nada que seleccionar)', () => {
    expect(isAllSelected([], [], getKey)).toBe(false)
  })
})

describe('toggleSelectAll', () => {
  it('selecciona todos si no estaban todos seleccionados', () => {
    expect(toggleSelectAll(['a'], items, getKey)).toEqual(['a', 'b', 'c'])
  })

  it('deselecciona todos si ya estaban todos seleccionados', () => {
    expect(toggleSelectAll(['a', 'b', 'c'], items, getKey)).toEqual([])
  })
})
