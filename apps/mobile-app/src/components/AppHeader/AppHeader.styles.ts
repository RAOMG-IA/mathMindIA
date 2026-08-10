import { StyleSheet } from 'react-native'
import { COLORS } from '../NeuralLoader'

export const styles = StyleSheet.create({
  // `paddingTop` real se fija en el componente (insets.top + margen), mismo criterio que
  // LoginScreen.styles.ts#registerButton -- no atar useSafeAreaInsets a este fichero.
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 201, 240, 0.15)',
  },
  identity: {
    flexShrink: 1,
  },
  email: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  levelBadge: {
    color: COLORS.ice,
    opacity: 0.7,
    fontSize: 11,
    marginTop: 2,
  },
  nav: {
    flexDirection: 'row',
    gap: 10,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  navButtonText: {
    color: COLORS.ice,
    fontSize: 12,
    fontWeight: '600',
  },
})
