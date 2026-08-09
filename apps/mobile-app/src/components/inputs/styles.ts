import { StyleSheet } from 'react-native'
import { COLORS } from '../NeuralLoader'

// Estilos compartidos por EmailInput/PasswordInput -- antes duplicados entre
// LoginScreen.styles.ts y RegisterScreen.styles.ts (field/label/input/errorText identicos en
// las dos pantallas); centralizados aqui ahora que ambos inputs son componentes reales.
export const styles = StyleSheet.create({
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
  // PasswordInput: el input y el "ojo" comparten fila -- el input deja hueco a la derecha
  // (paddingRight) para que el texto no quede debajo del boton.
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 4,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
})
