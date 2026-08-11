// Modo Test (US-004, "Nota de calculo mental"): contenido generico y constante, no ligado al
// enunciado del ejercicio ni generado por IA -- a diferencia de las pistas de Modo Resolucion
// (US-005), que son progresivas y especificas del ejercicio.
export const MENTAL_MATH_TIPS: readonly string[] = [
  'Redondea al múltiplo de 10 más cercano y ajusta la diferencia al final.',
  'Descompón los números en decenas y unidades para sumar por partes.',
  'Duplicar y luego ajustar es más rápido que multiplicar directamente por números impares.',
  'Para restar, suma al número menor hasta llegar al mayor y cuenta cuánto has sumado.',
  'Divide entre 2 varias veces en vez de dividir directamente entre un número grande.',
]

// Determinista por Exercise.id -- el mismo ejercicio siempre muestra la misma nota (no cambia
// en cada re-render). Suma de codigos de caracter como hash barato, sin dependencia nueva.
export function pickMentalMathTip(exerciseId: string): string {
  let hash = 0
  for (let i = 0; i < exerciseId.length; i++) {
    hash = (hash + exerciseId.charCodeAt(i)) % MENTAL_MATH_TIPS.length
  }
  return MENTAL_MATH_TIPS[hash]
}
