import { StyleSheet } from 'react-native'
import { COLORS } from '../NeuralLoader'

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 8, 20, 0.75)',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.25)',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    color: COLORS.ice,
    opacity: 0.8,
    fontSize: 14,
    marginBottom: 20,
  },
  button: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.ice,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },
})
