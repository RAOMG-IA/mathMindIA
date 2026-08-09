import { StyleSheet } from 'react-native'
import { COLORS } from '../components'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  formWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: COLORS.ice,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#ffffff',
    opacity: 0.5,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
  },
  // Caja centrada que contiene el formulario -- separa visualmente los campos del fondo
  // animado (grid + particulas), en vez de flotar sueltos sobre el.
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.15)',
    borderRadius: 20,
    padding: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: '#ffffff',
    opacity: 0.7,
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  inputError: {
    borderColor: COLORS.coral,
  },
  errorText: {
    color: COLORS.coral,
    fontSize: 12,
    marginTop: 6,
  },
  serverErrorBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  serverErrorText: {
    color: COLORS.coral,
    fontSize: 13,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: COLORS.ice,
    borderRadius: 40,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '700',
  },
  // Atenuado deliberadamente (opacity baja, sin subrayado) -- no es un enlace real todavia
  // (sin User Story, ver comentario en LoginScreen.tsx), no debe leerse como interactivo.
  forgotPasswordText: {
    color: COLORS.ice,
    opacity: 0.5,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
  // `top` real se fija en el componente (insets.top + margen) -- aqui solo el resto de la
  // posicion, para no atar useSafeAreaInsets a este fichero de estilos puro.
  registerButton: {
    position: 'absolute',
    right: 20,
    zIndex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  registerButtonText: {
    color: COLORS.ice,
    fontSize: 13,
    fontWeight: '600',
  },
})
