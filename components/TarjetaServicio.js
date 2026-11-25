import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function TarjetaServicio({ servicio, onPress }) {
  return (
    <TouchableOpacity
      style={styles.tarjeta}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.contenido}>
        <Text style={styles.nombre}>{servicio.nombre}</Text>
        <Text style={styles.descripcion}>{servicio.descripcion}</Text>

        <View style={styles.pie}>
          <Text style={styles.precio}>Bs. {servicio.precio}</Text>
          <Text style={styles.duracion}>{servicio.duracion}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: '#292929',
    borderRadius: 12,
    marginBottom: 13,
    borderLeftWidth: 4,
    borderLeftColor: '#F28C28',
  },
  contenido: {
    padding: 15,
  },
  nombre: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  descripcion: {
    color: '#BDBDBD',
    marginTop: 6,
  },
  pie: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  precio: {
    color: '#F28C28',
    fontWeight: 'bold',
  },
  duracion: {
    color: '#BDBDBD',
  },
});
