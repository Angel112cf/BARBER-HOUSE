import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

export default function TarjetaBarbero({
  barbero,
  onPress,
  esFavorito = false,
  onToggleFavorito,
}) {
  return (
    <View style={styles.tarjeta}>
      <TouchableOpacity
        style={styles.contenido}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.avatar}>
          {barbero.foto_url ? (
            <Image
              source={{ uri: barbero.foto_url }}
              style={styles.foto}
            />
          ) : (
            <Text style={styles.inicial}>
              {barbero.nombre?.charAt(0).toUpperCase() || '?'}
            </Text>
          )}
        </View>

        <View style={styles.informacion}>
          <Text style={styles.nombre}>{barbero.nombre}</Text>

          <Text style={styles.especialidad}>
            {barbero.especialidad || 'Barbero profesional'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botonFavorito}
        onPress={onToggleFavorito}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={
          esFavorito
            ? 'Quitar de favoritos'
            : 'Agregar a favoritos'
        }
      >
        <Text
          style={[
            styles.estrella,
            esFavorito && styles.estrellaActiva,
          ]}
        >
          ★
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: '#292929',
    borderRadius: 12,
    marginBottom: 13,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contenido: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F28C28',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  foto: {
    width: '100%',
    height: '100%',
  },
  inicial: {
    color: '#171717',
    fontSize: 22,
    fontWeight: 'bold',
  },
  informacion: {
    flex: 1,
    marginLeft: 12,
  },
  nombre: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  especialidad: {
    color: '#BDBDBD',
    marginTop: 4,
    fontSize: 13,
  },
  botonFavorito: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  estrella: {
    color: '#777777',
    fontSize: 29,
  },
  estrellaActiva: {
    color: '#F28C28',
  },
});
