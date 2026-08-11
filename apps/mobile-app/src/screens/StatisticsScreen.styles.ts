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
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: COLORS.ice,
    fontSize: 22,
    fontWeight: '700',
  },
  metricLabel: {
    color: '#ffffff',
    opacity: 0.5,
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    opacity: 0.7,
    fontSize: 13,
    marginBottom: 12,
  },
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topicName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  topicArea: {
    color: '#ffffff',
    opacity: 0.5,
    fontSize: 12,
    marginTop: 2,
  },
  accuracyBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 8,
    overflow: 'hidden',
  },
  accuracyBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.ice,
  },
  topicMetrics: {
    alignItems: 'flex-end',
  },
  topicAccuracy: {
    color: COLORS.ice,
    fontSize: 14,
    fontWeight: '700',
  },
  topicAttempts: {
    color: '#ffffff',
    opacity: 0.5,
    fontSize: 12,
    marginTop: 2,
  },
  badgeStrength: {
    backgroundColor: 'rgba(76, 201, 240, 0.12)',
    borderColor: 'rgba(76, 201, 240, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeWeakness: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyStateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.15)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: COLORS.ice,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateText: {
    color: '#ffffff',
    opacity: 0.6,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
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
