// Puerto minimo que desacopla IAClient de LangChain concreto -- permite TDD sin red real
// (fake en tests) y mantiene la implementacion real (LangChainChatModel) como un adaptador
// fino e intercambiable si el modelo/proveedor cambia (ver ADR-001, "Cambiar cualquier pieza
// del stack... requiere un nuevo ADR").
export interface ChatModel {
  invoke(prompt: string): Promise<string>
}
