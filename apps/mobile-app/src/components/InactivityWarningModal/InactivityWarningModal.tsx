import { Modal, Text, TouchableOpacity, View } from 'react-native'
import { styles } from './InactivityWarningModal.styles'

interface InactivityWarningModalProps {
  readonly visible: boolean
  readonly onContinue: () => void
}

// US-010 (adenda ADR-015): aviso antes del cierre de sesion automatico por inactividad, con
// opcion de continuar. Modal nativo de React Native -- mismo primitivo que ya usa Combobox, sin
// dependencia nueva.
export function InactivityWarningModal({ visible, onContinue }: InactivityWarningModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>¿Sigues ahí?</Text>
          <Text style={styles.message}>
            Tu sesión está a punto de cerrarse por inactividad. Pulsa para seguir conectado.
          </Text>
          <TouchableOpacity style={styles.button} onPress={onContinue} accessibilityRole="button">
            <Text style={styles.buttonText}>Seguir conectado</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}
