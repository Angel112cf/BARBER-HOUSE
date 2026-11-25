import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function Boton({ titulo, onPress, secundario = false }) {
  return (
    <TouchableOpacity
      style={[styles.boton, secundario && styles.secundario]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.texto, secundario && styles.textoSecundario]}>
        {titulo}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  boton: {
    backgroundColor: '#F28C28',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 6,
  },
  secundario: {
    backgroundColor: '#292929',
    borderWidth: 1,
    borderColor: '#F28C28',
  },
  texto: {
    color: '#171717',
    fontWeight: 'bold',
    fontSize: 15,
  },
  textoSecundario: {
    color: '#F28C28',
  },
});
