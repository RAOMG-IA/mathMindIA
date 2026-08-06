// Puerto minimo que desacopla QwenClient de LangChain concreto -- permite TDD sin red real
// (fake en tests) y mantiene la implementacion real (LangChainQwenModel) como un adaptador
// fino e intercambiable si el modelo/proveedor cambia (ver ADR-001, "Cambiar cualquier pieza
// del stack... requiere un nuevo ADR").
export interface ChatModel {
  invoke(prompt: string): Promise<string>
}
