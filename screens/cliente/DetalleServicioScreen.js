import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';

import { obtenerRostrosPorCorte } from '../../services/catalogoService';

import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

const UBICACION_INICIAL = {
  latitude: -21.5355,
  longitude: -64.7296,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

export default function DetalleServicioScreen({ route, navigation }) {
  const corte = route.params?.corte;

  // Detectar automáticamente si se trata de un corte personalizado.
  const cortePersonalizado = Boolean(
    route.params?.cortePersonalizado || corte?.es_personalizado
  );

  const [rostros, setRostros] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [modalidad, setModalidad] = useState('local');
  const [incluyeBarba, setIncluyeBarba] = useState(false);

  const [direccion, setDireccion] = useState('');
  const [referenciaDireccion, setReferenciaDireccion] = useState('');
  const [ubicacion, setUbicacion] = useState(null);
  const [regionMapa, setRegionMapa] = useState(UBICACION_INICIAL);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);

  const [imagenReferencia, setImagenReferencia] = useState(null);

  const precioBase = Number(corte?.precio || 0);
  const recargoDomicilio = modalidad === 'domicilio' ? 15 : 0;
  const recargoBarba = incluyeBarba ? 15 : 0;

  const precioTotal = precioBase + recargoDomicilio + recargoBarba;

  // Obtener los tipos de rostro compatibles con el corte.
  useEffect(() => {
    async function cargarRostros() {
      try {
        if (!cortePersonalizado && corte?.id) {
          const resultado = await obtenerRostrosPorCorte(corte.id);
          setRostros(resultado);
        } else {
          setRostros([]);
        }
      } catch (error) {
        console.log('Error al cargar los tipos de rostro:', error);
      } finally {
        setCargando(false);
      }
    }

    cargarRostros();
  }, [corte?.id, cortePersonalizado]);

  // Convertir coordenadas en una dirección legible.
  async function actualizarDireccion(latitud, longitud) {
    try {
      const resultados = await Location.reverseGeocodeAsync({
        latitude: latitud,
        longitude: longitud,
      });

      if (resultados.length > 0) {
        const lugar = resultados[0];

        const partes = [
          lugar.street,
          lugar.streetNumber,
          lugar.district,
          lugar.subregion,
          lugar.city,
          lugar.region,
        ].filter(Boolean);

        const direccionEncontrada = [...new Set(partes)].join(', ');

        if (direccionEncontrada) {
          setDireccion(direccionEncontrada);
        }
      }
    } catch (error) {
      console.log('Error al convertir coordenadas:', error);
    }
  }

  // Seleccionar una ubicación tocando el mapa.
  async function seleccionarPunto(coordenada) {
    const nuevaUbicacion = {
      latitud: coordenada.latitude,
      longitud: coordenada.longitude,
    };

    setUbicacion(nuevaUbicacion);

    await actualizarDireccion(
      nuevaUbicacion.latitud,
      nuevaUbicacion.longitud
    );
  }

  // Obtener la ubicación actual del cliente.
  async function obtenerUbicacion() {
    try {
      setCargandoUbicacion(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso de ubicación',
          'Debes permitir el acceso a tu ubicación. También puedes seleccionar un punto directamente en el mapa.'
        );
        return;
      }

      const posicion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitud = posicion.coords.latitude;
      const longitud = posicion.coords.longitude;

      const nuevaUbicacion = { latitud, longitud };

      setUbicacion(nuevaUbicacion);

      setRegionMapa({
        latitude: latitud,
        longitude: longitud,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      });

      await actualizarDireccion(latitud, longitud);
    } catch (error) {
      console.log('Error al obtener ubicación:', error);

      Alert.alert(
        'Error',
        'No se pudo obtener la ubicación. Puedes seleccionar un punto en el mapa.'
      );
    } finally {
      setCargandoUbicacion(false);
    }
  }

  // Cambiar modalidad y evitar reutilizar una ubicación anterior.
  function cambiarModalidad(nuevaModalidad) {
    if (nuevaModalidad === 'domicilio' && modalidad !== 'domicilio') {
      setUbicacion(null);
      setDireccion('');
      setReferenciaDireccion('');
      setRegionMapa(UBICACION_INICIAL);
    }

    setModalidad(nuevaModalidad);
  }

  // Tomar una fotografía con la cámara.
  async function tomarFotografia() {
    try {
      const permiso =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          'Permiso de cámara',
          'Debes permitir el acceso a la cámara para tomar una fotografía.'
        );
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 4],
        quality: 0.7,
      });

      if (!resultado.canceled) {
        setImagenReferencia(resultado.assets[0].uri);
      }
    } catch (error) {
      console.log('Error al abrir la cámara:', error);
      Alert.alert('Error', 'No se pudo abrir la cámara.');
    }
  }

  // Seleccionar una fotografía de la galería.
  async function seleccionarGaleria() {
    try {
      const permiso =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          'Permiso de galería',
          'Debes permitir el acceso a tus fotografías.'
        );
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 4],
        quality: 0.7,
      });

      if (!resultado.canceled) {
        setImagenReferencia(resultado.assets[0].uri);
      }
    } catch (error) {
      console.log('Error al abrir la galería:', error);
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  }

  // Continuar con la selección del barbero.
  function continuar() {
    if (modalidad === 'domicilio') {
      if (!ubicacion) {
        Alert.alert(
          'Ubicación requerida',
          'Selecciona un punto en el mapa o utiliza tu ubicación actual.'
        );
        return;
      }

      if (!direccion.trim()) {
        Alert.alert(
          'Dirección requerida',
          'Escribe la dirección donde se realizará el servicio.'
        );
        return;
      }
    }

    if (cortePersonalizado && !imagenReferencia) {
      Alert.alert(
        'Fotografía requerida',
        'Toma una fotografía o selecciona una imagen de referencia para tu corte personalizado.'
      );
      return;
    }

    const direccionCompleta = [
      `Dirección: ${direccion.trim()}`,
      referenciaDireccion.trim()
        ? `Referencia: ${referenciaDireccion.trim()}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    navigation.navigate('ClienteTabs', {
      screen: 'Barberos',
      params: {
        corte,
        modalidad,
        incluyeBarba,
        precioBase,
        recargoDomicilio,
        recargoBarba,
        precio: precioTotal,
        direccion: modalidad === 'domicilio'
          ? direccionCompleta
          : null,
        latitud: modalidad === 'domicilio'
          ? ubicacion?.latitud ?? null
          : null,
        longitud: modalidad === 'domicilio'
          ? ubicacion?.longitud ?? null
          : null,
        cortePersonalizado,
        imagenReferencia: cortePersonalizado
          ? imagenReferencia
          : null,
      },
    });
  }

  if (!corte) {
    return (
      <View style={styles.contenedor}>
        <Text style={styles.error}>
          No se encontró la información del servicio.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenidoScroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.imagen}>
        {!cortePersonalizado && corte.imagen_url ? (
          <Image
            source={{ uri: corte.imagen_url }}
            style={styles.imagenCorte}
          />
        ) : (
          <Text style={styles.imagenTexto}>BARBER HOUSE</Text>
        )}
      </View>

      <View style={styles.contenido}>
        <Text style={styles.titulo}>
          {cortePersonalizado ? 'Corte personalizado' : corte.nombre}
        </Text>

        <Text style={styles.descripcion}>
          {corte.descripcion}
        </Text>

        {!cortePersonalizado && (
          <>
            <View style={styles.separador} />

            <Text style={styles.seccionTitulo}>
              Tipos de rostro compatibles
            </Text>

            {cargando ? (
              <ActivityIndicator color="#F28C28" />
            ) : rostros.length > 0 ? (
              rostros.map((rostro) => (
                <View style={styles.rostro} key={rostro.id}>
                  <Text style={styles.nombreRostro}>
                    {rostro.nombre}
                  </Text>

                  <Text style={styles.detalleRostro}>
                    {rostro.por_que_favorece ||
                      'Este corte es compatible con este tipo de rostro.'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.textoSecundario}>
                No hay información de compatibilidad disponible.
              </Text>
            )}
          </>
        )}

        {cortePersonalizado && (
          <>
            <View style={styles.separador} />

            <Text style={styles.seccionTitulo}>
              Imagen de referencia
            </Text>

            <Text style={styles.textoSecundario}>
              Adjunta una fotografía del estilo que deseas para que el barbero pueda conocer tu idea.
            </Text>

            <View style={styles.seccionFoto}>
              <TouchableOpacity
                style={styles.botonFoto}
                onPress={tomarFotografia}
              >
                <Text style={styles.textoBoton}>
                  TOMAR FOTOGRAFÍA
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonGaleria}
                onPress={seleccionarGaleria}
              >
                <Text style={styles.textoBotonGaleria}>
                  SELECCIONAR DE GALERÍA
                </Text>
              </TouchableOpacity>

              {imagenReferencia && (
                <View style={styles.vistaPrevia}>
                  <Image
                    source={{ uri: imagenReferencia }}
                    style={styles.foto}
                  />

                  <TouchableOpacity
                    onPress={() => setImagenReferencia(null)}
                  >
                    <Text style={styles.eliminarFoto}>
                      Eliminar fotografía
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.separador} />

        <Text style={styles.seccionTitulo}>
          Modalidad del servicio
        </Text>

        <TouchableOpacity
          style={[
            styles.opcion,
            modalidad === 'local' && styles.opcionActiva,
          ]}
          onPress={() => cambiarModalidad('local')}
        >
          <View style={styles.opcionContenido}>
            <Text style={styles.opcionTitulo}>
              Atención en el local
            </Text>
            <Text style={styles.textoSecundario}>
              Servicio en Barber House
            </Text>
          </View>

          <Text style={styles.precioOpcion}>Incluido</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.opcion,
            modalidad === 'domicilio' && styles.opcionActiva,
          ]}
          onPress={() => cambiarModalidad('domicilio')}
        >
          <View style={styles.opcionContenido}>
            <Text style={styles.opcionTitulo}>
              Servicio a domicilio
            </Text>
            <Text style={styles.textoSecundario}>
              Selecciona dónde quieres recibir el servicio
            </Text>
          </View>

          <Text style={styles.precioOpcion}>+ Bs. 15</Text>
        </TouchableOpacity>

        {modalidad === 'domicilio' && (
          <View style={styles.seccionDireccion}>
            <Text style={styles.seccionTitulo}>
              Ubicación del servicio
            </Text>

            <Text style={styles.instruccionMapa}>
              Mueve el mapa y toca el lugar exacto donde quieres recibir al barbero. También puedes arrastrar el marcador.
            </Text>

            <View style={styles.contenedorMapa}>
              <MapView
                style={styles.mapa}
                region={regionMapa}
                onRegionChangeComplete={setRegionMapa}
                onPress={(evento) =>
                  seleccionarPunto(evento.nativeEvent.coordinate)
                }
                showsUserLocation
                showsMyLocationButton={false}
              >
                {ubicacion && (
                  <Marker
                    coordinate={{
                      latitude: ubicacion.latitud,
                      longitude: ubicacion.longitud,
                    }}
                    draggable
                    onDragEnd={(evento) =>
                      seleccionarPunto(evento.nativeEvent.coordinate)
                    }
                    title="Ubicación del servicio"
                    description="Puedes mover este marcador."
                    pinColor="#F28C28"
                  />
                )}
              </MapView>
            </View>

            <TouchableOpacity
              style={styles.botonUbicacion}
              onPress={obtenerUbicacion}
              disabled={cargandoUbicacion}
            >
              {cargandoUbicacion ? (
                <ActivityIndicator color="#171717" />
              ) : (
                <Text style={styles.textoBotonUbicacion}>
                  USAR MI UBICACIÓN ACTUAL
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.etiquetaCampo}>
              Dirección
            </Text>

            <TextInput
              style={styles.campoDireccion}
              placeholder="Escribe o corrige tu dirección..."
              placeholderTextColor="#888888"
              value={direccion}
              onChangeText={setDireccion}
              multiline
            />

            <Text style={styles.etiquetaCampo}>
              Referencia adicional
            </Text>

            <TextInput
              style={styles.campoReferencia}
              placeholder="Ej. Portón negro, casa de dos pisos..."
              placeholderTextColor="#888888"
              value={referenciaDireccion}
              onChangeText={setReferenciaDireccion}
              multiline
            />

            {ubicacion && (
              <View style={styles.coordenadas}>
                <Text style={styles.textoCoordenadas}>
                  <Text style={styles.coordenadasNegrita}>
                    Ubicación seleccionada
                  </Text>
                  {'\n'}
                  Latitud: {ubicacion.latitud.toFixed(6)}
                  {'\n'}
                  Longitud: {ubicacion.longitud.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.separador} />

        <Text style={styles.seccionTitulo}>
          Servicios adicionales
        </Text>

        <TouchableOpacity
          style={[
            styles.opcion,
            incluyeBarba && styles.opcionActiva,
          ]}
          onPress={() => setIncluyeBarba(!incluyeBarba)}
        >
          <View style={styles.opcionContenido}>
            <Text style={styles.opcionTitulo}>
              Incluir arreglo de barba
            </Text>
            <Text style={styles.textoSecundario}>
              Servicio adicional
            </Text>
          </View>

          <Text style={styles.precioOpcion}>
            {incluyeBarba ? '✓ + Bs. 15' : '+ Bs. 15'}
          </Text>
        </TouchableOpacity>

        <View style={styles.separador} />

        <View style={styles.resumen}>
          <Text style={styles.resumenTitulo}>
            Resumen del servicio
          </Text>

          <View style={styles.filaPrecio}>
            <Text style={styles.textoSecundario}>
              {cortePersonalizado ? 'Corte personalizado' : 'Corte seleccionado'}
            </Text>
            <Text style={styles.textoPrecio}>
              Bs. {precioBase.toFixed(2)}
            </Text>
          </View>

          {recargoDomicilio > 0 && (
            <View style={styles.filaPrecio}>
              <Text style={styles.textoSecundario}>
                Servicio a domicilio
              </Text>
              <Text style={styles.textoPrecio}>
                + Bs. 15.00
              </Text>
            </View>
          )}

          {recargoBarba > 0 && (
            <View style={styles.filaPrecio}>
              <Text style={styles.textoSecundario}>
                Arreglo de barba
              </Text>
              <Text style={styles.textoPrecio}>
                + Bs. 15.00
              </Text>
            </View>
          )}

          <View style={styles.lineaPrecio} />

          <Text style={styles.resumenTitulo}>
            Precio total
          </Text>

          <Text style={styles.precioTotal}>
            Bs. {precioTotal.toFixed(2)}
          </Text>

          <Text style={styles.textoSecundario}>
            El precio se actualizará según las opciones seleccionadas.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.boton}
          onPress={continuar}
        >
          <Text style={styles.textoBoton}>
            CONTINUAR
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#171717',
  },
  contenidoScroll: {
    paddingBottom: 15,
  },
  imagen: {
  height: 300,
  width: '100%',
  backgroundColor: '#343434',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
},
  imagenCorte: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagenTexto: {
    color: '#777777',
    fontSize: 23,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  contenido: {
    padding: 20,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold',
  },
  descripcion: {
    color: '#AAAAAA',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
  },
  separador: {
    height: 1,
    backgroundColor: '#383838',
    marginVertical: 22,
  },
  seccionTitulo: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 13,
  },
  rostro: {
    backgroundColor: '#292929',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  nombreRostro: {
    color: '#F28C28',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detalleRostro: {
    color: '#BBBBBB',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  textoSecundario: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 5,
  },
  opcion: {
    backgroundColor: '#292929',
    borderWidth: 1,
    borderColor: '#414141',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  opcionActiva: {
    borderColor: '#F28C28',
    backgroundColor: '#382B20',
  },
  opcionContenido: {
    flex: 1,
    marginRight: 10,
  },
  opcionTitulo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  precioOpcion: {
    color: '#F28C28',
    fontSize: 13,
    fontWeight: 'bold',
  },
  seccionDireccion: {
    marginTop: 12,
    marginBottom: 5,
  },
  instruccionMapa: {
    color: '#AAAAAA',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  contenedorMapa: {
    height: 270,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#414141',
  },
  mapa: {
    flex: 1,
  },
  botonUbicacion: {
    backgroundColor: '#F28C28',
    borderRadius: 9,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  textoBotonUbicacion: {
    color: '#171717',
    fontSize: 12,
    fontWeight: 'bold',
  },
  etiquetaCampo: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 7,
    marginTop: 5,
  },
  campoDireccion: {
    backgroundColor: '#292929',
    borderWidth: 1,
    borderColor: '#414141',
    borderRadius: 9,
    color: '#FFFFFF',
    padding: 14,
    minHeight: 75,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 12,
  },
  campoReferencia: {
    backgroundColor: '#292929',
    borderWidth: 1,
    borderColor: '#414141',
    borderRadius: 9,
    color: '#FFFFFF',
    padding: 14,
    minHeight: 65,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  coordenadas: {
    backgroundColor: '#26372B',
    borderRadius: 9,
    padding: 12,
    marginTop: 12,
  },
  textoCoordenadas: {
    color: '#A9DDB7',
    fontSize: 12,
    lineHeight: 19,
  },
  coordenadasNegrita: {
    fontWeight: 'bold',
  },
  seccionFoto: {
    marginTop: 10,
  },
  botonFoto: {
    backgroundColor: '#F28C28',
    borderRadius: 9,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  botonGaleria: {
    backgroundColor: '#292929',
    borderWidth: 1,
    borderColor: '#F28C28',
    borderRadius: 9,
    padding: 15,
    alignItems: 'center',
  },
  textoBotonGaleria: {
    color: '#F28C28',
    fontSize: 13,
    fontWeight: 'bold',
  },
  vistaPrevia: {
    marginTop: 15,
    alignItems: 'center',
  },
  foto: {
    width: 220,
    height: 220,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  eliminarFoto: {
    color: '#F28C28',
    fontSize: 13,
    marginTop: 10,
  },
  resumen: {
    backgroundColor: '#292929',
    borderRadius: 12,
    padding: 18,
    marginTop: 12,
  },
  resumenTitulo: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  filaPrecio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  textoPrecio: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  lineaPrecio: {
    height: 1,
    backgroundColor: '#414141',
    marginVertical: 15,
  },
  precioTotal: {
    color: '#F28C28',
    fontSize: 27,
    fontWeight: 'bold',
    marginTop: 7,
  },
  boton: {
    backgroundColor: '#F28C28',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 25,
  },
  textoBoton: {
    color: '#171717',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  error: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 40,
  },
});
