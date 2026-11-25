import { useUsuario } from '../../context/UsuarioContext';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export default function DetalleBarberoScreen({ navigation, route }) {
  const { usuario } = useUsuario();

  // Conservamos todos los datos recibidos durante la navegación.
  const datosReserva = route.params || {};

  const {
    barbero,
    corte,
    modalidad,
    incluyeBarba,
    precioBase,
    precio,
  } = datosReserva;

  const tieneServicio = Boolean(corte);

  const continuar = () => {
    if (!barbero || !tieneServicio) return;

    navigation.navigate('FormularioReserva', {
      ...datosReserva,
      barbero,
    });
  };

  if (!barbero) {
    return (
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>Barbero no disponible</Text>
        <Text style={styles.texto}>
          No se recibieron los datos del barbero seleccionado.
        </Text>

        <TouchableOpacity
          style={styles.boton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.textoBoton}>VOLVER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const iniciales = barbero.nombre
    ? barbero.nombre
        .split(' ')
        .map((palabra) => palabra[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'BH';

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
    >
      <Text style={styles.titulo}>Detalle del barbero</Text>

      <View style={styles.tarjetaPerfil}>
        {barbero.foto_url ? (
          <Image
            source={{ uri: barbero.foto_url }}
            style={styles.foto}
            onError={() => console.log('No se pudo cargar la foto del barbero.')}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.iniciales}>{iniciales}</Text>
          </View>
        )}

        <Text style={styles.nombre}>
          {barbero.nombre || 'Barbero'}
        </Text>

        <Text style={styles.especialidad}>
          {barbero.especialidad || 'Especialista en barbería'}
        </Text>

        {barbero.telefono ? (
          <Text style={styles.telefono}>
            Teléfono: {barbero.telefono}
          </Text>
        ) : null}
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.subtitulo}>Resumen del servicio</Text>

        {tieneServicio ? (
          <>
            <View style={styles.fila}>
              <Text style={styles.etiqueta}>Corte seleccionado</Text>
              <Text style={styles.valor}>
                {corte.nombre}
              </Text>
            </View>

            <View style={styles.fila}>
              <Text style={styles.etiqueta}>Modalidad</Text>
              <Text style={styles.valor}>
                {modalidad === 'domicilio' ? 'A domicilio' : 'En local'}
              </Text>
            </View>

            <View style={styles.fila}>
              <Text style={styles.etiqueta}>Servicio de barba</Text>
              <Text style={styles.valor}>
                {incluyeBarba ? 'Incluido' : 'No incluido'}
              </Text>
            </View>

            <View style={styles.fila}>
              <Text style={styles.etiqueta}>Precio base</Text>
              <Text style={styles.valor}>
                Bs. {Number(precioBase || 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.separador} />

            <View style={styles.fila}>
              <Text style={styles.totalEtiqueta}>Total</Text>
              <Text style={styles.total}>
                Bs. {Number(precio || 0).toFixed(2)}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.aviso}>
            Primero debes seleccionar un corte desde el catálogo para
            continuar con una reserva.
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.boton,
          !tieneServicio && styles.botonDeshabilitado,
        ]}
        onPress={continuar}
        disabled={!tieneServicio}
      >
        <Text style={styles.textoBoton}>
          CONTINUAR CON LA RESERVA
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#171717',
  },
  contenido: {
    padding: 20,
    paddingBottom: 35,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  tarjetaPerfil: {
    backgroundColor: '#292929',
    borderRadius: 14,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
  },
  foto: {
    width: 115,
    height: 115,
    borderRadius: 60,
    marginBottom: 15,
  },
  avatar: {
    width: 115,
    height: 115,
    borderRadius: 60,
    backgroundColor: '#F28C28',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  iniciales: {
    color: '#171717',
    fontSize: 36,
    fontWeight: 'bold',
  },
  nombre: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  especialidad: {
    color: '#F28C28',
    fontSize: 15,
    marginTop: 7,
    textAlign: 'center',
  },
  telefono: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 12,
  },
  tarjeta: {
    backgroundColor: '#292929',
    borderRadius: 14,
    padding: 18,
    marginBottom: 22,
  },
  subtitulo: {
    color: '#F28C28',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  etiqueta: {
    color: '#AAAAAA',
    fontSize: 14,
    flex: 1,
  },
  valor: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  separador: {
    height: 1,
    backgroundColor: '#444444',
    marginVertical: 8,
  },
  totalEtiqueta: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  total: {
    color: '#F28C28',
    fontSize: 21,
    fontWeight: 'bold',
  },
  aviso: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 21,
  },
  boton: {
    backgroundColor: '#F28C28',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonDeshabilitado: {
    backgroundColor: '#555555',
  },
  textoBoton: {
    color: '#171717',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
