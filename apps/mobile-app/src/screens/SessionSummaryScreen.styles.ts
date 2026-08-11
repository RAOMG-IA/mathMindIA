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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.ice,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.15)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  statRowLast: {
    borderBottomWidth: 0,
  },
  statLabel: {
    color: '#ffffff',
    opacity: 0.7,
    fontSize: 14,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  statValuePositive: {
    color: COLORS.ice,
  },
  statValueNegative: {
    color: COLORS.coral,
  },
  emptyText: {
    color: '#ffffff',
    opacity: 0.7,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  homeButton: {
    width: '100%',
    backgroundColor: COLORS.ice,
    borderRadius: 40,
    paddingVertical: 14,
    alignItems: 'center',
  },
  homeButtonText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '700',
  },
})
