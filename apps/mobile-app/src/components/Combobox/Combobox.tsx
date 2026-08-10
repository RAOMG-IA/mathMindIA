import { useEffect, useState } from 'react'
import { FlatList, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native'
import { Checkbox } from '../Checkbox'
import { styles } from './Combobox.styles'
import { isAllSelected, toggleSelectAll, toggleSelection } from './Combobox.logic'

interface ComboboxBaseProps<T> {
  readonly items: readonly T[]
  readonly getKey: (item: T) => string
  readonly getLabel: (item: T) => string
  readonly placeholder?: string
  readonly error?: string
}

interface ComboboxSingleProps<T> extends ComboboxBaseProps<T> {
  readonly multiSelect?: false
  readonly value: string | null
  readonly onChange: (key: string) => void
}

interface ComboboxMultiProps<T> extends ComboboxBaseProps<T> {
  readonly multiSelect: true
  readonly values: readonly string[]
  readonly onChange: (keys: readonly string[]) => void
  // Preselecciona el catalogo completo la primera vez que hay items y `values` sigue vacio --
  // conveniencia para el consumidor (evita tener que inicializar el estado a mano), no logica
  // de "valor por defecto" no controlado: el componente sigue siendo controlado en todo momento.
  readonly selectAllDefault?: boolean
}

export type ComboboxProps<T> = ComboboxSingleProps<T> | ComboboxMultiProps<T>

// Combobox generico y reutilizable, con soporte real de seleccion multiple (checkbox por fila +
// "seleccionar todos") ademas de seleccion simple. HomeScreen lo usa hoy en modo single-select
// para el Tema de la sesion (US-003 exige un unico Tema por sesion, StartSessionRequestDto solo
// acepta uno) -- multiSelect queda listo para el proximo consumidor que sí necesite varios.
export function Combobox<T>(props: ComboboxProps<T>) {
  const { items, getKey, getLabel, placeholder = 'Selecciona...', error } = props
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (props.multiSelect && props.selectAllDefault && props.values.length === 0 && items.length > 0) {
      props.onChange(items.map(getKey))
    }
    // Solo al montar o cuando cambia el catalogo -- no en cada cambio de `values`, o
    // sobrescribiria una deseleccion manual del usuario nada mas ocurrir.
  }, [items])

  function close() {
    setIsOpen(false)
  }

  const summary = props.multiSelect
    ? props.values.length === 0
      ? placeholder
      : props.values.length === items.length
        ? 'Todos seleccionados'
        : `${props.values.length} seleccionados`
    : (items.find((item) => getKey(item) === props.value) ? getLabel(items.find((item) => getKey(item) === props.value)!) : placeholder)

  const isPlaceholder = props.multiSelect ? props.values.length === 0 : !props.value

  return (
    <View style={styles.field}>
      <TouchableOpacity
        style={[styles.trigger, error && styles.triggerError]}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
      >
        <Text style={[styles.triggerText, isPlaceholder && styles.triggerPlaceholder]} numberOfLines={1}>
          {summary}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
        <View style={{ flex: 1 }}>
          <Pressable style={styles.backdrop} onPress={close} />
          <View style={styles.panelWrapper} pointerEvents="box-none">
            <View style={styles.panel}>
              {props.multiSelect ? (
                <>
                  <Checkbox
                    checked={isAllSelected(props.values, items, getKey)}
                    onChange={() => props.onChange(toggleSelectAll(props.values, items, getKey))}
                    label="Seleccionar todos"
                  />
                  <View style={styles.divider} />
                </>
              ) : null}

              {/* indicatorStyle="white" -- convencion nativa del scroll formal, src/styles/README.md */}
              <FlatList
                data={items}
                keyExtractor={getKey}
                style={styles.list}
                indicatorStyle="white"
                renderItem={({ item }) => {
                  const key = getKey(item)

                  if (props.multiSelect) {
                    return (
                      <Checkbox
                        checked={props.values.includes(key)}
                        onChange={() => props.onChange(toggleSelection(props.values, key))}
                        label={getLabel(item)}
                      />
                    )
                  }

                  const selected = props.value === key
                  return (
                    <TouchableOpacity
                      style={[styles.row, selected && styles.rowSelected]}
                      onPress={() => {
                        props.onChange(key)
                        close()
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>{getLabel(item)}</Text>
                    </TouchableOpacity>
                  )
                }}
              />

              <TouchableOpacity style={styles.doneButton} onPress={close} accessibilityRole="button">
                <Text style={styles.doneButtonText}>Hecho</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
