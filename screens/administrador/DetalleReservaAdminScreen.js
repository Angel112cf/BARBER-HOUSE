import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  Linking,
} from 'react-native';

import { obtenerReservaAdminPorId } from '../../services/reservaAdminService';
import { supabase } from '../../services/supabase';

function DetalleReservaAdminScreen({ navigation, route }) {
  const reservaInicial = route?.params?.reserva;

  const [reserva, setReserva] = useState(reservaInicial || null);
  const [imagenReferencia, setImagenReferencia] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');

  const reservaId = reservaInicial?.id || route?.params?.reservaId;

  const cargarDetalle = useCallback(async (refrescar = false) => {
    if (!reservaId) {
      setError('No se recibió el identificador de la reserva.');
      setCargando(false);
      return;
    }

    try {
      if (refrescar) {
        setActualizando(true);
      } else {
        setCargando(true);
      }

      setError('');

      const datos = await obtenerReservaAdminPorId(reservaId);

      setReserva(datos);
      setImagenReferencia(null);

      // Las imágenes de referencias se encuentran en un bucket privado.
      if (datos.imagen_referencia) {
        const { data, error: errorImagen } = await supabase.storage
          .from('referencias-reservas')
          .createSignedUrl(datos.imagen_referencia, 3600);

        if (errorImagen) {
          console.error('ERROR AL CARGAR LA REFERENCIA:', errorImagen);
        } else {
          setImagenReferencia(data?.signedUrl || null);
        }
      }
    } catch (e) {
      console.error('ERROR AL CARGAR EL DETALLE:', e);
      setError(
        e.message || 'No se pudo cargar la información de la reserva.'
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, [reservaId]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';

    const partes = fecha.split('-');

    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const formatearHora = (hora) => {
    if (!hora) return 'No disponible';

    return hora.substring(0, 5);
  };

  const formatearPrecio = (precio) => {
    const valor = Number(precio);

    if (Number.isNaN(valor)) return 'No disponible';

    return `${valor.toFixed(2)} Bs`;
  };

  const obtenerEstado = (estado) => {
    switch (estado) {
      case 'pendiente de realizar':
        return {
          texto: 'Pendiente',
          color: '#F0A43A',
          fondo: 'rgba(240, 164, 58, 0.15)',
        };

      case 'realizada':
        return {
          texto: 'Realizada',
          color: '#43C58A',
          fondo: 'rgba(67, 197, 138, 0.15)',
        };

      case 'cancelada':
        return {
          texto: 'Cancelada',
          color: '#E45D5D',
          fondo: 'rgba(228, 93, 93, 0.15)',
        };

      default:
        return {
          texto: estado || 'Sin estado',
          color: '#AAAAAA',
          fondo: 'rgba(170, 170, 170, 0.12)',
        };
    }
  };

  const abrirUbicacion = async () => {
    if (!reserva?.latitud || !reserva?.longitud) return;

    const url = `https://www.google.com/maps/search/?api=1&query=${reserva.latitud},${reserva.longitud}`;

    try {
      await Linking.openURL(url);
    } catch (e) {
      console.error('ERROR AL ABRIR LA UBICACIÓN:', e);
    }
  };

  const renderDato = (etiqueta, valor) => (
    <View style={styles.datoFila} key={etiqueta}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <Text style={styles.valor}>{valor || 'No disponible'}</Text>
    </View>
  );

  const renderSeccion = (titulo, contenido) => (
    <View style={styles.tarjeta}>
      <Text style={styles.tituloSeccion}>{titulo}</Text>
      <View style={styles.separador} />
      {contenido}
    </View>
  );

  if (cargando) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <StatusBar barStyle="light-content" backgroundColor="#101010" />

        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#F28C28" />
          <Text style={styles.textoCargando}>
            Cargando detalle de la reserva...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !reserva) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <StatusBar barStyle="light-content" backgroundColor="#101010" />

        <View style={styles.encabezado}>
          <TouchableOpacity
            style={styles.botonVolver}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.iconoVolver}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.tituloEncabezado}>Detalle de reserva</Text>
        </View>

        <View style={styles.centrado}>
          <Text style={styles.iconoError}>!</Text>
          <Text style={styles.textoError}>{error}</Text>

          <TouchableOpacity
            style={styles.botonReintentar}
            onPress={() => cargarDetalle()}
          >
            <Text style={styles.textoBotonReintentar}>REINTENTAR</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const estado = obtenerEstado(reserva?.estado);

  const esDomicilio = reserva?.modalidad === 'domicilio';
  const esPersonalizado = reserva?.corte_personalizado;
  const imagenCorte = imagenReferencia || reserva?.imagen_url;

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="#101010" />

      <View style={styles.encabezado}>
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.iconoVolver}>‹</Text>
        </TouchableOpacity>

        <View style={styles.encabezadoTexto}>
          <Text style={styles.tituloEncabezado}>Detalle de reserva</Text>
          <Text style={styles.subtituloEncabezado}>
            Información completa de la cita
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => cargarDetalle(true)}
            tintColor="#F28C28"
            colors={['#F28C28']}
          />
        }
      >
        <View style={styles.tarjetaPrincipal}>
          <View style={styles.filaPrincipal}>
            <View style={styles.identificador}>
              <Text style={styles.etiquetaPrincipal}>RESERVA</Text>
              <Text style={styles.numeroReserva}>
                #{reserva?.id?.substring(0, 8)?.toUpperCase() || '--------'}
              </Text>
            </View>

            <View
              style={[
                styles.estado,
                { backgroundColor: estado.fondo },
              ]}
            >
              <View
                style={[
                  styles.puntoEstado,
                  { backgroundColor: estado.color },
                ]}
              />
              <Text style={[styles.textoEstado, { color: estado.color }]}>
                {estado.texto}
              </Text>
            </View>
          </View>

          <View style={styles.lineaPrincipal} />

          <Text style={styles.nombreServicio}>
            {reserva?.servicio || 'Servicio no disponible'}
          </Text>

          <Text style={styles.fechaPrincipal}>
            {formatearFecha(reserva?.fecha)} · {formatearHora(reserva?.hora)}
          </Text>
        </View>

        {renderSeccion(
          'INFORMACIÓN DEL SERVICIO',
          <>
            {renderDato('Servicio', reserva?.servicio)}
            {renderDato(
              'Modalidad',
              esDomicilio ? 'A domicilio' : 'En el local'
            )}
            {renderDato(
              'Servicio de barba',
              reserva?.incluye_barba ? 'Incluido' : 'No incluido'
            )}
            {renderDato('Precio base', formatearPrecio(reserva?.precio_base))}
            {renderDato('Precio total', formatearPrecio(reserva?.precio))}
          </>
        )}

        {renderSeccion(
          'DATOS DE LA CITA',
          <>
            {renderDato('Fecha', formatearFecha(reserva?.fecha))}
            {renderDato('Hora', formatearHora(reserva?.hora))}
            {renderDato(
              'Duración estimada',
              '60 minutos'
            )}
            {renderDato(
              'Fecha de registro',
              reserva?.created_at
                ? new Date(reserva.created_at).toLocaleDateString('es-BO')
                : 'No disponible'
            )}
          </>
        )}

        {renderSeccion(
          'INFORMACIÓN DEL CLIENTE',
          <>
            {renderDato('Nombre', reserva?.cliente_nombre)}
            {renderDato('Teléfono', reserva?.cliente_telefono)}
          </>
        )}

        {renderSeccion(
          'BARBERO ASIGNADO',
          <>
            {renderDato('Nombre', reserva?.barbero_nombre)}
          </>
        )}

        {esDomicilio &&
          renderSeccion(
            'UBICACIÓN DEL SERVICIO',
            <>
              {renderDato(
                'Dirección de referencia',
                reserva?.direccion_referencia
              )}

              {reserva?.latitud != null && reserva?.longitud != null ? (
                <>
                  {renderDato('Latitud', String(reserva.latitud))}
                  {renderDato('Longitud', String(reserva.longitud))}

                  <TouchableOpacity
                    style={styles.botonUbicacion}
                    onPress={abrirUbicacion}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.textoBotonUbicacion}>
                      VER UBICACIÓN EN MAPS
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.textoSecundario}>
                  No se registraron coordenadas para esta reserva.
                </Text>
              )}
            </>
          )}

        {esPersonalizado && (
          <View style={styles.tarjeta}>
            <Text style={styles.tituloSeccion}>CORTE PERSONALIZADO</Text>
            <View style={styles.separador} />

            <Text style={styles.descripcionImagen}>
              Fotografía de referencia enviada por el cliente.
            </Text>

            {imagenReferencia ? (
              <Image
                source={{ uri: imagenReferencia }}
                style={styles.imagenReferencia}
                resizeMode="cover"
              />
            ) : reserva?.imagen_referencia ? (
              <View style={styles.imagenCargando}>
                <ActivityIndicator color="#F28C28" size="small" />
                <Text style={styles.textoSecundario}>
                  Cargando fotografía...
                </Text>
              </View>
            ) : (
              <View style={styles.imagenVacia}>
                <Text style={styles.textoImagenVacia}>
                  No hay fotografía de referencia disponible.
                </Text>
              </View>
            )}
          </View>
        )}

        {!esPersonalizado && imagenCorte && (
          <View style={styles.tarjeta}>
            <Text style={styles.tituloSeccion}>REFERENCIA DEL SERVICIO</Text>
            <View style={styles.separador} />

            <Image
              source={{ uri: imagenCorte }}
              style={styles.imagenReferencia}
              resizeMode="cover"
            />
          </View>
        )}

        <View style={styles.notaFinal}>
          <Text style={styles.textoNota}>
            BARBER HOUSE · Gestión administrativa de reservas
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#101010',
  },

  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#151515',
    borderBottomWidth: 1,
    borderBottomColor: '#292929',
  },

  botonVolver: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  iconoVolver: {
    color: '#F28C28',
    fontSize: 34,
    lineHeight: 38,
    marginTop: -4,
  },

  encabezadoTexto: {
    flex: 1,
  },

  tituloEncabezado: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  subtituloEncabezado: {
    color: '#929292',
    fontSize: 11,
    marginTop: 3,
  },

  logoEncabezado: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#F28C28',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },

  contenido: {
    padding: 18,
    paddingBottom: 35,
  },

  tarjetaPrincipal: {
    backgroundColor: '#1D1D1D',
    borderRadius: 18,
    padding: 19,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#343434',
    borderLeftWidth: 4,
    borderLeftColor: '#F28C28',
  },

  filaPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  identificador: {
    flex: 1,
  },

  etiquetaPrincipal: {
    color: '#858585',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },

  numeroReserva: {
    color: '#F28C28',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 5,
  },

  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
  },

  puntoEstado: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  textoEstado: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  lineaPrincipal: {
    height: 1,
    backgroundColor: '#363636',
    marginVertical: 17,
  },

  nombreServicio: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: 'bold',
  },

  fechaPrincipal: {
    color: '#F28C28',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },

  tarjeta: {
    backgroundColor: '#1B1B1B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#303030',
  },

  tituloSeccion: {
    color: '#F28C28',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  separador: {
    height: 1,
    backgroundColor: '#343434',
    marginTop: 13,
    marginBottom: 7,
  },

  datoFila: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#292929',
  },

  etiqueta: {
    color: '#858585',
    fontSize: 11,
    marginBottom: 5,
  },

  valor: {
    color: '#F2F2F2',
    fontSize: 14,
    fontWeight: '600',
  },

  botonUbicacion: {
    backgroundColor: '#F28C28',
    paddingVertical: 13,
    borderRadius: 11,
    alignItems: 'center',
    marginTop: 16,
  },

  textoBotonUbicacion: {
    color: '#171717',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  descripcionImagen: {
    color: '#A0A0A0',
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 13,
  },

  imagenReferencia: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#292929',
  },

  imagenCargando: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252525',
    borderRadius: 12,
    gap: 10,
  },

  imagenVacia: {
    minHeight: 100,
    backgroundColor: '#252525',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  textoImagenVacia: {
    color: '#929292',
    fontSize: 12,
    textAlign: 'center',
  },

  textoSecundario: {
    color: '#929292',
    fontSize: 12,
    marginTop: 10,
    lineHeight: 18,
  },

  notaFinal: {
    alignItems: 'center',
    paddingVertical: 15,
  },

  textoNota: {
    color: '#656565',
    fontSize: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  textoCargando: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 15,
  },

  iconoError: {
    color: '#F28C28',
    fontSize: 38,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  textoError: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },

  botonReintentar: {
    backgroundColor: '#F28C28',
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 22,
  },

  textoBotonReintentar: {
    color: '#171717',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default DetalleReservaAdminScreen;
