import { StyleSheet } from 'react-native'
import { COLORS } from '../NeuralLoader'

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
  errorText: {
    color: COLORS.coral,
    fontSize: 12,
    marginTop: 6,
  },
  // 4 estrellas acumulativas -- sin Picker nativo (dependencia nueva no instalada, estilo
  // inconsistente entre plataformas) ni icon library (glifo Unicode, mismo criterio que los
  // simbolos matematicos de NeuralLoader).
  starRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    gap: 4,
  },
  star: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starTextFilled: {
    fontSize: 32,
    color: COLORS.ice,
  },
  starTextEmpty: {
    fontSize: 32,
    color: 'rgba(255, 255, 255, 0.2)',
  },
  levelSelectedLabel: {
    color: COLORS.ice,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
})
