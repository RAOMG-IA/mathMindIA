import { StyleSheet } from 'react-native'
import { COLORS } from '../NeuralLoader'

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(76, 201, 240, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  boxChecked: {
    borderColor: COLORS.ice,
    backgroundColor: COLORS.ice,
  },
  boxDisabled: {
    opacity: 0.4,
  },
  check: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    flexShrink: 1,
  },
})
