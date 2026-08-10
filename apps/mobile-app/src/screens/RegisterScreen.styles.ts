import { StyleSheet } from 'react-native'
import { COLORS } from '../components'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  formWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: COLORS.ice,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#ffffff',
    opacity: 0.5,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.15)',
    borderRadius: 20,
    padding: 24,
  },
  // field/label/errorText/starRow/star/starTextFilled/starTextEmpty/levelSelectedLabel ahora
  // viven en src/components/AcademicLevelStars/AcademicLevelStars.styles.ts -- extraido al
  // convertirse HomeScreen en el segundo consumidor del selector de estrellas.
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
  loginLinkText: {
    color: COLORS.ice,
    opacity: 0.7,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
})
