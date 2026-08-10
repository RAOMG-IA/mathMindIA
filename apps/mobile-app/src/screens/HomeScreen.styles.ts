import { StyleSheet } from 'react-native'
import { COLORS } from '../components'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  title: {
    color: COLORS.ice,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#ffffff',
    opacity: 0.5,
    fontSize: 14,
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.15)',
    borderRadius: 20,
    padding: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    color: '#ffffff',
    opacity: 0.7,
    fontSize: 13,
    marginBottom: 8,
  },
  errorText: {
    color: COLORS.coral,
    fontSize: 12,
    marginTop: 6,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
  },
  modeButtonSelected: {
    borderColor: COLORS.ice,
    backgroundColor: 'rgba(76, 201, 240, 0.12)',
  },
  modeButtonText: {
    color: '#ffffff',
    opacity: 0.7,
    fontSize: 14,
    fontWeight: '600',
  },
  modeButtonTextSelected: {
    color: COLORS.ice,
    opacity: 1,
  },
  // topicList/topicRow/etc ahora viven en src/components/Combobox/Combobox.styles.ts -- el
  // selector de Tema usa el Combobox generico en vez de una lista inline.
  emptyTopicsText: {
    color: '#ffffff',
    opacity: 0.5,
    fontSize: 13,
    fontStyle: 'italic',
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
})
