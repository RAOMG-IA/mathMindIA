import { StyleSheet } from 'react-native'
import { COLORS } from '../NeuralLoader'

export const styles = StyleSheet.create({
  key: {
    minHeight: 44,
    marginHorizontal: 3,
    marginVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyOperator: {
    borderColor: 'rgba(76, 201, 240, 0.4)',
    backgroundColor: 'rgba(76, 201, 240, 0.1)',
  },
  keyAction: {
    borderColor: 'rgba(255, 107, 107, 0.35)',
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  keyDisabled: {
    opacity: 0.4,
  },
  keyText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  keyTextOperator: {
    color: COLORS.ice,
  },
  keyTextAction: {
    color: COLORS.coral,
  },
})
