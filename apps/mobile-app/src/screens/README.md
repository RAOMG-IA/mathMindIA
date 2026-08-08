# Screens

Componentes de pantalla (Registro, Login, Inicio de sesión de entrenamiento, Resolver ejercicio, Estadísticas...), una por [User Story](../../../../docs/user-stories/) relevante. Sin lógica de negocio ni reglas matemáticas ([ARCHITECTURE.md](../../../../ARCHITECTURE.md), responsabilidades de `mobile-app`).

Con Expo Router (ver [src/navigation/README.md](../navigation/README.md)), los archivos de `app/` son wrappers finos de enrutado que importan y renderizan estos componentes — la lógica de pantalla vive aquí, no en `app/`, para mantenerla testable y reutilizable independientemente de la ruta.

**Mapeo ruta ↔ User Story fijado en [ADR-015](../../../../docs/ADR/ADR-015_mobile_app_screens.md)**: Registro, Login, Home (iniciar sesión de entrenamiento), Ejercicio (resolver + solicitar pista + finalizar), Resumen de sesión, Estadísticas.

Pendiente de implementar.
