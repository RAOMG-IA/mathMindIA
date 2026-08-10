import { StyleSheet } from 'react-native'
import { COLORS } from '../NeuralLoader'

export const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  triggerError: {
    borderColor: COLORS.coral,
  },
  triggerText: {
    color: '#ffffff',
    fontSize: 15,
    flexShrink: 1,
  },
  triggerPlaceholder: {
    opacity: 0.5,
  },
  chevron: {
    color: COLORS.ice,
    fontSize: 14,
    marginLeft: 8,
  },
  errorText: {
    color: COLORS.coral,
    fontSize: 12,
    marginTop: 6,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panelWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '70%',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.25)',
    borderRadius: 16,
    padding: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  rowSelected: {
    backgroundColor: 'rgba(76, 201, 240, 0.1)',
  },
  rowLabel: {
    color: '#ffffff',
    fontSize: 14,
  },
  rowLabelSelected: {
    color: COLORS.ice,
    fontWeight: '600',
  },
  doneButton: {
    marginTop: 12,
    backgroundColor: COLORS.ice,
    borderRadius: 40,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },
})
