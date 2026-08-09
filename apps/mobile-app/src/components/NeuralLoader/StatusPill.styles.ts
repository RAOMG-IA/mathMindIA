import { Platform, StyleSheet } from 'react-native'
import { COLORS } from './constants'

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '8%',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.12)',
    backgroundColor: Platform.OS === 'web' ? 'rgba(10, 14, 23, 0.55)' : 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  title: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ice,
  },
  subtitle: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.4,
  },
  cursor: {
    width: 7,
    height: 14,
    marginLeft: 6,
    backgroundColor: COLORS.ice,
  },
})
