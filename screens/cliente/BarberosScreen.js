import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUsuario } from '../../context/UsuarioContext';
import TarjetaBarbero from '../../components/TarjetaBarbero';

import {
  obtenerBarberos,
  obtenerFavoritosPorCliente,
  alternarFavorito,
} from '../../services/barberoService';

const imagenNuestrosBarberos = require('../../assets/nuestrosbar.png');

export default function BarberosScreen({ navigation, route }) {
  const { usuario } = useUsuario();

  // Conservar todos los datos del servicio seleccionado.
  const datosServicio = route.params?.corte
    ? { ...route.params }
    : {};

  const corte = datosServicio.corte;

  const [barberos, setBarberos] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Obtener los barberos y favoritos desde Supabase.
  async function cargarBarberos() {
    if (!usuario?.id) {
      setError('No se pudo identificar al cliente que inició sesión.');
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError('');

      const [listaBarberos, listaFavoritos] = await Promise.all([
        obtenerBarberos(),
        obtenerFavoritosPorCliente(usuario.id),
      ]);

      setBarberos(listaBarberos);

      setFavoritos(
        listaFavoritos.map((favorito) => favorito.barbero_id)
      );
    } catch (error) {
      console.error('Error al cargar los barberos:', error);

      setError(
        'No se pudo cargar la lista de barberos. Comprueba tu conexión e inténtalo nuevamente.'
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarBarberos();
  }, [usuario?.id]);

  // Agregar o quitar un barbero de favoritos.
  async function cambiarFavorito(barberoId) {
    try {
      const esFavorito = await alternarFavorito(
        usuario.id,
        barberoId
      );

      setFavoritos((actuales) => {
        if (esFavorito) {
          return [...actuales, barberoId];
        }

        return actuales.filter((id) => id !== barberoId);
      });
    } catch (error) {
      console.error('Error al actualizar favorito:', error);

      setError(
        'No se pudo actualizar el favorito. Inténtalo nuevamente.'
      );
    }
  }

  // Enviar todos los datos del servicio al barbero seleccionado.
  function seleccionarBarbero(barbero) {
    navigation.navigate('DetalleBarbero', {
      barbero,
      ...datosServicio,
    });
  }

  // Estado de carga.
  if (cargando) {
    return (
      <SafeAreaView style={styles.areaSegura}>
        <View style={styles.estado}>
          <ActivityIndicator size="large" color="#F28C28" />

          <Text style={styles.textoCargando}>
            Cargando barberos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Estado de error.
  if (error) {
    return (
      <SafeAreaView style={styles.areaSegura}>
        <View style={styles.estado}>
          <Text style={styles.tituloError}>
            No se pudo cargar
          </Text>

          <Text style={styles.textoError}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.botonReintentar}
            onPress={cargarBarberos}
            activeOpacity={0.8}
          >
            <Text style={styles.textoBoton}>
              REINTENTAR
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Encabezado de la lista.
  const encabezadoLista = (
    <View>
      {/* ENCABEZADO */}
      <View style={styles.encabezado}>
        

        <Text style={styles.marca}>
          BARBER HOUSE
        </Text>

        <View style={styles.filaEncabezado}>
  <Image
    source={imagenNuestrosBarberos}
    style={styles.imagenEncabezado}
    resizeMode="contain"
  />
  <Text style={styles.titulo}>Nuestros barberos</Text>
       </View>
        <Text style={styles.subtitulo}>
          Conoce a nuestro equipo y encuentra al profesional
          ideal para tu próximo estilo.
        </Text>
      </View>

      {/* CORTE SELECCIONADO */}
      {corte?.imagen_url && (
        <View style={styles.corteSeleccionado}>
          <Image
            source={{ uri: corte.imagen_url }}
            style={styles.imagenCorte}
            resizeMode="cover"
          />

          <View style={styles.infoCorte}>
            <Text style={styles.etiquetaCorte}>
              TU ESTILO SELECCIONADO
            </Text>

            <Text style={styles.nombreCorte}>
              {corte.nombre}
            </Text>

            <Text style={styles.descripcionCorte}>
              Selecciona quién realizará tu servicio.
            </Text>
          </View>
        </View>
      )}

      {/* ENCABEZADO DEL EQUIPO */}
      <View style={styles.encabezadoEquipo}>
        <View>
          <Text style={styles.tituloEquipo}>
            Nuestro equipo
          </Text>

          <Text style={styles.subtituloEquipo}>
            Profesionales a tu disposición
          </Text>
        </View>

        <View style={styles.contador}>
          <Text style={styles.numeroContador}>
            {barberos.length}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={styles.areaSegura}
      edges={['top', 'left', 'right']}
    >
      <FlatList
        data={barberos}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={encabezadoLista}
        renderItem={({ item }) => (
          <TarjetaBarbero
            barbero={item}
            esFavorito={favoritos.includes(item.id)}
            onToggleFavorito={() => cambiarFavorito(item.id)}
            onPress={() => seleccionarBarbero(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Text style={styles.tituloVacio}>
              No hay barberos disponibles
            </Text>

            <Text style={styles.textoVacio}>
              Actualmente no tenemos profesionales disponibles.
              Inténtalo nuevamente más tarde.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: '#171717',
  },
  lista: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
  },

// ENCABEZADO
encabezado: {
  alignItems: 'flex-start',
  marginBottom: 22,
},

marca: {
  color: '#F28C28',
  fontSize: 11,
  fontWeight: 'bold',
  letterSpacing: 3,
  marginBottom: 7,
},

titulo: {
  color: '#FFFFFF',
  fontSize: 27,
  fontWeight: 'bold',
  textAlign: 'left',
},

subtitulo: {
  color: '#AAAAAA',
  fontSize: 13,
  lineHeight: 20,
  textAlign: 'left',
  marginTop: 7,
  paddingHorizontal: 0,
},

filaEncabezado: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: 10,
  marginBottom: 12,
},

imagenEncabezado: {
  width: 28,
  height: 28,
  resizeMode: 'contain',
  flexShrink: 0,
},
  // CORTE SELECCIONADO
  corteSeleccionado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292929',
    padding: 11,
    borderRadius: 13,
    marginBottom: 27,
    borderWidth: 1,
    borderColor: '#F28C28',
  },
  imagenCorte: {
    width: 76,
    height: 76,
    borderRadius: 9,
    backgroundColor: '#383838',
  },
  infoCorte: {
    flex: 1,
    marginLeft: 13,
  },
  etiquetaCorte: {
    color: '#F28C28',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  nombreCorte: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  descripcionCorte: {
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 5,
  },

  // EQUIPO
  encabezadoEquipo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tituloEquipo: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
  },
  subtituloEquipo: {
    color: '#888888',
    fontSize: 11,
    marginTop: 5,
  },
  contador: {
    backgroundColor: '#292929',
    borderWidth: 1,
    borderColor: '#F28C28',
    width: 36,
    height: 36,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numeroContador: {
    color: '#F28C28',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // LISTA
  vacio: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  tituloVacio: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textoVacio: {
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    lineHeight: 19,
  },

  // CARGA Y ERROR
  estado: {
    flex: 1,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  textoCargando: {
    color: '#AAAAAA',
    marginTop: 12,
    fontSize: 13,
  },
  tituloError: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  textoError: {
    color: '#AAAAAA',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
  },
  botonReintentar: {
    backgroundColor: '#F28C28',
    paddingVertical: 13,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  textoBoton: {
    color: '#171717',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },

});
