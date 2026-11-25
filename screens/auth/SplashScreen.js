import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

export default function SplashScreen({ navigation }) {
  return (
    <View style={styles.contenedor}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.nombre}>
        BARBER <Text style={styles.naranja}>HOUSE</Text>
      </Text>

      <Text style={styles.subtitulo}>
        Tu estilo, nuestra pasión
      </Text>

      <TouchableOpacity
        style={styles.boton}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.textoBoton}>COMENZAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#2e2e2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  logo: {
    width: 230,
    height: 230,
    marginBottom: 20,
  },
  nombre: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 3,
  },
  naranja: {
    color: '#F28C28',
  },
  subtitulo: {
    color: '#BDBDBD',
    fontSize: 15,
    letterSpacing: 2,
    marginTop: 10,
    marginBottom: 45,
  },
  boton: {
    backgroundColor: '#F28C28',
    paddingVertical: 15,
    paddingHorizontal: 55,
    borderRadius: 10,
  },
  textoBoton: {
    color: '#171717',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
