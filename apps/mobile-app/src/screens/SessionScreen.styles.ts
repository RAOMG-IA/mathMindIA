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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  timer: {
    color: COLORS.ice,
    fontSize: 20,
    fontWeight: '700',
  },
  timerExpired: {
    color: COLORS.coral,
  },
  topRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.3)',
    backgroundColor: 'rgba(76, 201, 240, 0.1)',
  },
  nextButtonText: {
    color: COLORS.ice,
    fontSize: 13,
    fontWeight: '600',
  },
  finishButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  finishButtonText: {
    color: COLORS.coral,
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.15)',
    borderRadius: 20,
    padding: 24,
  },
  statementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  statement: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  hintIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.35)',
    backgroundColor: 'rgba(255, 214, 10, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintIconButtonDisabled: {
    opacity: 0.35,
  },
  hintIconText: {
    color: COLORS.amber,
    fontSize: 16,
    fontWeight: '700',
  },
  tipBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.2)',
    backgroundColor: 'rgba(76, 201, 240, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  tipText: {
    color: COLORS.ice,
    fontSize: 13,
    fontStyle: 'italic',
  },
  optionsColumn: {
    gap: 10,
    marginBottom: 20,
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
    marginBottom: 12,
  },
  tecladoWrapper: {
    marginBottom: 12,
  },
  // Botones a ancho completo (fuera de una fila) -- sin flex:1, que en columna estiraria
  // verticalmente en vez de ocupar el ancho.
  submitButton: {
    width: '100%',
    backgroundColor: COLORS.ice,
    borderRadius: 40,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '700',
  },
  hintsList: {
    marginBottom: 12,
    gap: 8,
  },
  hintRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.25)',
    backgroundColor: 'rgba(255, 214, 10, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hintOrder: {
    color: COLORS.amber,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  hintText: {
    color: '#ffffff',
    fontSize: 13,
  },
  resultBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  resultBannerCorrect: {
    borderColor: 'rgba(76, 201, 240, 0.3)',
    backgroundColor: 'rgba(76, 201, 240, 0.08)',
  },
  resultBannerIncorrect: {
    borderColor: 'rgba(255, 107, 107, 0.3)',
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  resultTitleCorrect: {
    color: COLORS.ice,
  },
  resultTitleIncorrect: {
    color: COLORS.coral,
  },
  resultExplanation: {
    color: '#ffffff',
    opacity: 0.85,
    fontSize: 14,
  },
  poolExhaustedText: {
    color: '#ffffff',
    opacity: 0.6,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
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
})
