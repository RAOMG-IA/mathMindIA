// Tipos nominales ("branded") sobre string para que, p.ej., un UserId no se pueda
// pasar por error donde se espera un SessionId -- ambos son "string" en tiempo de
// ejecucion, pero TypeScript los distingue en tiempo de compilacion.
type Brand<T, B> = T & { readonly __brand: B }

export type UserId = Brand<string, 'UserId'>
export type ExerciseId = Brand<string, 'ExerciseId'>
export type SessionId = Brand<string, 'SessionId'>
export type AnswerId = Brand<string, 'AnswerId'>
export type HintId = Brand<string, 'HintId'>
