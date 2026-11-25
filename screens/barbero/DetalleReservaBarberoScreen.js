import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';

import { supabase } from '../../services/supabase';
import { obtenerReservaPorId } from '../../services/reservaService';

export default function DetalleReservaBarberoScreen({ route }) {
  const { reservaId } = route.params;

  const [reserva, setReserva] = useState(null);
  const [foto, setFoto] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDetalle();
  }, [reservaId]);

  // Consultar la reserva y su fotografía privada.
  const cargarDetalle = async () => {
    setCargando(true);
    setReserva(null);
    setFoto(null);

    try {
      const { data: usuario, error: errorUsuario } =
        await supabase.auth.getUser();

      if (errorUsuario) throw errorUsuario;

      if (!usuario.user) {
        throw new Error('No se encontró una sesión activa.');
      }

      const datos = await obtenerReservaPorId(reservaId);

      if (datos.barbero_id !== usuario.user.id) {
        throw new Error('No tienes permiso para consultar esta reserva.');
      }

      setReserva(datos);

      // Buscar la fotografía privada del corte personalizado.
      try {
        const { data: archivos, error: errorArchivos } =
          await supabase.storage
            .from('referencias-reservas')
            .list(reservaId);

        if (errorArchivos) throw errorArchivos;

        const archivo = (archivos || []).find(
          (item) => item.name && !item.name.startsWith('.')
        );

        if (archivo) {
          const { data: url, error: errorUrl } =
            await supabase.storage
              .from('referencias-reservas')
              .createSignedUrl(
                `${reservaId}/${archivo.name}`,
                3600
              );

          if (errorUrl) throw errorUrl;

          setFoto(url.signedUrl);
        }
      } catch (errorFoto) {
        console.error('Error al cargar fotografía:', errorFoto);
      }
    } catch (error) {
      console.error('Error al cargar detalle:', error);

      Alert.alert(
        'Error',
        error.message || 'No se pudo cargar la reserva.'
      );
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';

    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#F28C28" />
        <Text style={styles.cargando}>Cargando reserva...</Text>
      </View>
    );
  }

  if (!reserva) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.texto}>
          No se encontró la reserva.
        </Text>
      </View>
    );
  }

  const esDomicilio =
    reserva.modalidad?.toLowerCase().includes('domicilio');

  const esCortePersonalizado = reserva.corte_personalizado;

  // Comprobar que la reserva tenga coordenadas válidas.
  const tieneUbicacion =
    reserva.latitud !== null &&
    reserva.latitud !== undefined &&
    reserva.longitud !== null &&
    reserva.longitud !== undefined &&
    String(reserva.latitud).trim() !== '' &&
    String(reserva.longitud).trim() !== '' &&
    Number.isFinite(Number(reserva.latitud)) &&
    Number.isFinite(Number(reserva.longitud));

  const coordenadas = tieneUbicacion
    ? {
        latitude: Number(reserva.latitud),
        longitude: Number(reserva.longitud),
      }
    : null;

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.marca}>BARBER HOUSE</Text>

      <Text style={styles.titulo}>Detalle de la cita</Text>

      <Text style={styles.subtitulo}>
        Información del servicio asignado.
      </Text>

      {/* Información general de la reserva. */}
      <View style={styles.tarjeta}>
        <Text style={styles.etiqueta}>SERVICIO</Text>
        <Text style={styles.servicio}>{reserva.servicio}</Text>

        <View style={styles.separador} />

        <Text style={styles.etiqueta}>CLIENTE</Text>
        <Text style={styles.valor}>{reserva.cliente}</Text>

        <Text style={styles.etiqueta}>TELÉFONO</Text>
        <Text style={styles.valor}>
          {reserva.telefono_cliente || 'No registrado'}
        </Text>

        <View style={styles.fila}>
          <View style={styles.columna}>
            <Text style={styles.etiqueta}>FECHA</Text>
            <Text style={styles.valor}>
              {formatearFecha(reserva.fecha)}
            </Text>
          </View>

          <View style={styles.columna}>
            <Text style={styles.etiqueta}>HORA</Text>
            <Text style={styles.valor}>
              {reserva.hora?.slice(0, 5) || 'No disponible'}
            </Text>
          </View>
        </View>

        <Text style={styles.etiqueta}>MODALIDAD</Text>
        <Text style={styles.valor}>{reserva.modalidad}</Text>

        <Text style={styles.etiqueta}>INCLUYE BARBA</Text>
        <Text style={styles.valor}>
          {reserva.incluye_barba ? 'Sí' : 'No'}
        </Text>

        <Text style={styles.etiqueta}>ESTADO</Text>
        <Text style={styles.estado}>{reserva.estado}</Text>

        <View style={styles.separador} />

        <Text style={styles.etiqueta}>PRECIO DEL SERVICIO</Text>
        <Text style={styles.precio}>
          Bs {Number(reserva.precio).toFixed(2)}
        </Text>
      </View>

      {/* Ubicación del cliente para servicios a domicilio. */}
      {esDomicilio && (
        <>
          <Text style={styles.tituloSeccion}>
            Ubicación del cliente
          </Text>

          <View style={styles.tarjeta}>
            <View style={styles.encabezadoUbicacion}>
              <Text style={styles.iconoUbicacion}>⌖</Text>

              <View style={styles.columna}>
                <Text style={styles.nombreSeccion}>
                  Dirección de atención
                </Text>

                <Text style={styles.textoSecundario}>
                  Ubicación proporcionada por el cliente
                </Text>
              </View>
            </View>

            <Text style={styles.etiqueta}>
              REFERENCIA DE LA RESERVA
            </Text>
            <Text style={styles.valor}>
              {reserva.direccion_referencia || 'Sin referencia adicional'}
            </Text>

            <View style={styles.separador} />

            <Text style={styles.etiqueta}>MAPA DE UBICACIÓN</Text>

            {coordenadas ? (
              <View style={styles.mapaContenedor}>
                <MapView
                  style={styles.mapa}
                  initialRegion={{
                    ...coordenadas,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  rotateEnabled={true}
                  pitchEnabled={true}
                  toolbarEnabled={false}
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                  moveOnMarkerPress={false}
                >
                  <Marker
                    coordinate={coordenadas}
                    title="Ubicación del cliente"
                    description="Lugar de atención de la reserva"
                    pinColor="#F28C28"
                    draggable={false}
                  />
                </MapView>
              </View>
            ) : (
              <View style={styles.sinUbicacion}>
                <Text style={styles.sinUbicacionTitulo}>
                  Ubicación no disponible
                </Text>

                <Text style={styles.textoSecundario}>
                  Esta reserva no tiene coordenadas guardadas.
                </Text>
              </View>
            )}

            <Text style={styles.avisoUbicacion}>
              Puedes explorar el mapa, acercar y alejar la vista.
              El marcador indica la ubicación registrada y no se puede mover.
            </Text>
          </View>
        </>
      )}

      {/* Imagen del corte normal. */}
      {!esCortePersonalizado && reserva.imagen_url && (
        <>
          <Text style={styles.tituloSeccion}>
            Corte seleccionado
          </Text>

          <View style={styles.tarjetaFoto}>
            <Image
              source={{ uri: reserva.imagen_url }}
              style={styles.imagen}
            />
          </View>
        </>
      )}

      {/* Fotografía privada del corte personalizado. */}
      {esCortePersonalizado && (
        <>
          <Text style={styles.tituloSeccion}>
            Referencia del cliente
          </Text>

          <View style={styles.tarjetaFoto}>
            {foto ? (
              <Image
                source={{ uri: foto }}
                style={styles.imagen}
              />
            ) : (
              <Text style={styles.sinFoto}>
                El cliente no adjuntó una fotografía.
              </Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#111111',
  },
  contenido: {
    padding: 20,
    paddingBottom: 35,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
  },
  marca: {
    color: '#F28C28',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 12,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
  },
  subtitulo: {
    color: '#A6A6A6',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 22,
  },
  tarjeta: {
    backgroundColor: '#1D1D1D',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 8,
  },
  etiqueta: {
    color: '#F28C28',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 15,
    marginBottom: 6,
  },
  servicio: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  valor: {
    color: '#F1F1F1',
    fontSize: 15,
    lineHeight: 23,
  },
  estado: {
    color: '#F28C28',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  precio: {
    color: '#F28C28',
    fontSize: 27,
    fontWeight: '900',
  },
  separador: {
    height: 1,
    backgroundColor: '#393939',
    marginVertical: 17,
  },
  fila: {
    flexDirection: 'row',
    marginTop: 4,
  },
  columna: {
    flex: 1,
  },
  tituloSeccion: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 12,
  },
  encabezadoUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconoUbicacion: {
    color: '#F28C28',
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 12,
  },
  nombreSeccion: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  textoSecundario: {
    color: '#A6A6A6',
    fontSize: 12,
    marginTop: 4,
  },
  mapaContenedor: {
    height: 230,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    backgroundColor: '#292929',
  },
  mapa: {
    width: '100%',
    height: '100%',
  },
  sinUbicacion: {
    backgroundColor: '#292929',
    borderRadius: 10,
    padding: 18,
    marginTop: 8,
  },
  sinUbicacionTitulo: {
    color: '#F28C28',
    fontSize: 15,
    fontWeight: '800',
  },
  avisoUbicacion: {
    color: '#A6A6A6',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
  },
  tarjetaFoto: {
    backgroundColor: '#1D1D1D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 12,
    marginBottom: 12,
    minHeight: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagen: {
    width: '100%',
    height: 280,
    borderRadius: 9,
    resizeMode: 'contain',
  },
  sinFoto: {
    color: '#A6A6A6',
    textAlign: 'center',
    padding: 20,
  },
  cargando: {
    color: '#FFFFFF',
    marginTop: 12,
  },
  texto: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
