import { StyleSheet } from 'react-native'
import { COLORS } from '../NeuralLoader'

export const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  modeSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: COLORS.ice,
    backgroundColor: 'rgba(76, 201, 240, 0.12)',
  },
  modeButtonText: {
    color: '#ffffff',
    opacity: 0.7,
    fontSize: 13,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: COLORS.ice,
    opacity: 1,
  },
  row: {
    flexDirection: 'row',
  },
})
