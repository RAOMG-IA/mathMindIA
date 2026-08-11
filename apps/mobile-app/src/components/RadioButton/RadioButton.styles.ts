import { StyleSheet } from 'react-native'
import { COLORS } from '../NeuralLoader'

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: 12,
  },
  rowSelected: {
    borderColor: COLORS.ice,
    backgroundColor: 'rgba(76, 201, 240, 0.1)',
  },
  rowDisabled: {
    opacity: 0.6,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(76, 201, 240, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  circleSelected: {
    borderColor: COLORS.ice,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.ice,
  },
  label: {
    color: '#ffffff',
    fontSize: 15,
    flexShrink: 1,
  },
})
